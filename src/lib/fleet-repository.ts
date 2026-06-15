import { Prisma } from "@prisma/client";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { formatKes, fleet as demoFleet, institutions as demoInstitutions } from "@/data/demo";
import { type SessionUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getPrisma, hasDatabaseUrl } from "@/lib/prisma";
import {
  accidentLogSchema,
  fleetVehicleSchema,
  fuelLogSchema,
  insuranceRecordSchema,
  serviceRecordSchema,
  type AccidentLogInput,
  type FleetVehicleInput,
  type FuelLogInput,
  type InsuranceRecordInput,
  type ServiceRecordInput,
} from "@/lib/fleet-validation";

const readAllFleetRoles = new Set(["NATIONAL_TREASURY_SUPER_ADMIN", "AUDITOR", "READ_ONLY_INSPECTOR"]);
const editFleetRoles = new Set(["NATIONAL_TREASURY_SUPER_ADMIN", "FLEET_OFFICER"]);
const archiveFleetRoles = new Set(["NATIONAL_TREASURY_SUPER_ADMIN", "FLEET_OFFICER"]);

type FleetAssetRow = Prisma.FleetAssetGetPayload<{
  include: {
    asset: {
      include: {
        category: true;
        institution: true;
        department: true;
        locationRef: true;
        assignedUser: true;
        movements: { include: { fromLocation: true; toLocation: true; fromUser: true; toUser: true }; orderBy: { movedAt: "desc" } };
        maintenanceRequests: { orderBy: { createdAt: "desc" } };
        auditLogs: { include: { actor: true }; orderBy: { createdAt: "desc" } };
        documents: { orderBy: { createdAt: "desc" } };
      };
    };
    fuelLogRecords: { orderBy: { date: "desc" } };
    serviceRecords: { orderBy: { serviceDate: "desc" } };
    insuranceRecords: { orderBy: { expiryDate: "desc" } };
    accidentLogs: { orderBy: { accidentDate: "desc" } };
    vehicleAssignments: { include: { driver: true }; orderBy: { assignedAt: "desc" } };
    vehicleDocuments: { orderBy: { createdAt: "desc" } };
  };
}>;

export type DisposalRecommendation = "Not due" | "Monitor" | "Recommend inspection" | "Recommend disposal";

export type FleetVehicle = {
  id: string;
  assetId: string;
  assetCode: string;
  name: string;
  description: string;
  registrationNumber: string;
  ntsaRegistrationStatus: string;
  make: string;
  model: string;
  bodyType: string;
  yearOfManufacture: number;
  engineNumber: string;
  chassisNumber: string;
  institution: string;
  institutionCode: string;
  department: string;
  location: string;
  assignedDriver: string;
  driverPayrollNo?: string;
  currentMileage: number;
  fuelType: string;
  tankCapacityLitres: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceStartDate?: string;
  insuranceExpiry: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  nextServiceMileage?: number;
  serviceStatus: "Current" | "Due soon" | "Overdue";
  condition: string;
  status: string;
  purchaseCost: number;
  currentValue: number;
  disposalRecommendation: DisposalRecommendation;
  gpsTrackerId?: string;
  gpsLastKnownLocation?: string;
  gpsLastSyncAt?: string;
  gpsMileageSyncStatus?: string;
  fuelCardNumber?: string;
  remarks?: string;
  fuelLogs: FleetFuelLog[];
  serviceRecords: FleetServiceRecord[];
  insuranceRecords: FleetInsuranceRecord[];
  accidentLogs: FleetAccidentLog[];
  movements: { reason: string; date: string; from: string; to: string }[];
  maintenanceHistory: { requestNo: string; status: string; priority: string; cost: number; createdAt: string }[];
  auditLogs: { action: string; actor: string; date: string; module: string }[];
  documents: { name: string; type: string; createdAt: string }[];
};

export type FleetFuelLog = {
  id: string;
  vehicle: string;
  date: string;
  odometerReadingKm: number;
  litres: number;
  costPerLitre: number;
  totalCost: number;
  fuelStation: string;
  fuelCardReference?: string;
  consumptionRate?: number;
  abnormalFlag: boolean;
  remarks?: string;
};

export type FleetServiceRecord = {
  id: string;
  vehicle: string;
  serviceDate: string;
  serviceType: string;
  vendor: string;
  odometerReadingKm: number;
  workDone: string;
  partsReplaced?: string;
  labourCost: number;
  partsCost: number;
  totalCost: number;
  nextServiceDate?: string;
  nextServiceMileage?: number;
  remarks?: string;
};

export type FleetInsuranceRecord = {
  id: string;
  vehicle: string;
  provider: string;
  policyNumber: string;
  coverType: string;
  startDate: string;
  expiryDate: string;
  premiumAmount: number;
  renewalStatus: string;
};

export type FleetAccidentLog = {
  id: string;
  vehicle: string;
  accidentDate: string;
  location: string;
  driver: string;
  description: string;
  policeAbstractNumber?: string;
  insuranceClaimNumber?: string;
  repairEstimate: number;
  actualRepairCost: number;
  status: string;
};

function iso(date?: Date | string | null) {
  if (!date) return undefined;
  return new Date(date).toISOString().slice(0, 10);
}

function currentValue(asset: { purchaseCost: Prisma.Decimal | number; residualValue?: Prisma.Decimal | number | null; acquisitionDate: Date; usefulLifeYears: number }) {
  const cost = Number(asset.purchaseCost);
  const residual = Number(asset.residualValue ?? 0);
  const years = Math.max(0, new Date().getFullYear() - asset.acquisitionDate.getFullYear());
  const annual = asset.usefulLifeYears > 0 ? (cost - residual) / asset.usefulLifeYears : 0;
  return Math.max(residual, Math.round(cost - annual * years));
}

