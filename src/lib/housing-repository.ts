import { Prisma } from "@prisma/client";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { housingUnits as demoHousing, institutions as demoInstitutions } from "@/data/demo";
import { type SessionUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getPrisma, hasDatabaseUrl } from "@/lib/prisma";
import {
  allocationSchema,
  constructionProjectSchema,
  housingMaintenanceSchema,
  housingPropertySchema,
  type AllocationInput,
  type ConstructionProjectInput,
  type HousingPropertyFormValues,
  type HousingMaintenanceInput,
  type HousingPropertyInput,
} from "@/lib/housing-validation";

const readAllHousingRoles = new Set(["NATIONAL_TREASURY_SUPER_ADMIN", "AUDITOR", "READ_ONLY_INSPECTOR"]);
const editHousingRoles = new Set(["NATIONAL_TREASURY_SUPER_ADMIN", "MINISTRY_ADMIN", "HOUSING_OFFICER"]);

type HousingRow = Prisma.HousingUnitGetPayload<{
  include: {
    asset: { include: { category: true; institution: true; department: true; locationRef: true; auditLogs: { include: { actor: true }; orderBy: { createdAt: "desc" } }; documents: true } };
    institution: true;
    location: true;
    premise: true;
    allocations: { include: { employee: true; createdBy: true }; orderBy: { allocationDate: "desc" } };
    housingMaintenanceRequests: { include: { requester: true; assignedTo: true }; orderBy: { dateSubmitted: "desc" } };
    inspections: { orderBy: { inspectionDate: "desc" } };
    propertyDocuments: { orderBy: { createdAt: "desc" } };
  };
}>;

export type HousingProperty = {
  id: string;
  assetId?: string;
  assetCode: string;
  name: string;
  description: string;
  unitCode: string;
  unitType: string;
  institution: string;
  institutionCode: string;
  department: string;
  county: string;
  subCounty?: string;
  town: string;
  ward?: string;
  physicalAddress: string;
  gpsCoordinates?: string;
  bedrooms: number;
  bathrooms: number;
  rooms: number;
  plotSize?: string;
  floorSize?: string;
  constructionType: string;
  yearBuilt?: number;
  occupancyCapacity: number;
  utilitiesAvailable: string[];
  monthlyRentValue: number;
  estimatedMarketValue: number;
  occupancyStatus: string;
  occupantName: string;
  occupantPayrollNo?: string;
  rentDeduction: number;
  utilityCondition: string;
  constructionProgress: number;
  condition: string;
  status: string;
  lifecycleRecommendation: string;
  allocations: HousingAllocationRecord[];
  maintenanceRequests: HousingMaintenanceRecord[];
  inspections: HousingInspectionRecord[];
  auditLogs: { action: string; actor: string; date: string }[];
  documents: { name: string; type: string; createdAt: string }[];
};

export type HousingAllocationRecord = {
  id: string;
  property: string;
  employeeName: string;
  payrollNo: string;
  institution: string;
  allocationDate: string;
  expectedVacationDate?: string;
  monthlyRentDeduction: number;
  familySize: number;
  status: string;
};

export type HousingMaintenanceRecord = {
  id: string;
  requestNo: string;
  property: string;
  occupant: string;
  requestType: string;
  description: string;
  priority: string;
  dateSubmitted: string;
  technicianVendor?: string;
  estimatedCost: number;
  actualCost: number;
  status: string;
  completionDate?: string;
};

export type HousingInspectionRecord = {
  id: string;
  inspectionDate: string;
  inspectorName: string;
  conditionRating: string;
  findings: string;
  recommendation: string;
};

export type HousingProject = {
  id: string;
  projectCode: string;
  projectName: string;
  projectType: string;
  institution: string;
  contractor: string;
  county: string;
  town: string;
  startDate: string;
  expectedCompletion: string;
  budgetApproved: number;
  amountSpent: number;
  completionPercentage: number;
  status: string;
  inspectionNotes?: string;
};

function iso(date?: Date | string | null) {
  if (!date) return undefined;
  return new Date(date).toISOString().slice(0, 10);
}