function serviceStatus(row: FleetAssetRow) {
  const today = new Date();
  const dueDate = row.nextServiceDate;
  const dueMileage = row.nextServiceMileage;
  if ((dueDate && dueDate < today) || (dueMileage && row.mileageKm >= dueMileage)) return "Overdue";
  if ((dueDate && dueDate.getTime() - today.getTime() < 1000 * 60 * 60 * 24 * 30) || (dueMileage && dueMileage - row.mileageKm <= 1000)) return "Due soon";
  return "Current";
}

function disposalRecommendation(row: FleetAssetRow): DisposalRecommendation {
  const age = new Date().getFullYear() - row.yearOfManufacture;
  const value = currentValue(row.asset);
  const serviceCost = row.serviceRecords.reduce((sum, item) => sum + Number(item.totalCost), 0);
  const accidentCost = row.accidentLogs.reduce((sum, item) => sum + Number(item.actualRepairCost), 0);
  const repairRatio = value > 0 ? (serviceCost + accidentCost) / value : 0;
  const poor = row.asset.condition === "POOR" || row.asset.condition === "UNSERVICEABLE" || row.asset.status === "DUE_DISPOSAL";
  if (poor || repairRatio >= 0.5 || row.mileageKm >= 250000 || age >= 12) return "Recommend disposal";
  if (repairRatio >= 0.35 || row.mileageKm >= 200000 || age >= 9 || row.accidentLogs.length >= 2) return "Recommend inspection";
  if (repairRatio >= 0.2 || row.mileageKm >= 150000 || age >= 7) return "Monitor";
  return "Not due";
}

function mapFuelLog(log: FleetAssetRow["fuelLogRecords"][number], vehicle: string): FleetFuelLog {
  return {
    id: log.id,
    vehicle,
    date: iso(log.date) ?? "",
    odometerReadingKm: log.odometerReadingKm,
    litres: Number(log.litres),
    costPerLitre: Number(log.costPerLitre),
    totalCost: Number(log.totalCost),
    fuelStation: log.fuelStation,
    fuelCardReference: log.fuelCardReference ?? undefined,
    consumptionRate: log.consumptionRate ? Number(log.consumptionRate) : undefined,
    abnormalFlag: log.abnormalFlag,
    remarks: log.remarks ?? undefined,
  };
}

function mapServiceRecord(record: FleetAssetRow["serviceRecords"][number], vehicle: string): FleetServiceRecord {
  return {
    id: record.id,
    vehicle,
    serviceDate: iso(record.serviceDate) ?? "",
    serviceType: record.serviceType,
    vendor: record.vendor,
    odometerReadingKm: record.odometerReadingKm,
    workDone: record.workDone,
    partsReplaced: record.partsReplaced ?? undefined,
    labourCost: Number(record.labourCost),
    partsCost: Number(record.partsCost),
    totalCost: Number(record.totalCost),
    nextServiceDate: iso(record.nextServiceDate),
    nextServiceMileage: record.nextServiceMileage ?? undefined,
    remarks: record.remarks ?? undefined,
  };
}

function mapInsuranceRecord(record: FleetAssetRow["insuranceRecords"][number], vehicle: string): FleetInsuranceRecord {
  return {
    id: record.id,
    vehicle,
    provider: record.provider,
    policyNumber: record.policyNumber,
    coverType: record.coverType,
    startDate: iso(record.startDate) ?? "",
    expiryDate: iso(record.expiryDate) ?? "",
    premiumAmount: Number(record.premiumAmount),
    renewalStatus: record.renewalStatus,
  };
}

function mapAccidentLog(record: FleetAssetRow["accidentLogs"][number], vehicle: string): FleetAccidentLog {
  return {
    id: record.id,
    vehicle,
    accidentDate: iso(record.accidentDate) ?? "",
    location: record.location,
    driver: record.driver,
    description: record.description,
    policeAbstractNumber: record.policeAbstractNumber ?? undefined,
    insuranceClaimNumber: record.insuranceClaimNumber ?? undefined,
    repairEstimate: Number(record.repairEstimate),
    actualRepairCost: Number(record.actualRepairCost),
    status: record.status,
  };
}

function mapFleetRow(row: FleetAssetRow): FleetVehicle {
  const vehicleName = `${row.registrationNumber} ${row.make} ${row.model}`;
  return {
    id: row.id,
    assetId: row.assetId,
    assetCode: row.asset.assetCode,
    name: row.asset.name,
    description: row.asset.description,
    registrationNumber: row.registrationNumber,
    ntsaRegistrationStatus: row.ntsaRegistrationStatus,
    make: row.make,
    model: row.model,
    bodyType: row.bodyType,
    yearOfManufacture: row.yearOfManufacture,
    engineNumber: row.engineNumber,
    chassisNumber: row.chassisNumber,
    institution: row.asset.institution.name,
    institutionCode: row.asset.institution.code,
    department: row.asset.department?.name ?? "Unassigned",
    location: row.asset.locationRef?.name ?? row.asset.location,
    assignedDriver: row.driverAssigned ?? row.asset.assignedUser?.fullName ?? "Unassigned",
    driverPayrollNo: row.driverPayrollNo ?? row.asset.assignedUser?.payrollNo ?? undefined,
    currentMileage: row.mileageKm,
    fuelType: row.fuelType,
    tankCapacityLitres: Number(row.tankCapacityLitres),
    insuranceProvider: row.insuranceProvider ?? undefined,
    insurancePolicyNumber: row.insurancePolicyNumber ?? undefined,
    insuranceStartDate: iso(row.insuranceStartDate),
    insuranceExpiry: iso(row.insuranceExpiry) ?? "",
    lastServiceDate: iso(row.lastServiceDate),
    nextServiceDate: iso(row.nextServiceDate),
    nextServiceMileage: row.nextServiceMileage ?? undefined,
    serviceStatus: serviceStatus(row),
    condition: row.asset.condition,
    status: row.asset.status,
    purchaseCost: Number(row.asset.purchaseCost),
    currentValue: currentValue(row.asset),
    disposalRecommendation: disposalRecommendation(row),
    gpsTrackerId: row.gpsTrackerId ?? undefined,
    gpsLastKnownLocation: row.gpsLastKnownLocation ?? undefined,
    gpsLastSyncAt: iso(row.gpsLastSyncAt),
    gpsMileageSyncStatus: row.gpsMileageSyncStatus ?? undefined,
    fuelCardNumber: row.fuelCardNumber ?? undefined,
    remarks: row.remarks ?? undefined,
    fuelLogs: row.fuelLogRecords.map((item) => mapFuelLog(item, vehicleName)),
    serviceRecords: row.serviceRecords.map((item) => mapServiceRecord(item, vehicleName)),
    insuranceRecords: row.insuranceRecords.map((item) => mapInsuranceRecord(item, vehicleName)),
    accidentLogs: row.accidentLogs.map((item) => mapAccidentLog(item, vehicleName)),
    movements: row.asset.movements.map((item) => ({
      reason: item.reason,
      date: iso(item.movedAt) ?? "",
      from: item.fromLocation?.name ?? item.fromUser?.fullName ?? "Registry",
      to: item.toLocation?.name ?? item.toUser?.fullName ?? row.asset.location,
    })),
    maintenanceHistory: row.asset.maintenanceRequests.map((item) => ({
      requestNo: item.requestNo,
      status: item.status,
      priority: item.priority,
      cost: Number(item.actualCost || item.budgetEstimate),
      createdAt: iso(item.createdAt) ?? "",
    })),
    auditLogs: row.asset.auditLogs.map((item) => ({
      action: item.action,
      module: item.module,
      actor: item.actor?.fullName ?? "System",
      date: iso(item.createdAt) ?? "",
    })),
    documents: [
      ...row.asset.documents.map((item) => ({ name: item.name, type: item.mimeType, createdAt: iso(item.createdAt) ?? "" })),
      ...row.vehicleDocuments.map((item) => ({ name: item.name, type: item.documentType, createdAt: iso(item.createdAt) ?? "" })),
    ],
  };
}

async function resolveDbUser(user: SessionUser | null) {
  if (!user || !hasDatabaseUrl()) return null;
  return getPrisma().user.findUnique({
    where: { email: user.email },
    include: { primaryRole: true, institution: true, department: true },
  });
}

async function scopedFleetWhere(user: SessionUser | null): Promise<Prisma.FleetAssetWhereInput> {
  if (!user) return {};
  const dbUser = await resolveDbUser(user);

  if (readAllFleetRoles.has(user.role)) return {};

  if (user.role === "EMPLOYEE_USER") {
    return {
      OR: [
        { asset: { assignedUser: { email: user.email } } },
        ...(dbUser?.payrollNo ? [{ driverPayrollNo: dbUser.payrollNo }] : []),
        ...(dbUser?.id ? [{ vehicleAssignments: { some: { driverId: dbUser.id, releasedAt: null } } }] : []),
      ],
    };
  }

  if (user.role === "DEPARTMENT_ASSET_OFFICER" && dbUser?.departmentId) {
    return { asset: { departmentId: dbUser.departmentId } };
  }

  if (dbUser?.institutionId) return { asset: { institutionId: dbUser.institutionId } };
  return { asset: { institution: { name: user.institution } } };
}

async function activeScopedFleetWhere(user: SessionUser | null, extra?: Prisma.FleetAssetWhereInput): Promise<Prisma.FleetAssetWhereInput> {
  return {
    AND: [
      await scopedFleetWhere(user),
      { archivedAt: null },
      { asset: { archivedAt: null } },
      ...(extra ? [extra] : []),
    ],
  };
}

function canEditFleet(user: SessionUser | null) {
  return Boolean(user && editFleetRoles.has(user.role));
}

function canArchiveFleet(user: SessionUser | null) {
  return Boolean(user && archiveFleetRoles.has(user.role));
}