function recommendation(condition: string, maintenanceCost: number, estimatedValue: number) {
  if (condition === "Critical" || maintenanceCost > estimatedValue * 0.45) return "Replacement / rebuild review";
  if (condition === "Poor" || maintenanceCost > estimatedValue * 0.25) return "Renovation recommended";
  if (condition === "Fair" || maintenanceCost > estimatedValue * 0.1) return "Major repair needed";
  return "Routine maintenance";
}

function assetConditionToHousing(condition?: string) {
  if (condition === "NEW") return "Excellent";
  if (condition === "GOOD") return "Good";
  if (condition === "FAIR") return "Fair";
  if (condition === "POOR") return "Poor";
  return "Critical";
}

function mapHousing(row: HousingRow): HousingProperty {
  const name = row.asset?.name ?? row.unitCode;
  const value = Number(row.estimatedMarketValue || row.asset?.purchaseCost || 0);
  const maintenanceCost = row.housingMaintenanceRequests.reduce((sum, item) => sum + Number(item.actualCost || item.estimatedCost), 0);
  const condition = assetConditionToHousing(row.asset?.condition);
  return {
    id: row.id,
    assetId: row.assetId ?? undefined,
    assetCode: row.asset?.assetCode ?? row.unitCode,
    name,
    description: row.asset?.description ?? row.remarks ?? "Housing property record",
    unitCode: row.unitCode,
    unitType: row.unitType,
    institution: row.institution.name,
    institutionCode: row.institution.code,
    department: row.asset?.department?.name ?? "Administration",
    county: row.county,
    subCounty: row.subCounty ?? undefined,
    town: row.town,
    ward: row.ward ?? undefined,
    physicalAddress: row.physicalAddress ?? row.location?.name ?? row.gisLocation ?? "Not recorded",
    gpsCoordinates: row.gpsCoordinates ?? row.gisLocation ?? undefined,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    rooms: row.rooms,
    plotSize: row.plotSize ?? undefined,
    floorSize: row.floorSize ?? undefined,
    constructionType: row.constructionType,
    yearBuilt: row.yearBuilt ?? undefined,
    occupancyCapacity: row.occupancyCapacity,
    utilitiesAvailable: row.utilitiesAvailable,
    monthlyRentValue: Number(row.monthlyRentValue),
    estimatedMarketValue: value,
    occupancyStatus: row.occupancyStatus,
    occupantName: row.occupantName ?? "Unassigned",
    occupantPayrollNo: row.occupantPayrollNo ?? undefined,
    rentDeduction: Number(row.rentDeduction),
    utilityCondition: row.utilityCondition,
    constructionProgress: row.constructionProgress,
    condition,
    status: row.asset?.status ?? "ACTIVE",
    lifecycleRecommendation: recommendation(condition, maintenanceCost, value || 1),
    allocations: row.allocations.map((item) => ({
      id: item.id,
      property: name,
      employeeName: item.employeeName,
      payrollNo: item.payrollNo,
      institution: item.institution,
      allocationDate: iso(item.allocationDate) ?? "",
      expectedVacationDate: iso(item.expectedVacationDate),
      monthlyRentDeduction: Number(item.monthlyRentDeduction),
      familySize: item.familySize,
      status: item.status,
    })),
    maintenanceRequests: row.housingMaintenanceRequests.map((item) => ({
      id: item.id,
      requestNo: item.requestNo,
      property: name,
      occupant: item.occupant,
      requestType: item.requestType,
      description: item.description,
      priority: item.priority,
      dateSubmitted: iso(item.dateSubmitted) ?? "",
      technicianVendor: item.technicianVendor ?? undefined,
      estimatedCost: Number(item.estimatedCost),
      actualCost: Number(item.actualCost),
      status: item.status,
      completionDate: iso(item.completionDate),
    })),
    inspections: row.inspections.map((item) => ({
      id: item.id,
      inspectionDate: iso(item.inspectionDate) ?? "",
      inspectorName: item.inspectorName,
      conditionRating: item.conditionRating,
      findings: item.findings,
      recommendation: item.recommendation,
    })),
    auditLogs: row.asset?.auditLogs.map((item) => ({ action: item.action, actor: item.actor?.fullName ?? "System", date: iso(item.createdAt) ?? "" })) ?? [],
    documents: [
      ...(row.asset?.documents.map((item) => ({ name: item.name, type: item.mimeType, createdAt: iso(item.createdAt) ?? "" })) ?? []),
      ...row.propertyDocuments.map((item) => ({ name: item.name, type: item.documentType, createdAt: iso(item.createdAt) ?? "" })),
    ],
  };
}