const fleetInclude = {
  asset: {
    include: {
      category: true,
      institution: true,
      department: true,
      locationRef: true,
      assignedUser: true,
      movements: { include: { fromLocation: true, toLocation: true, fromUser: true, toUser: true }, orderBy: { movedAt: "desc" } },
      maintenanceRequests: { orderBy: { createdAt: "desc" } },
      auditLogs: { include: { actor: true }, orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  },
  fuelLogRecords: { orderBy: { date: "desc" } },
  serviceRecords: { orderBy: { serviceDate: "desc" } },
  insuranceRecords: { orderBy: { expiryDate: "desc" } },
  accidentLogs: { orderBy: { accidentDate: "desc" } },
  vehicleAssignments: { include: { driver: true }, orderBy: { assignedAt: "desc" } },
  vehicleDocuments: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.FleetAssetInclude;

function demoVehicles(): FleetVehicle[] {
  return demoFleet.map((item, index) => ({
    id: `demo-fleet-${index + 1}`,
    assetId: `demo-asset-${index + 1}`,
    assetCode: `IGAMIS-${item.institution.includes("Wildlife") ? "KWS" : item.institution.includes("Health") ? "MOH" : "TNT"}-VEH-2026-${String(index + 1).padStart(6, "0")}`,
    name: item.registrationNumber.includes("771") ? "Nissan Patrol field vehicle" : "Toyota Land Cruiser",
    description: "Demo fleet record",
    registrationNumber: item.registrationNumber,
    ntsaRegistrationStatus: "VERIFIED",
    make: item.registrationNumber.includes("771") ? "Nissan" : "Toyota",
    model: item.registrationNumber.includes("771") ? "Patrol" : "Land Cruiser",
    bodyType: "SUV",
    yearOfManufacture: 2022,
    engineNumber: "DEMO-ENGINE",
    chassisNumber: "DEMO-CHASSIS",
    institution: item.institution,
    institutionCode: "GOK",
    department: "Administration",
    location: `${item.institution} Headquarters`,
    assignedDriver: "Central Transport Pool",
    currentMileage: item.mileageKm,
    fuelType: item.fuelType,
    tankCapacityLitres: 80,
    insuranceExpiry: "2026-12-31",
    nextServiceDate: item.nextService,
    serviceStatus: item.nextService <= new Date().toISOString().slice(0, 10) ? "Overdue" : "Current",
    condition: item.anomaly === "Fuel spike 18%" ? "FAIR" : "GOOD",
    status: item.anomaly === "Fuel spike 18%" ? "UNDER_MAINTENANCE" : "ACTIVE",
    purchaseCost: 9000000,
    currentValue: 6500000,
    disposalRecommendation: item.mileageKm > 120000 ? "Recommend inspection" : "Not due",
    fuelLogs: [],
    serviceRecords: [],
    insuranceRecords: [],
    accidentLogs: [],
    movements: [],
    maintenanceHistory: [],
    auditLogs: [],
    documents: [],
  }));
}

export async function listFleetVehicles(user: SessionUser | null): Promise<FleetVehicle[]> {
  if (!hasDatabaseUrl()) return demoVehicles();
  const rows = await getPrisma().fleetAsset.findMany({
    where: await activeScopedFleetWhere(user),
    include: fleetInclude,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapFleetRow);
}

export async function getFleetVehicle(id: string, user: SessionUser | null) {
  if (!hasDatabaseUrl()) {
    const vehicle = demoVehicles().find((item) => item.id === id || item.registrationNumber === id);
    return vehicle ? { vehicle, qrSvg: await generateVehicleQrSvg(vehicle) } : null;
  }

  const prisma = getPrisma();
  const row = await prisma.fleetAsset.findFirst({
    where: await activeScopedFleetWhere(user, { id }),
    include: fleetInclude,
  });
  if (!row) return null;
  const vehicle = mapFleetRow(row);
  const dbUser = await resolveDbUser(user);
  await writeAuditLog({ actorId: dbUser?.id, action: "VIEW", module: "fleet", recordId: row.id, assetId: row.assetId });
  return { vehicle, qrSvg: await generateVehicleQrSvg(vehicle) };
}

export async function getFleetLookups(user: SessionUser | null) {
  if (!hasDatabaseUrl()) {
    return {
      institutions: demoInstitutions.map((item) => ({ id: item.name, name: item.name, code: item.code })),
      departments: [{ id: "Administration", name: "Administration", institutionId: user?.institution ?? "The National Treasury" }],
      locations: [{ id: "Headquarters", name: "Headquarters", institutionId: user?.institution ?? "The National Treasury" }],
      users: [{ id: user?.email ?? "employee@igamis.go.ke", fullName: user?.name ?? "Demo User", email: user?.email ?? "employee@igamis.go.ke", payrollNo: "DEMO-001" }],
    };
  }

  const prisma = getPrisma();
  const scope = await scopedFleetWhere(user);
  const institutionId = "asset" in scope && typeof scope.asset === "object" && "institutionId" in scope.asset && typeof scope.asset.institutionId === "string"
    ? scope.asset.institutionId
    : undefined;
  const [institutions, departments, locations, users] = await Promise.all([
    prisma.institution.findMany({ where: institutionId ? { id: institutionId } : {}, orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: institutionId ? { institutionId } : {}, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: institutionId ? { institutionId } : {}, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: institutionId ? { institutionId } : {}, orderBy: { fullName: "asc" } }),
  ]);
  return {
    institutions: institutions.map((item) => ({ id: item.id, name: item.name, code: item.code })),
    departments: departments.map((item) => ({ id: item.id, name: item.name, institutionId: item.institutionId })),
    locations: locations.map((item) => ({ id: item.id, name: item.name, institutionId: item.institutionId })),
    users: users.map((item) => ({ id: item.id, fullName: item.fullName, email: item.email, payrollNo: item.payrollNo, institutionId: item.institutionId })),
  };
}

async function nextVehicleAssetCode(input: FleetVehicleInput) {
  const prisma = getPrisma();
  const [institution, category] = await Promise.all([
    prisma.institution.findUniqueOrThrow({ where: { id: input.institutionId } }),
    prisma.assetCategory.findFirstOrThrow({ where: { OR: [{ code: "VEH" }, { name: "Vehicles" }] } }),
  ]);
  const year = new Date(input.acquisitionDate).getFullYear();
  const prefix = `IGAMIS-${institution.code}-${category.code}-${year}`;
  const count = await prisma.asset.count({ where: { assetCode: { startsWith: prefix } } });
  return { assetCode: `${prefix}-${String(count + 1).padStart(6, "0")}`, category, institution };
}

function vehicleQrPayload(vehicle: Pick<FleetVehicle, "id" | "assetId" | "assetCode" | "registrationNumber" | "institution" | "make" | "model">) {
  return JSON.stringify({
    assetCode: vehicle.assetCode,
    assetId: vehicle.assetId,
    fleetAssetId: vehicle.id,
    registrationNumber: vehicle.registrationNumber,
    institution: vehicle.institution,
    vehicle: `${vehicle.make} ${vehicle.model}`,
    verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://igamis.go.ke"}/fleet/${vehicle.id}`,
  });
}

export async function generateVehicleQrSvg(vehicle: Pick<FleetVehicle, "id" | "assetId" | "assetCode" | "registrationNumber" | "institution" | "make" | "model">) {
  return QRCode.toString(vehicleQrPayload(vehicle), {
    type: "svg",
    margin: 1,
    width: 184,
    color: { dark: "#052e1b", light: "#ffffff" },
  });
}

export async function getFleetFormValues(id: string, user: SessionUser | null) {
  if (!hasDatabaseUrl()) return null;
  const row = await getPrisma().fleetAsset.findFirst({
    where: await activeScopedFleetWhere(user, { id }),
    include: { asset: true },
  });
  if (!row) return null;
  return {
    name: row.asset.name,
    description: row.asset.description,
    institutionId: row.asset.institutionId,
    departmentId: row.asset.departmentId ?? "",
    locationId: row.asset.locationId ?? "",
    location: row.asset.location,
    acquisitionDate: iso(row.asset.acquisitionDate) ?? "",
    purchaseCost: Number(row.asset.purchaseCost),
    supplier: row.asset.supplier ?? "",
    usefulLifeYears: row.asset.usefulLifeYears,
    depreciationMethod: row.asset.depreciationMethod,
    condition: row.asset.condition,
    status: row.asset.status,
    assignedUserId: row.asset.assignedUserId ?? "",
    registrationNumber: row.registrationNumber,
    ntsaRegistrationStatus: row.ntsaRegistrationStatus,
    make: row.make,
    model: row.model,
    bodyType: row.bodyType,
    yearOfManufacture: row.yearOfManufacture,
    engineNumber: row.engineNumber,
    chassisNumber: row.chassisNumber,
    fuelType: row.fuelType as "Diesel" | "Petrol" | "Hybrid" | "Electric" | "LPG",
    tankCapacityLitres: Number(row.tankCapacityLitres),
    mileageKm: row.mileageKm,
    driverAssigned: row.driverAssigned ?? "",
    driverPayrollNo: row.driverPayrollNo ?? "",
    insuranceProvider: row.insuranceProvider ?? "",
    insurancePolicyNumber: row.insurancePolicyNumber ?? "",
    insuranceStartDate: iso(row.insuranceStartDate) ?? "",
    insuranceExpiry: iso(row.insuranceExpiry) ?? "",
    lastServiceDate: iso(row.lastServiceDate) ?? "",
    nextServiceDate: iso(row.nextServiceDate) ?? "",
    nextServiceMileage: row.nextServiceMileage ?? undefined,
    gpsTrackerId: row.gpsTrackerId ?? "",
    fuelCardNumber: row.fuelCardNumber ?? "",
    remarks: row.remarks ?? "",
  };
}

export async function createFleetVehicle(input: unknown, user: SessionUser | null) {
  const parsed = fleetVehicleSchema.parse(input);
  if (!canEditFleet(user)) throw new Error("You do not have permission to create fleet records.");
  if (!hasDatabaseUrl()) throw new Error("DATABASE_URL is required for persistent fleet creation.");

  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const { assetCode, category, institution } = await nextVehicleAssetCode(parsed);
  const asset = await prisma.asset.create({
    data: {
      assetCode,
      name: parsed.name,
      qrCode: JSON.stringify({ assetCode, institution: institution.name, category: category.name, verificationUrl: `https://igamis.go.ke/verify/${assetCode}` }),
      barcode: assetCode,
      serialNumber: parsed.chassisNumber,
      assetTagNumber: parsed.registrationNumber,
      categoryId: category.id,
      description: parsed.description,
      institutionId: parsed.institutionId,
      departmentId: parsed.departmentId || null,
      locationId: parsed.locationId || null,
      location: parsed.location,
      acquisitionDate: new Date(parsed.acquisitionDate),
      purchaseCost: parsed.purchaseCost,
      supplier: parsed.supplier ?? null,
      usefulLifeYears: parsed.usefulLifeYears,
      depreciationMethod: parsed.depreciationMethod,
      condition: parsed.condition,
      status: parsed.status,
      assignedUserId: parsed.assignedUserId || null,
      warrantyExpiry: parsed.insuranceExpiry ? new Date(parsed.insuranceExpiry) : null,
      photos: [],
      tags: ["fleet", "vehicle"],
    },
  });
  const fleet = await prisma.fleetAsset.create({
    data: {
      assetId: asset.id,
      registrationNumber: parsed.registrationNumber,
      ntsaRegistrationStatus: parsed.ntsaRegistrationStatus,
      make: parsed.make,
      model: parsed.model,
      bodyType: parsed.bodyType,
      yearOfManufacture: parsed.yearOfManufacture,
      engineNumber: parsed.engineNumber,
      chassisNumber: parsed.chassisNumber,
      fuelType: parsed.fuelType,
      tankCapacityLitres: parsed.tankCapacityLitres,
      driverAssigned: parsed.driverAssigned ?? null,
      driverPayrollNo: parsed.driverPayrollNo ?? null,
      mileageKm: parsed.mileageKm,
      insuranceProvider: parsed.insuranceProvider ?? null,
      insurancePolicyNumber: parsed.insurancePolicyNumber ?? null,
      insuranceStartDate: parsed.insuranceStartDate ? new Date(parsed.insuranceStartDate) : null,
      insuranceExpiry: new Date(parsed.insuranceExpiry),
      lastServiceDate: parsed.lastServiceDate ? new Date(parsed.lastServiceDate) : null,
      nextServiceDate: parsed.nextServiceDate ? new Date(parsed.nextServiceDate) : null,
      nextServiceMileage: parsed.nextServiceMileage ?? null,
      gpsTrackerId: parsed.gpsTrackerId ?? null,
      fuelCardNumber: parsed.fuelCardNumber ?? null,
      remarks: parsed.remarks ?? null,
    },
  });

  if (parsed.driverAssigned) {
    await prisma.vehicleAssignment.create({
      data: {
        fleetAssetId: fleet.id,
        driverName: parsed.driverAssigned,
        payrollNo: parsed.driverPayrollNo ?? null,
        notes: "Initial vehicle assignment",
      },
    });
  }

  await writeAuditLog({ actorId: dbUser?.id, action: "CREATE", module: "fleet", recordId: fleet.id, assetId: asset.id, newValue: { asset, fleet } });
  revalidateFleet();
  return fleet;
}

export async function updateFleetVehicle(id: string, input: unknown, user: SessionUser | null) {
  const parsed = fleetVehicleSchema.parse(input);
  if (!canEditFleet(user)) throw new Error("You do not have permission to edit fleet records.");
  if (!hasDatabaseUrl()) throw new Error("DATABASE_URL is required for persistent fleet updates.");

  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const before = await prisma.fleetAsset.findFirstOrThrow({ where: await activeScopedFleetWhere(user, { id }), include: { asset: true } });
  const asset = await prisma.asset.update({
    where: { id: before.assetId },
    data: {
      name: parsed.name,
      description: parsed.description,
      institutionId: parsed.institutionId,
      departmentId: parsed.departmentId || null,
      locationId: parsed.locationId || null,
      location: parsed.location,
      acquisitionDate: new Date(parsed.acquisitionDate),
      purchaseCost: parsed.purchaseCost,
      supplier: parsed.supplier ?? null,
      usefulLifeYears: parsed.usefulLifeYears,
      depreciationMethod: parsed.depreciationMethod,
      condition: parsed.condition,
      status: parsed.status,
      assignedUserId: parsed.assignedUserId || null,
      serialNumber: parsed.chassisNumber,
      assetTagNumber: parsed.registrationNumber,
      warrantyExpiry: new Date(parsed.insuranceExpiry),
    },
  });
  const fleet = await prisma.fleetAsset.update({
    where: { id },
    data: {
      registrationNumber: parsed.registrationNumber,
      ntsaRegistrationStatus: parsed.ntsaRegistrationStatus,
      make: parsed.make,
      model: parsed.model,
      bodyType: parsed.bodyType,
      yearOfManufacture: parsed.yearOfManufacture,
      engineNumber: parsed.engineNumber,
      chassisNumber: parsed.chassisNumber,
      fuelType: parsed.fuelType,
      tankCapacityLitres: parsed.tankCapacityLitres,
      driverAssigned: parsed.driverAssigned ?? null,
      driverPayrollNo: parsed.driverPayrollNo ?? null,
      mileageKm: parsed.mileageKm,
      insuranceProvider: parsed.insuranceProvider ?? null,
      insurancePolicyNumber: parsed.insurancePolicyNumber ?? null,
      insuranceStartDate: parsed.insuranceStartDate ? new Date(parsed.insuranceStartDate) : null,
      insuranceExpiry: new Date(parsed.insuranceExpiry),
      lastServiceDate: parsed.lastServiceDate ? new Date(parsed.lastServiceDate) : null,
      nextServiceDate: parsed.nextServiceDate ? new Date(parsed.nextServiceDate) : null,
      nextServiceMileage: parsed.nextServiceMileage ?? null,
      gpsTrackerId: parsed.gpsTrackerId ?? null,
      fuelCardNumber: parsed.fuelCardNumber ?? null,
      remarks: parsed.remarks ?? null,
    },
  });

  if (before.driverAssigned !== parsed.driverAssigned && parsed.driverAssigned) {
    await prisma.vehicleAssignment.create({
      data: {
        fleetAssetId: fleet.id,
        driverName: parsed.driverAssigned,
        payrollNo: parsed.driverPayrollNo ?? null,
        notes: "Vehicle assignment updated",
      },
    });
  }

  await writeAuditLog({ actorId: dbUser?.id, action: "UPDATE", module: "fleet", recordId: fleet.id, assetId: asset.id, oldValue: before, newValue: { asset, fleet } });
  revalidateFleet(id);
  return fleet;
}

export async function archiveFleetVehicle(id: string, user: SessionUser | null) {
  if (!canArchiveFleet(user)) throw new Error("You do not have permission to archive fleet records.");
  if (!hasDatabaseUrl()) throw new Error("DATABASE_URL is required for persistent fleet archive.");
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const before = await prisma.fleetAsset.findFirstOrThrow({ where: await activeScopedFleetWhere(user, { id }), include: { asset: true } });
  const fleet = await prisma.fleetAsset.update({ where: { id }, data: { archivedAt: new Date() } });
  const asset = await prisma.asset.update({ where: { id: before.assetId }, data: { archivedAt: new Date(), status: "DISPOSED" } });
  await writeAuditLog({ actorId: dbUser?.id, action: "ARCHIVE", module: "fleet", recordId: id, assetId: asset.id, oldValue: before, newValue: { asset, fleet } });
  revalidateFleet();
  return fleet;
}

async function assertCanAddOperationalRecord(fleetAssetId: string, user: SessionUser | null) {
  if (!canEditFleet(user)) throw new Error("You do not have permission to add fleet operational records.");
  const row = await getPrisma().fleetAsset.findFirst({ where: await activeScopedFleetWhere(user, { id: fleetAssetId }), include: { asset: true } });
  if (!row) throw new Error("Fleet vehicle was not found in your authorized scope.");
  return row;
}

export async function addFuelLog(input: unknown, user: SessionUser | null) {
  const parsed = fuelLogSchema.parse(input);
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const fleet = await assertCanAddOperationalRecord(parsed.fleetAssetId, user);
  const previous = await prisma.fuelLog.findFirst({ where: { fleetAssetId: parsed.fleetAssetId }, orderBy: { date: "desc" } });
  const distance = previous ? parsed.odometerReadingKm - previous.odometerReadingKm : 0;
  const consumptionRate = distance > 0 ? Number(((parsed.litres / distance) * 100).toFixed(2)) : null;
  const abnormalFlag = Boolean(consumptionRate && consumptionRate > 18);
  const totalCost = Number((parsed.litres * parsed.costPerLitre).toFixed(2));
  const log = await prisma.fuelLog.create({
    data: {
      fleetAssetId: parsed.fleetAssetId,
      date: new Date(parsed.date),
      odometerReadingKm: parsed.odometerReadingKm,
      litres: parsed.litres,
      costPerLitre: parsed.costPerLitre,
      totalCost,
      fuelStation: parsed.fuelStation,
      fuelCardReference: parsed.fuelCardReference ?? null,
      recordedById: dbUser?.id,
      consumptionRate,
      abnormalFlag,
      remarks: parsed.remarks ?? null,
    },
  });
  await prisma.fleetAsset.update({ where: { id: parsed.fleetAssetId }, data: { mileageKm: Math.max(fleet.mileageKm, parsed.odometerReadingKm) } });
  await writeAuditLog({ actorId: dbUser?.id, action: "FUEL_LOG_ADDED", module: "fleet", recordId: log.id, assetId: fleet.assetId, newValue: log });
  revalidateFleet(parsed.fleetAssetId);
  return log;
}

export async function addServiceRecord(input: unknown, user: SessionUser | null) {
  const parsed = serviceRecordSchema.parse(input);
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const fleet = await assertCanAddOperationalRecord(parsed.fleetAssetId, user);
  const totalCost = Number((parsed.labourCost + parsed.partsCost).toFixed(2));
  const record = await prisma.serviceRecord.create({
    data: {
      fleetAssetId: parsed.fleetAssetId,
      serviceDate: new Date(parsed.serviceDate),
      serviceType: parsed.serviceType,
      vendor: parsed.vendor,
      odometerReadingKm: parsed.odometerReadingKm,
      workDone: parsed.workDone,
      partsReplaced: parsed.partsReplaced ?? null,
      labourCost: parsed.labourCost,
      partsCost: parsed.partsCost,
      totalCost,
      nextServiceDate: parsed.nextServiceDate ? new Date(parsed.nextServiceDate) : null,
      nextServiceMileage: parsed.nextServiceMileage ?? null,
      recordedById: dbUser?.id,
      remarks: parsed.remarks ?? null,
    },
  });
  await prisma.fleetAsset.update({
    where: { id: parsed.fleetAssetId },
    data: {
      mileageKm: Math.max(fleet.mileageKm, parsed.odometerReadingKm),
      lastServiceDate: new Date(parsed.serviceDate),
      nextServiceDate: parsed.nextServiceDate ? new Date(parsed.nextServiceDate) : fleet.nextServiceDate,
      nextServiceMileage: parsed.nextServiceMileage ?? fleet.nextServiceMileage,
    },
  });
  await writeAuditLog({ actorId: dbUser?.id, action: "SERVICE_RECORD_ADDED", module: "fleet", recordId: record.id, assetId: fleet.assetId, newValue: record });
  revalidateFleet(parsed.fleetAssetId);
  return record;
}

export async function addInsuranceRecord(input: unknown, user: SessionUser | null) {
  const parsed = insuranceRecordSchema.parse(input);
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const fleet = await assertCanAddOperationalRecord(parsed.fleetAssetId, user);
  const record = await prisma.insuranceRecord.create({
    data: {
      fleetAssetId: parsed.fleetAssetId,
      provider: parsed.provider,
      policyNumber: parsed.policyNumber,
      coverType: parsed.coverType,
      startDate: new Date(parsed.startDate),
      expiryDate: new Date(parsed.expiryDate),
      premiumAmount: parsed.premiumAmount,
      renewalStatus: parsed.renewalStatus,
      recordedById: dbUser?.id,
    },
  });
  await prisma.fleetAsset.update({
    where: { id: parsed.fleetAssetId },
    data: {
      insuranceProvider: parsed.provider,
      insurancePolicyNumber: parsed.policyNumber,
      insuranceStartDate: new Date(parsed.startDate),
      insuranceExpiry: new Date(parsed.expiryDate),
    },
  });
  await writeAuditLog({ actorId: dbUser?.id, action: "INSURANCE_RECORD_ADDED", module: "fleet", recordId: record.id, assetId: fleet.assetId, newValue: record });
  revalidateFleet(parsed.fleetAssetId);
  return record;
}

export async function addAccidentLog(input: unknown, user: SessionUser | null) {
  const parsed = accidentLogSchema.parse(input);
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const fleet = await assertCanAddOperationalRecord(parsed.fleetAssetId, user);
  const record = await prisma.accidentLog.create({
    data: {
      fleetAssetId: parsed.fleetAssetId,
      accidentDate: new Date(parsed.accidentDate),
      location: parsed.location,
      driver: parsed.driver,
      description: parsed.description,
      policeAbstractNumber: parsed.policeAbstractNumber ?? null,
      insuranceClaimNumber: parsed.insuranceClaimNumber ?? null,
      repairEstimate: parsed.repairEstimate,
      actualRepairCost: parsed.actualRepairCost,
      status: parsed.status,
      photoPaths: [],
      documentPaths: [],
      recordedById: dbUser?.id,
    },
  });
  await writeAuditLog({ actorId: dbUser?.id, action: "ACCIDENT_RECORD_ADDED", module: "fleet", recordId: record.id, assetId: fleet.assetId, newValue: record });
  revalidateFleet(parsed.fleetAssetId);
  return record;
}

export async function getFleetDashboard(user: SessionUser | null) {
  const vehicles = await listFleetVehicles(user);
  const today = new Date();
  const insuranceLimit = new Date(today);
  insuranceLimit.setDate(insuranceLimit.getDate() + 45);
  const active = vehicles.filter((item) => item.status === "ACTIVE").length;
  const underRepair = vehicles.filter((item) => item.status === "UNDER_MAINTENANCE" || item.serviceStatus === "Overdue").length;
  const dueService = vehicles.filter((item) => item.serviceStatus !== "Current").length;
  const dueInsurance = vehicles.filter((item) => new Date(item.insuranceExpiry) <= insuranceLimit).length;
  const recommendedDisposal = vehicles.filter((item) => item.disposalRecommendation.includes("disposal")).length;
  const allFuelLogs = vehicles.flatMap((item) => item.fuelLogs);
  const avgMonthlyFuelCost = allFuelLogs.length ? allFuelLogs.reduce((sum, item) => sum + item.totalCost, 0) / Math.max(1, new Set(allFuelLogs.map((item) => item.date.slice(0, 7))).size) : 0;
  const avgMileage = vehicles.length ? vehicles.reduce((sum, item) => sum + item.currentMileage, 0) / vehicles.length : 0;
  return {
    totalVehicles: vehicles.length,
    active,
    underRepair,
    dueService,
    dueInsurance,
    recommendedDisposal,
    avgMonthlyFuelCost,
    avgMonthlyFuelCostLabel: formatKes(avgMonthlyFuelCost),
    avgMileage: Math.round(avgMileage),
    highFuelAlerts: allFuelLogs.filter((item) => item.abnormalFlag).length,
    vehicles,
    byInstitution: Array.from(vehicles.reduce((map, vehicle) => map.set(vehicle.institutionCode, (map.get(vehicle.institutionCode) ?? 0) + 1), new Map<string, number>())).map(([name, count]) => ({ name, count })),
    fuelTrend: monthlyTrend(allFuelLogs.map((log) => ({ date: log.date, value: log.totalCost })), "cost"),
    mileageTrend: monthlyTrend(vehicles.flatMap((vehicle) => vehicle.fuelLogs.map((log) => ({ date: log.date, value: log.odometerReadingKm }))), "mileage"),
    serviceCostByVehicle: vehicles.map((vehicle) => ({ name: vehicle.registrationNumber, cost: vehicle.serviceRecords.reduce((sum, item) => sum + item.totalCost, 0) })),
    conditionSummary: Array.from(vehicles.reduce((map, vehicle) => map.set(vehicle.condition, (map.get(vehicle.condition) ?? 0) + 1), new Map<string, number>())).map(([name, count]) => ({ name, count })),
    recentMovements: vehicles.flatMap((vehicle) => vehicle.movements.map((movement) => ({ ...movement, vehicle: vehicle.registrationNumber }))).slice(0, 6),
    recentServices: vehicles.flatMap((vehicle) => vehicle.serviceRecords.map((record) => ({ ...record, registrationNumber: vehicle.registrationNumber }))).slice(0, 6),
  };
}

function monthlyTrend(rows: { date: string; value: number }[], key: "cost"): { month: string; cost: number }[];
function monthlyTrend(rows: { date: string; value: number }[], key: "mileage"): { month: string; mileage: number }[];
function monthlyTrend(rows: { date: string; value: number }[], key: "cost" | "mileage") {
  const map = new Map<string, number>();
  for (const row of rows) {
    const month = row.date.slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + row.value);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, value]) => ({ month, [key]: Math.round(value) }));
}

export async function getFleetOperationalData(user: SessionUser | null) {
  const vehicles = await listFleetVehicles(user);
  return {
    vehicles,
    fuelLogs: vehicles.flatMap((vehicle) => vehicle.fuelLogs.map((log) => ({ ...log, registrationNumber: vehicle.registrationNumber }))),
    serviceRecords: vehicles.flatMap((vehicle) => vehicle.serviceRecords.map((record) => ({ ...record, registrationNumber: vehicle.registrationNumber }))),
    insuranceRecords: vehicles.flatMap((vehicle) => vehicle.insuranceRecords.map((record) => ({ ...record, registrationNumber: vehicle.registrationNumber }))),
    accidentLogs: vehicles.flatMap((vehicle) => vehicle.accidentLogs.map((record) => ({ ...record, registrationNumber: vehicle.registrationNumber }))),
  };
}

export async function logFleetExport(user: SessionUser | null, report: string, count: number) {
  const dbUser = await resolveDbUser(user);
  await writeAuditLog({ actorId: dbUser?.id, action: "EXPORT", module: "fleet", recordId: report, newValue: { count } });
}

function revalidateFleet(id?: string) {
  revalidatePath("/fleet");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/national");
  if (id) revalidatePath(`/fleet/${id}`);
}

export type { AccidentLogInput, FleetVehicleInput, FuelLogInput, InsuranceRecordInput, ServiceRecordInput };