async function resolveDbUser(user: SessionUser | null) {
  if (!user || !hasDatabaseUrl()) return null;
  return getPrisma().user.findUnique({ where: { email: user.email }, include: { institution: true, department: true, primaryRole: true } });
}

async function scopedHousingWhere(user: SessionUser | null): Promise<Prisma.HousingUnitWhereInput> {
  if (!user) return {};
  const dbUser = await resolveDbUser(user);
  if (readAllHousingRoles.has(user.role)) return {};
  if (user.role === "EMPLOYEE_USER") {
    return { OR: [{ occupantPayrollNo: dbUser?.payrollNo ?? "__none__" }, { allocations: { some: { payrollNo: dbUser?.payrollNo ?? "__none__", vacatedAt: null } } }] };
  }
  if (user.role === "DEPARTMENT_ASSET_OFFICER" && dbUser?.departmentId) return { asset: { departmentId: dbUser.departmentId } };
  if (dbUser?.institutionId) return { institutionId: dbUser.institutionId };
  return { institution: { name: user.institution } };
}

async function activeHousingWhere(user: SessionUser | null, extra?: Prisma.HousingUnitWhereInput): Promise<Prisma.HousingUnitWhereInput> {
  return { AND: [await scopedHousingWhere(user), { archivedAt: null }, { asset: { archivedAt: null } }, ...(extra ? [extra] : [])] };
}

function canEditHousing(user: SessionUser | null) {
  return Boolean(user && editHousingRoles.has(user.role));
}

const housingInclude = {
  asset: { include: { category: true, institution: true, department: true, locationRef: true, auditLogs: { include: { actor: true }, orderBy: { createdAt: "desc" } }, documents: true } },
  institution: true,
  location: true,
  premise: true,
  allocations: { include: { employee: true, createdBy: true }, orderBy: { allocationDate: "desc" } },
  housingMaintenanceRequests: { include: { requester: true, assignedTo: true }, orderBy: { dateSubmitted: "desc" } },
  inspections: { orderBy: { inspectionDate: "desc" } },
  propertyDocuments: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.HousingUnitInclude;

function demoProperties(): HousingProperty[] {
  return demoHousing.map((item, index) => ({
    id: `demo-housing-${index + 1}`,
    assetCode: `IGAMIS-${item.institution.includes("Forest") ? "KFS" : item.institution.includes("Health") ? "MOH" : "TNT"}-HSE-2026-${String(index + 1).padStart(6, "0")}`,
    name: item.unitCode,
    description: "Demo housing property",
    unitCode: item.unitCode,
    unitType: item.type,
    institution: item.institution,
    institutionCode: "GOK",
    department: "Administration",
    county: "Nairobi",
    town: "Nairobi",
    physicalAddress: "Government estate",
    bedrooms: 3,
    bathrooms: 2,
    rooms: 5,
    constructionType: "Permanent Structure",
    occupancyCapacity: 5,
    utilitiesAvailable: ["Water", "Power"],
    monthlyRentValue: item.rent,
    estimatedMarketValue: 18000000,
    occupancyStatus: item.status.toUpperCase(),
    occupantName: item.status === "Occupied" ? "John Kamau" : "Unassigned",
    rentDeduction: item.rent,
    utilityCondition: item.condition,
    constructionProgress: item.progress,
    condition: item.condition,
    status: "ACTIVE",
    lifecycleRecommendation: item.condition === "Fair" ? "Major repair needed" : "Routine maintenance",
    allocations: [],
    maintenanceRequests: [],
    inspections: [],
    auditLogs: [],
    documents: [],
  }));
}

export async function listHousingProperties(user: SessionUser | null): Promise<HousingProperty[]> {
  if (!hasDatabaseUrl()) return demoProperties();
  const rows = await getPrisma().housingUnit.findMany({ where: await activeHousingWhere(user), include: housingInclude, orderBy: { updatedAt: "desc" } });
  return rows.map(mapHousing);
}

export async function getHousingProperty(id: string, user: SessionUser | null) {
  if (!hasDatabaseUrl()) {
    const property = demoProperties().find((item) => item.id === id);
    return property ? { property, qrSvg: await generatePropertyQrSvg(property) } : null;
  }
  const prisma = getPrisma();
  const row = await prisma.housingUnit.findFirst({ where: await activeHousingWhere(user, { id }), include: housingInclude });
  if (!row) return null;
  const property = mapHousing(row);
  const dbUser = await resolveDbUser(user);
  await writeAuditLog({ actorId: dbUser?.id, action: "VIEW", module: "housing", recordId: row.id, assetId: row.assetId ?? undefined });
  return { property, qrSvg: await generatePropertyQrSvg(property) };
}

export async function getHousingLookups(user: SessionUser | null) {
  if (!hasDatabaseUrl()) {
    return { institutions: demoInstitutions.map((item) => ({ id: item.name, name: item.name, code: item.code })), departments: [], locations: [], users: [] };
  }
  const dbUser = await resolveDbUser(user);
  const institutionId = readAllHousingRoles.has(user?.role ?? "") ? undefined : dbUser?.institutionId ?? undefined;
  const prisma = getPrisma();
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

async function nextPropertyAssetCode(input: HousingPropertyInput) {
  const prisma = getPrisma();
  const institution = await prisma.institution.findUniqueOrThrow({ where: { id: input.institutionId } });
  const category = await prisma.assetCategory.findFirstOrThrow({ where: { OR: [{ code: input.unitType.includes("Office") || input.unitType.includes("Warehouse") ? "BLD" : "HSE" }, { name: input.unitType.includes("Office") ? "Buildings" : "Houses" }] } });
  const year = new Date(input.acquisitionDate).getFullYear();
  const prefix = `IGAMIS-${institution.code}-${category.code}-${year}`;
  const count = await prisma.asset.count({ where: { assetCode: { startsWith: prefix } } });
  return { assetCode: `${prefix}-${String(count + 1).padStart(6, "0")}`, category, institution };
}

export async function generatePropertyQrSvg(property: Pick<HousingProperty, "id" | "assetCode" | "name" | "institution" | "unitType">) {
  return QRCode.toString(JSON.stringify({ assetCode: property.assetCode, propertyId: property.id, institution: property.institution, propertyType: property.unitType, verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://igamis.go.ke"}/housing/${property.id}` }), {
    type: "svg",
    margin: 1,
    width: 184,
    color: { dark: "#052e1b", light: "#ffffff" },
  });
}

export async function createHousingProperty(input: unknown, user: SessionUser | null) {
  const parsed = housingPropertySchema.parse(input);
  if (!canEditHousing(user)) throw new Error("You do not have permission to create housing properties.");
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const { assetCode, category, institution } = await nextPropertyAssetCode(parsed);
  const address = `${parsed.physicalAddress}, ${parsed.town}, ${parsed.county}`;
  const asset = await prisma.asset.create({
    data: {
      assetCode,
      name: parsed.name,
      qrCode: JSON.stringify({ assetCode, institution: institution.name, category: category.name, verificationUrl: `https://igamis.go.ke/verify/${assetCode}` }),
      barcode: assetCode,
      categoryId: category.id,
      description: parsed.description,
      institutionId: parsed.institutionId,
      departmentId: parsed.departmentId || null,
      locationId: parsed.locationId || null,
      location: address,
      acquisitionDate: new Date(parsed.acquisitionDate),
      purchaseCost: parsed.purchaseCost,
      usefulLifeYears: parsed.usefulLifeYears,
      depreciationMethod: parsed.depreciationMethod,
      condition: parsed.condition,
      status: parsed.status,
      photos: [],
      tags: ["housing", parsed.unitType.toLowerCase()],
    },
  });
  const unit = await prisma.housingUnit.create({
    data: {
      assetId: asset.id,
      institutionId: parsed.institutionId,
      locationId: parsed.locationId || null,
      unitCode: assetCode,
      unitType: parsed.unitType,
      county: parsed.county,
      subCounty: parsed.subCounty ?? null,
      town: parsed.town,
      ward: parsed.ward ?? null,
      physicalAddress: parsed.physicalAddress,
      gpsCoordinates: parsed.gpsCoordinates ?? null,
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      rooms: parsed.rooms,
      plotSize: parsed.plotSize ?? null,
      floorSize: parsed.floorSize ?? null,
      constructionType: parsed.constructionType,
      yearBuilt: parsed.yearBuilt ?? null,
      occupancyCapacity: parsed.occupancyCapacity,
      utilitiesAvailable: (parsed.utilitiesAvailable ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      monthlyRentValue: parsed.monthlyRentValue,
      estimatedMarketValue: parsed.estimatedMarketValue,
      occupancyStatus: parsed.occupancyStatus,
      occupantName: parsed.occupantName ?? null,
      occupantPayrollNo: parsed.occupantPayrollNo ?? null,
      rentDeduction: parsed.rentDeduction,
      utilityCondition: assetConditionToHousing(parsed.condition),
      constructionProgress: parsed.occupancyStatus === "UNDER_CONSTRUCTION" ? 50 : 100,
      gisLocation: parsed.gpsCoordinates ?? null,
      remarks: parsed.remarks ?? null,
    },
  });
  await writeAuditLog({ actorId: dbUser?.id, action: "CREATE", module: "housing", recordId: unit.id, assetId: asset.id, newValue: { asset, unit } });
  revalidateHousing();
  return unit;
}

export async function updateHousingProperty(id: string, input: unknown, user: SessionUser | null) {
  const parsed = housingPropertySchema.parse(input);
  if (!canEditHousing(user)) throw new Error("You do not have permission to edit housing properties.");
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const before = await prisma.housingUnit.findFirstOrThrow({ where: await activeHousingWhere(user, { id }), include: { asset: true } });
  const address = `${parsed.physicalAddress}, ${parsed.town}, ${parsed.county}`;
  const asset = before.assetId ? await prisma.asset.update({
    where: { id: before.assetId },
    data: { name: parsed.name, description: parsed.description, institutionId: parsed.institutionId, departmentId: parsed.departmentId || null, locationId: parsed.locationId || null, location: address, acquisitionDate: new Date(parsed.acquisitionDate), purchaseCost: parsed.purchaseCost, usefulLifeYears: parsed.usefulLifeYears, depreciationMethod: parsed.depreciationMethod, condition: parsed.condition, status: parsed.status },
  }) : null;
  const unit = await prisma.housingUnit.update({
    where: { id },
    data: {
      institutionId: parsed.institutionId,
      locationId: parsed.locationId || null,
      unitType: parsed.unitType,
      county: parsed.county,
      subCounty: parsed.subCounty ?? null,
      town: parsed.town,
      ward: parsed.ward ?? null,
      physicalAddress: parsed.physicalAddress,
      gpsCoordinates: parsed.gpsCoordinates ?? null,
      bedrooms: parsed.bedrooms,
      bathrooms: parsed.bathrooms,
      rooms: parsed.rooms,
      plotSize: parsed.plotSize ?? null,
      floorSize: parsed.floorSize ?? null,
      constructionType: parsed.constructionType,
      yearBuilt: parsed.yearBuilt ?? null,
      occupancyCapacity: parsed.occupancyCapacity,
      utilitiesAvailable: (parsed.utilitiesAvailable ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      monthlyRentValue: parsed.monthlyRentValue,
      estimatedMarketValue: parsed.estimatedMarketValue,
      occupancyStatus: parsed.occupancyStatus,
      occupantName: parsed.occupantName ?? null,
      occupantPayrollNo: parsed.occupantPayrollNo ?? null,
      rentDeduction: parsed.rentDeduction,
      utilityCondition: assetConditionToHousing(parsed.condition),
      gisLocation: parsed.gpsCoordinates ?? null,
      remarks: parsed.remarks ?? null,
    },
  });
  await writeAuditLog({ actorId: dbUser?.id, action: "UPDATE", module: "housing", recordId: id, assetId: before.assetId ?? undefined, oldValue: before, newValue: { asset, unit } });
  revalidateHousing(id);
  return unit;
}

export async function archiveHousingProperty(id: string, user: SessionUser | null) {
  if (!canEditHousing(user)) throw new Error("You do not have permission to archive housing properties.");
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const before = await prisma.housingUnit.findFirstOrThrow({ where: await activeHousingWhere(user, { id }), include: { asset: true } });
  const unit = await prisma.housingUnit.update({ where: { id }, data: { archivedAt: new Date(), occupancyStatus: "ARCHIVED" } });
  if (before.assetId) await prisma.asset.update({ where: { id: before.assetId }, data: { archivedAt: new Date(), status: "DISPOSED" } });
  await writeAuditLog({ actorId: dbUser?.id, action: "ARCHIVE", module: "housing", recordId: id, assetId: before.assetId ?? undefined, oldValue: before, newValue: unit });
  revalidateHousing();
  return unit;
}

export async function getHousingFormValues(id: string, user: SessionUser | null): Promise<Partial<HousingPropertyFormValues> | null> {
  const row = await getPrisma().housingUnit.findFirst({ where: await activeHousingWhere(user, { id }), include: { asset: true } });
  if (!row) return null;
  return {
    name: row.asset?.name ?? row.unitCode,
    description: row.asset?.description ?? "",
    institutionId: row.institutionId,
    departmentId: row.asset?.departmentId ?? "",
    locationId: row.locationId ?? "",
    acquisitionDate: iso(row.asset?.acquisitionDate) ?? new Date().toISOString().slice(0, 10),
    purchaseCost: Number(row.asset?.purchaseCost ?? row.estimatedMarketValue),
    usefulLifeYears: row.asset?.usefulLifeYears ?? 40,
    depreciationMethod: row.asset?.depreciationMethod ?? "STRAIGHT_LINE",
    condition: row.asset?.condition ?? "GOOD",
    status: row.asset?.status ?? "ACTIVE",
    unitType: row.unitType as HousingPropertyFormValues["unitType"],
    county: row.county,
    subCounty: row.subCounty ?? "",
    town: row.town,
    ward: row.ward ?? "",
    physicalAddress: row.physicalAddress ?? "",
    gpsCoordinates: row.gpsCoordinates ?? "",
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    rooms: row.rooms,
    plotSize: row.plotSize ?? "",
    floorSize: row.floorSize ?? "",
    constructionType: row.constructionType,
    yearBuilt: row.yearBuilt ?? undefined,
    occupancyCapacity: row.occupancyCapacity,
    utilitiesAvailable: row.utilitiesAvailable.join(", "),
    monthlyRentValue: Number(row.monthlyRentValue),
    estimatedMarketValue: Number(row.estimatedMarketValue),
    occupancyStatus: row.occupancyStatus as HousingPropertyFormValues["occupancyStatus"],
    occupantName: row.occupantName ?? "",
    occupantPayrollNo: row.occupantPayrollNo ?? "",
    rentDeduction: Number(row.rentDeduction),
    remarks: row.remarks ?? "",
  };
}

export async function addHousingAllocation(input: unknown, user: SessionUser | null) {
  const parsed = allocationSchema.parse(input);
  if (!canEditHousing(user)) throw new Error("You do not have permission to allocate housing.");
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const unit = await prisma.housingUnit.findFirstOrThrow({ where: await activeHousingWhere(user, { id: parsed.housingUnitId }) });
  const employee = await prisma.user.findFirst({ where: { payrollNo: parsed.payrollNo } });
  const allocation = await prisma.housingAllocation.create({
    data: { housingUnitId: parsed.housingUnitId, employeeId: employee?.id ?? null, employeeName: parsed.employeeName, payrollNo: parsed.payrollNo, institution: parsed.institution, allocationDate: new Date(parsed.allocationDate), expectedVacationDate: parsed.expectedVacationDate ? new Date(parsed.expectedVacationDate) : null, monthlyRentDeduction: parsed.monthlyRentDeduction, familySize: parsed.familySize, status: parsed.status, approvedAt: parsed.status === "APPROVED" ? new Date() : null, createdById: dbUser?.id },
  });
  await prisma.housingUnit.update({ where: { id: unit.id }, data: { occupancyStatus: "OCCUPIED", occupantName: parsed.employeeName, occupantPayrollNo: parsed.payrollNo, rentDeduction: parsed.monthlyRentDeduction } });
  await writeAuditLog({ actorId: dbUser?.id, action: "ALLOCATION_CREATED", module: "housing", recordId: allocation.id, assetId: unit.assetId ?? undefined, newValue: allocation });
  revalidateHousing(unit.id);
  return allocation;
}

export async function addHousingMaintenance(input: unknown, user: SessionUser | null) {
  const parsed = housingMaintenanceSchema.parse(input);
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const unit = await prisma.housingUnit.findFirstOrThrow({ where: await activeHousingWhere(user, { id: parsed.housingUnitId }) });
  const count = await prisma.housingMaintenanceRequest.count();
  const request = await prisma.housingMaintenanceRequest.create({
    data: { requestNo: `HM-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`, housingUnitId: parsed.housingUnitId, occupant: parsed.occupant, requesterId: dbUser?.id, requestType: parsed.requestType, description: parsed.description, priority: parsed.priority, technicianVendor: parsed.technicianVendor ?? null, estimatedCost: parsed.estimatedCost, actualCost: parsed.actualCost, status: parsed.status, completionDate: parsed.completionDate ? new Date(parsed.completionDate) : null, beforePhotoPaths: [], afterPhotoPaths: [] },
  });
  if (parsed.status !== "COMPLETED") await prisma.housingUnit.update({ where: { id: unit.id }, data: { occupancyStatus: "UNDER_MAINTENANCE" } });
  await writeAuditLog({ actorId: dbUser?.id, action: parsed.status === "COMPLETED" ? "MAINTENANCE_COMPLETED" : "MAINTENANCE_SUBMITTED", module: "housing", recordId: request.id, assetId: unit.assetId ?? undefined, newValue: request });
  revalidateHousing(unit.id);
  return request;
}

export async function addConstructionProject(input: unknown, user: SessionUser | null) {
  const parsed = constructionProjectSchema.parse(input);
  if (!canEditHousing(user)) throw new Error("You do not have permission to update construction projects.");
  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const institution = await prisma.institution.findFirstOrThrow({ where: { OR: [{ id: parsed.institutionId }, { code: parsed.institutionId }] } });
  const count = await prisma.constructionProject.count({ where: { institutionId: institution.id } });
  const project = await prisma.constructionProject.create({
    data: { projectCode: `IGAMIS-${institution.code}-PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`, projectName: parsed.projectName, projectType: parsed.projectType, institutionId: institution.id, contractor: parsed.contractor, county: parsed.county, town: parsed.town, startDate: new Date(parsed.startDate), expectedCompletion: new Date(parsed.expectedCompletion), budgetApproved: parsed.budgetApproved, amountSpent: parsed.amountSpent, completionPercentage: parsed.completionPercentage, status: parsed.status, sitePhotoPaths: [], inspectionNotes: parsed.inspectionNotes ?? null },
  });
  await writeAuditLog({ actorId: dbUser?.id, action: "PROJECT_UPDATED", module: "housing", recordId: project.id, newValue: project });
  revalidateHousing();
  return project;
}

export async function listHousingProjects(user: SessionUser | null): Promise<HousingProject[]> {
  if (!hasDatabaseUrl()) return [];
  const dbUser = await resolveDbUser(user);
  const where = readAllHousingRoles.has(user?.role ?? "") || !dbUser?.institutionId ? {} : { institutionId: dbUser.institutionId };
  const rows = await getPrisma().constructionProject.findMany({ where, include: { institution: true }, orderBy: { updatedAt: "desc" } });
  return rows.map((item) => ({ id: item.id, projectCode: item.projectCode, projectName: item.projectName, projectType: item.projectType, institution: item.institution.name, contractor: item.contractor, county: item.county, town: item.town, startDate: iso(item.startDate) ?? "", expectedCompletion: iso(item.expectedCompletion) ?? "", budgetApproved: Number(item.budgetApproved), amountSpent: Number(item.amountSpent), completionPercentage: item.completionPercentage, status: item.status, inspectionNotes: item.inspectionNotes ?? undefined }));
}

export async function getHousingDashboard(user: SessionUser | null) {
  const [properties, projects] = await Promise.all([listHousingProperties(user), listHousingProjects(user)]);
  const occupied = properties.filter((item) => item.occupancyStatus === "OCCUPIED").length;
  const vacant = properties.filter((item) => item.occupancyStatus === "VACANT").length;
  const underMaintenance = properties.filter((item) => item.occupancyStatus === "UNDER_MAINTENANCE").length;
  const maintenance = properties.flatMap((item) => item.maintenanceRequests);
  return {
    total: properties.length,
    occupied,
    vacant,
    underMaintenance,
    staffQuarters: properties.filter((item) => item.unitType === "Staff Quarters").length,
    affordable: properties.filter((item) => item.unitType === "Affordable Housing Unit").length,
    offices: properties.filter((item) => item.unitType === "Government Office").length,
    activeProjects: projects.filter((item) => item.status === "ACTIVE").length,
    pendingAllocations: properties.flatMap((item) => item.allocations).filter((item) => item.status.includes("PENDING")).length,
    pendingMaintenance: maintenance.filter((item) => item.status !== "COMPLETED").length,
    properties,
    projects,
    occupancyByInstitution: Array.from(properties.reduce((map, item) => {
      const current = map.get(item.institutionCode) ?? { name: item.institutionCode, occupied: 0, total: 0 };
      current.total += 1;
      if (item.occupancyStatus === "OCCUPIED") current.occupied += 1;
      map.set(item.institutionCode, current);
      return map;
    }, new Map<string, { name: string; occupied: number; total: number }>()).values()).map((item) => ({ ...item, rate: item.total ? Math.round((item.occupied / item.total) * 100) : 0 })),
    typeDistribution: Array.from(properties.reduce((map, item) => map.set(item.unitType, (map.get(item.unitType) ?? 0) + 1), new Map<string, number>())).map(([name, count]) => ({ name, count })),
    maintenanceTrend: monthlyTrend(maintenance.map((item) => ({ date: item.dateSubmitted, value: item.actualCost || item.estimatedCost }))),
    constructionSummary: projects.map((item) => ({ name: item.projectCode, progress: item.completionPercentage, budget: item.budgetApproved, spent: item.amountSpent })),
    occupancySummary: [{ name: "Vacant", count: vacant }, { name: "Occupied", count: occupied }, { name: "Maintenance", count: underMaintenance }],
  };
}

function monthlyTrend(rows: { date: string; value: number }[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const month = row.date.slice(0, 7);
    map.set(month, (map.get(month) ?? 0) + row.value);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, cost]) => ({ month, cost: Math.round(cost) }));
}

export async function getHousingOperationalData(user: SessionUser | null) {
  const [properties, projects] = await Promise.all([listHousingProperties(user), listHousingProjects(user)]);
  return {
    properties,
    allocations: properties.flatMap((property) => property.allocations.map((item) => ({ ...item, propertyCode: property.unitCode }))),
    maintenance: properties.flatMap((property) => property.maintenanceRequests.map((item) => ({ ...item, propertyCode: property.unitCode }))),
    projects,
  };
}

export async function logHousingExport(user: SessionUser | null, report: string, count: number) {
  const dbUser = await resolveDbUser(user);
  await writeAuditLog({ actorId: dbUser?.id, action: "EXPORT", module: "housing", recordId: report, newValue: { count } });
}

function revalidateHousing(id?: string) {
  revalidatePath("/housing");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/national");
  if (id) revalidatePath(`/housing/${id}`);
}

export type { AllocationInput, ConstructionProjectInput, HousingMaintenanceInput, HousingPropertyInput };
