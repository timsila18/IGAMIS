import { Prisma } from "@prisma/client";
import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { assetAge } from "@/lib/utils";
import { assets as demoAssets, activities, fleet, formatKes, housingUnits, institutions, stockItems, type Asset } from "@/data/demo";
import { type AssetInput, assetInputSchema } from "@/lib/asset-validation";
import { writeAuditLog } from "@/lib/audit";
import { type SessionUser } from "@/lib/auth";
import { getPrisma, hasDatabaseUrl } from "@/lib/prisma";

const readAllRoles = new Set(["NATIONAL_TREASURY_SUPER_ADMIN", "AUDITOR", "READ_ONLY_INSPECTOR"]);
const editRoles = new Set(["NATIONAL_TREASURY_SUPER_ADMIN", "MINISTRY_ADMIN", "DEPARTMENT_ASSET_OFFICER"]);

type AssetWithRelations = Prisma.AssetGetPayload<{
  include: {
    category: true;
    institution: true;
    department: true;
    locationRef: true;
    assignedUser: true;
    assignments: { include: { user: true }; orderBy: { issuedAt: "desc" } };
    movements: { include: { fromLocation: true; toLocation: true; fromUser: true; toUser: true }; orderBy: { movedAt: "desc" } };
    maintenanceRequests: { orderBy: { createdAt: "desc" } };
    documents: { orderBy: { createdAt: "desc" } };
    auditLogs: { include: { actor: true }; orderBy: { createdAt: "desc" } };
  };
}>;

function calculateCurrentValue(asset: { purchaseCost: Prisma.Decimal | number; acquisitionDate: Date | string; usefulLifeYears: number; residualValue?: Prisma.Decimal | number | null }) {
  const purchaseCost = Number(asset.purchaseCost);
  const residualValue = Number(asset.residualValue ?? 0);
  const age = assetAge(asset.acquisitionDate);
  const depreciable = Math.max(0, purchaseCost - residualValue);
  const annual = asset.usefulLifeYears > 0 ? depreciable / asset.usefulLifeYears : 0;
  return Math.max(residualValue, Math.round(purchaseCost - annual * age));
}

function mapDbAsset(asset: AssetWithRelations): Asset {
  return {
    id: asset.id,
    assetCode: asset.assetCode,
    name: asset.name,
    qrCode: asset.qrCode,
    category: asset.category.name,
    description: asset.description,
    institution: asset.institution.name,
    department: asset.department?.name ?? "Unassigned",
    location: asset.locationRef?.name ?? asset.location,
    acquisitionDate: asset.acquisitionDate.toISOString().slice(0, 10),
    purchaseCost: Number(asset.purchaseCost),
    supplier: asset.supplier ?? "Not recorded",
    usefulLifeYears: asset.usefulLifeYears,
    depreciationMethod: asset.depreciationMethod,
    condition: asset.condition,
    status: asset.status,
    assignedUser: asset.assignedUser?.fullName ?? "Unassigned",
    assignedUserEmail: asset.assignedUser?.email,
    serialNumber: asset.serialNumber ?? undefined,
    assetTagNumber: asset.assetTagNumber ?? undefined,
    warrantyExpiry: asset.warrantyExpiry?.toISOString().slice(0, 10) ?? "N/A",
    riskScore: asset.riskScore,
    currentValue: calculateCurrentValue(asset),
  };
}

function mapDemoAsset(asset: (typeof demoAssets)[number]): Asset {
  return {
    ...asset,
    currentValue: asset.currentValue ?? calculateCurrentValue({
      purchaseCost: asset.purchaseCost,
      acquisitionDate: asset.acquisitionDate,
      usefulLifeYears: asset.usefulLifeYears,
    }),
  };
}

async function resolveDbUser(user: SessionUser | null) {
  if (!user || !hasDatabaseUrl()) return null;
  const prisma = getPrisma();
  return prisma.user.findUnique({
    where: { email: user.email },
    include: { primaryRole: true, institution: true, department: true },
  });
}

async function scopedAssetWhere(user: SessionUser | null): Promise<Prisma.AssetWhereInput> {
  if (!user) return {};
  if (readAllRoles.has(user.role)) return {};

  const dbUser = await resolveDbUser(user);
  if (user.role === "EMPLOYEE_USER") {
    return dbUser ? { assignedUserId: dbUser.id } : { assignedUser: { email: user.email } };
  }

  if (user.role === "DEPARTMENT_ASSET_OFFICER" && dbUser?.departmentId) {
    return { departmentId: dbUser.departmentId };
  }

  if (dbUser?.institutionId) return { institutionId: dbUser.institutionId };
  return { institution: { name: user.institution } };
}

function canEditAsset(user: SessionUser | null) {
  return Boolean(user && editRoles.has(user.role));
}

function canArchiveAsset(user: SessionUser | null) {
  return user?.role === "NATIONAL_TREASURY_SUPER_ADMIN" || user?.role === "MINISTRY_ADMIN";
}

function demoScopedAssets(user?: SessionUser | null) {
  if (!user || readAllRoles.has(user.role)) return demoAssets.map(mapDemoAsset);
  if (user.role === "EMPLOYEE_USER") return demoAssets.filter((asset) => asset.assignedUserEmail === user.email).map(mapDemoAsset);
  return demoAssets.filter((asset) => asset.institution === user.institution).map(mapDemoAsset);
}

export async function listAssets(user?: SessionUser | null): Promise<Asset[]> {
  if (!hasDatabaseUrl()) return demoScopedAssets(user);

  try {
    const prisma = getPrisma();
    const rows = await prisma.asset.findMany({
      where: { ...(await scopedAssetWhere(user ?? null)), archivedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        institution: true,
        department: true,
        locationRef: true,
        assignedUser: true,
        assignments: { include: { user: true }, orderBy: { issuedAt: "desc" } },
        movements: { include: { fromLocation: true, toLocation: true, fromUser: true, toUser: true }, orderBy: { movedAt: "desc" } },
        maintenanceRequests: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        auditLogs: { include: { actor: true }, orderBy: { createdAt: "desc" } },
      },
    });

    return rows.map(mapDbAsset);
  } catch {
    return demoScopedAssets(user);
  }
}

export async function getAssetById(id: string, user?: SessionUser | null) {
  if (!hasDatabaseUrl()) {
    const asset = demoScopedAssets(user).find((item) => item.id === id || item.assetCode === id);
    return asset ? { asset, raw: null, qrSvg: await generateQrSvg(asset) } : null;
  }

  const prisma = getPrisma();
  const asset = await prisma.asset.findFirst({
    where: { id, ...(await scopedAssetWhere(user ?? null)), archivedAt: null },
    include: {
      category: true,
      institution: true,
      department: true,
      locationRef: true,
      assignedUser: true,
      assignments: { include: { user: true }, orderBy: { issuedAt: "desc" } },
      movements: { include: { fromLocation: true, toLocation: true, fromUser: true, toUser: true }, orderBy: { movedAt: "desc" } },
      maintenanceRequests: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      auditLogs: { include: { actor: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!asset) return null;
  const mapped = mapDbAsset(asset);
  await writeAuditLog({ actorId: (await resolveDbUser(user ?? null))?.id, action: "VIEW", module: "assets", recordId: asset.id, assetId: asset.id });
  return { asset: mapped, raw: asset, qrSvg: await generateQrSvg(mapped) };
}

export async function getAssetLookups(user?: SessionUser | null) {
  if (!hasDatabaseUrl()) {
    return {
      categories: ["Vehicles", "Buildings", "Houses", "Furniture", "ICT Equipment", "Machinery", "Uniforms", "Land", "Stores", "Others"].map((name, index) => ({
        id: name,
        name,
        code: name.slice(0, 3).toUpperCase() || String(index),
      })),
      institutions: institutions.map((institution) => ({ id: institution.name, name: institution.name, code: institution.code })),
      departments: [{ id: "Administration", name: "Administration", institutionId: user?.institution ?? "The National Treasury" }],
      locations: [{ id: "Headquarters", name: "Headquarters", institutionId: user?.institution ?? "The National Treasury" }],
      users: [{ id: user?.email ?? "employee@igamis.go.ke", fullName: user?.name ?? "Demo User", email: user?.email ?? "employee@igamis.go.ke" }],
    };
  }

  const prisma = getPrisma();
  const scope = await scopedAssetWhere(user ?? null);
  const institutionFilter = "institutionId" in scope && typeof scope.institutionId === "string" ? { id: scope.institutionId } : {};
  const [categories, institutionRows, departments, locations, users] = await Promise.all([
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.institution.findMany({ where: institutionFilter, orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: institutionFilter.id ? { institutionId: institutionFilter.id } : {}, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: institutionFilter.id ? { institutionId: institutionFilter.id } : {}, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: institutionFilter.id ? { institutionId: institutionFilter.id } : {}, orderBy: { fullName: "asc" } }),
  ]);

  return {
    categories: categories.map((item) => ({ id: item.id, name: item.name, code: item.code })),
    institutions: institutionRows.map((item) => ({ id: item.id, name: item.name, code: item.code })),
    departments: departments.map((item) => ({ id: item.id, name: item.name, institutionId: item.institutionId })),
    locations: locations.map((item) => ({ id: item.id, name: item.name, institutionId: item.institutionId })),
    users: users.map((item) => ({ id: item.id, fullName: item.fullName, email: item.email, institutionId: item.institutionId })),
  };
}

export async function getAssetFormValues(id: string, user?: SessionUser | null) {
  if (!hasDatabaseUrl()) {
    const asset = demoScopedAssets(user).find((item) => item.id === id || item.assetCode === id);
    if (!asset) return null;
    return {
      name: asset.name,
      description: asset.description,
      categoryId: asset.category,
      institutionId: asset.institution,
      departmentId: asset.department,
      locationId: "Headquarters",
      location: asset.location,
      acquisitionDate: asset.acquisitionDate,
      purchaseCost: asset.purchaseCost,
      supplier: asset.supplier,
      usefulLifeYears: asset.usefulLifeYears,
      depreciationMethod: asset.depreciationMethod as "STRAIGHT_LINE" | "REDUCING_BALANCE" | "UNITS_OF_PRODUCTION" | "NONE",
      condition: asset.condition,
      status: asset.status,
      assignedUserId: asset.assignedUserEmail ?? "",
      serialNumber: asset.serialNumber ?? "",
      assetTagNumber: asset.assetTagNumber ?? "",
      warrantyExpiry: asset.warrantyExpiry === "N/A" ? "" : asset.warrantyExpiry,
    };
  }

  const prisma = getPrisma();
  const asset = await prisma.asset.findFirst({
    where: { id, ...(await scopedAssetWhere(user ?? null)), archivedAt: null },
  });
  if (!asset) return null;

  return {
    name: asset.name,
    description: asset.description,
    categoryId: asset.categoryId,
    institutionId: asset.institutionId,
    departmentId: asset.departmentId ?? "",
    locationId: asset.locationId ?? "",
    location: asset.location,
    acquisitionDate: asset.acquisitionDate.toISOString().slice(0, 10),
    purchaseCost: Number(asset.purchaseCost),
    supplier: asset.supplier ?? "",
    usefulLifeYears: asset.usefulLifeYears,
    depreciationMethod: asset.depreciationMethod,
    condition: asset.condition,
    status: asset.status,
    assignedUserId: asset.assignedUserId ?? "",
    serialNumber: asset.serialNumber ?? "",
    assetTagNumber: asset.assetTagNumber ?? "",
    warrantyExpiry: asset.warrantyExpiry?.toISOString().slice(0, 10) ?? "",
  };
}

async function nextAssetCode(input: AssetInput) {
  if (!hasDatabaseUrl()) {
    const institution = institutions.find((item) => item.name === input.institutionId);
    const institutionCode = institution?.code ?? "GOK";
    return `IGAMIS-${institutionCode}-${input.categoryId.slice(0, 3).toUpperCase()}-${new Date(input.acquisitionDate).getFullYear()}-${String(Date.now()).slice(-6)}`;
  }

  const prisma = getPrisma();
  const [institution, category] = await Promise.all([
    prisma.institution.findUniqueOrThrow({ where: { id: input.institutionId } }),
    prisma.assetCategory.findUniqueOrThrow({ where: { id: input.categoryId } }),
  ]);
  const year = new Date(input.acquisitionDate).getFullYear();
  const prefix = `IGAMIS-${institution.code}-${category.code}-${year}`;
  const count = await prisma.asset.count({ where: { assetCode: { startsWith: prefix } } });
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

function qrPayload(asset: Pick<Asset, "id" | "assetCode" | "institution" | "category">) {
  return JSON.stringify({
    assetCode: asset.assetCode,
    assetId: asset.id,
    institution: asset.institution,
    category: asset.category,
    verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://igamis.go.ke"}/verify/${asset.assetCode}`,
  });
}

export async function generateQrSvg(asset: Pick<Asset, "id" | "assetCode" | "institution" | "category">) {
  return QRCode.toString(qrPayload(asset), {
    type: "svg",
    margin: 1,
    width: 184,
    color: { dark: "#052e1b", light: "#ffffff" },
  });
}

export async function createAsset(input: unknown, user: SessionUser | null) {
  const parsed = assetInputSchema.parse(input);
  if (!canEditAsset(user)) throw new Error("You do not have permission to create assets.");
  if (!hasDatabaseUrl()) throw new Error("DATABASE_URL is required for persistent asset creation.");

  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const assetCode = await nextAssetCode(parsed);
  const category = await prisma.assetCategory.findUniqueOrThrow({ where: { id: parsed.categoryId } });
  const institution = await prisma.institution.findUniqueOrThrow({ where: { id: parsed.institutionId } });
  const qrCode = qrPayload({ id: "pending", assetCode, institution: institution.name, category: category.name });

  const asset = await prisma.asset.create({
    data: {
      assetCode,
      name: parsed.name,
      qrCode,
      barcode: assetCode,
      serialNumber: parsed.serialNumber || null,
      assetTagNumber: parsed.assetTagNumber || null,
      categoryId: parsed.categoryId,
      description: parsed.description,
      institutionId: parsed.institutionId,
      departmentId: parsed.departmentId || null,
      locationId: parsed.locationId || null,
      location: parsed.location,
      acquisitionDate: new Date(parsed.acquisitionDate),
      purchaseCost: parsed.purchaseCost,
      supplier: parsed.supplier || null,
      usefulLifeYears: parsed.usefulLifeYears,
      depreciationMethod: parsed.depreciationMethod,
      condition: parsed.condition,
      status: parsed.status,
      assignedUserId: parsed.assignedUserId || null,
      warrantyExpiry: parsed.warrantyExpiry ? new Date(parsed.warrantyExpiry) : null,
      photos: [],
      tags: [],
    },
  });

  if (parsed.assignedUserId) {
    await prisma.assetAssignment.create({
      data: {
        assetId: asset.id,
        userId: parsed.assignedUserId,
        conditionOnIssue: parsed.condition,
        notes: "Initial assignment during asset registration",
      },
    });
  }

  await writeAuditLog({ actorId: dbUser?.id, action: "CREATE", module: "assets", recordId: asset.id, newValue: asset, assetId: asset.id });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return asset;
}

export async function updateAsset(id: string, input: unknown, user: SessionUser | null) {
  const parsed = assetInputSchema.parse(input);
  if (!canEditAsset(user)) throw new Error("You do not have permission to edit assets.");
  if (!hasDatabaseUrl()) throw new Error("DATABASE_URL is required for persistent asset updates.");

  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const before = await prisma.asset.findFirstOrThrow({ where: { id, ...(await scopedAssetWhere(user)), archivedAt: null } });
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      name: parsed.name,
      description: parsed.description,
      categoryId: parsed.categoryId,
      institutionId: parsed.institutionId,
      departmentId: parsed.departmentId || null,
      locationId: parsed.locationId || null,
      location: parsed.location,
      acquisitionDate: new Date(parsed.acquisitionDate),
      purchaseCost: parsed.purchaseCost,
      supplier: parsed.supplier || null,
      usefulLifeYears: parsed.usefulLifeYears,
      depreciationMethod: parsed.depreciationMethod,
      condition: parsed.condition,
      status: parsed.status,
      assignedUserId: parsed.assignedUserId || null,
      serialNumber: parsed.serialNumber || null,
      assetTagNumber: parsed.assetTagNumber || null,
      warrantyExpiry: parsed.warrantyExpiry ? new Date(parsed.warrantyExpiry) : null,
    },
  });

  if (before.assignedUserId !== (parsed.assignedUserId || null) && parsed.assignedUserId) {
    await prisma.assetAssignment.create({
      data: {
        assetId: asset.id,
        userId: parsed.assignedUserId,
        conditionOnIssue: parsed.condition,
        notes: "Assignment changed during asset update",
      },
    });
    await writeAuditLog({ actorId: dbUser?.id, action: "ASSIGN", module: "assets", recordId: asset.id, oldValue: { assignedUserId: before.assignedUserId }, newValue: { assignedUserId: parsed.assignedUserId }, assetId: asset.id });
  }

  await writeAuditLog({ actorId: dbUser?.id, action: "UPDATE", module: "assets", recordId: asset.id, oldValue: before, newValue: asset, assetId: asset.id });
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  return asset;
}

export async function archiveAsset(id: string, user: SessionUser | null) {
  if (!canArchiveAsset(user)) throw new Error("You do not have permission to archive assets.");
  if (!hasDatabaseUrl()) throw new Error("DATABASE_URL is required for persistent asset archive.");

  const prisma = getPrisma();
  const dbUser = await resolveDbUser(user);
  const before = await prisma.asset.findFirstOrThrow({ where: { id, ...(await scopedAssetWhere(user)), archivedAt: null } });
  const asset = await prisma.asset.update({ where: { id }, data: { archivedAt: new Date(), status: "DISPOSED" } });
  await writeAuditLog({ actorId: dbUser?.id, action: "ARCHIVE", module: "assets", recordId: id, oldValue: before, newValue: asset, assetId: id });
  revalidatePath("/assets");
  return asset;
}

export async function logAssetExport(user: SessionUser | null, count: number) {
  const dbUser = await resolveDbUser(user);
  await writeAuditLog({ actorId: dbUser?.id, action: "EXPORT", module: "assets", recordId: "asset-register", newValue: { count } });
}

export async function getNationalMetrics(user?: SessionUser | null) {
  const rows = await listAssets(user);
  let fleetIndicators = {
    vehiclesDueService: fleet.filter((item) => item.nextService <= new Date().toISOString().slice(0, 10)).length,
    vehiclesDueInsurance: 0,
    highFuelAlerts: fleet.filter((item) => item.anomaly !== "None").length,
    fleetDisposalRecommendations: rows.filter((asset) => asset.category === "Vehicles" && (asset.condition === "POOR" || asset.status === "DUE_DISPOSAL")).length,
  };
  let housingIndicators = {
    occupancyRate: Math.round((housingUnits.filter((unit) => unit.status === "Occupied").length / housingUnits.length) * 100),
    vacantHouses: housingUnits.filter((unit) => unit.status === "Vacant").length,
    pendingHousingMaintenance: housingUnits.filter((unit) => unit.status === "Maintenance").length,
    projectCompletionSummary: 0,
    poorPremises: housingUnits.filter((unit) => unit.condition === "Fair").length,
  };
  if (hasDatabaseUrl()) {
    try {
      const prisma = getPrisma();
      const today = new Date();
      const insuranceLimit = new Date(today);
      insuranceLimit.setDate(insuranceLimit.getDate() + 45);
      const [fleetRows, highFuelAlerts] = await Promise.all([
        prisma.fleetAsset.findMany({
          where: { archivedAt: null, asset: { archivedAt: null } },
          include: { asset: true, serviceRecords: true, accidentLogs: true },
        }),
        prisma.fuelLog.count({ where: { abnormalFlag: true } }),
      ]);
      fleetIndicators = {
        vehiclesDueService: fleetRows.filter((item) => (item.nextServiceDate && item.nextServiceDate <= today) || (item.nextServiceMileage && item.mileageKm >= item.nextServiceMileage)).length,
        vehiclesDueInsurance: fleetRows.filter((item) => item.insuranceExpiry <= insuranceLimit).length,
        highFuelAlerts,
        fleetDisposalRecommendations: fleetRows.filter((item) => {
          const age = new Date().getFullYear() - item.yearOfManufacture;
          const serviceCost = item.serviceRecords.reduce((sum, service) => sum + Number(service.totalCost), 0);
          const accidentCost = item.accidentLogs.reduce((sum, accident) => sum + Number(accident.actualRepairCost), 0);
          return item.asset.condition === "POOR" || item.asset.condition === "UNSERVICEABLE" || item.mileageKm >= 250000 || age >= 12 || serviceCost + accidentCost > Number(item.asset.purchaseCost) * 0.35;
        }).length,
      };
      const [housingRows, projectRows, pendingHousingMaintenance] = await Promise.all([
        prisma.housingUnit.findMany({ where: { archivedAt: null }, include: { asset: true } }),
        prisma.constructionProject.findMany(),
        prisma.housingMaintenanceRequest.count({ where: { status: { not: "COMPLETED" } } }),
      ]);
      const occupiedHousing = housingRows.filter((item) => item.occupancyStatus === "OCCUPIED").length;
      housingIndicators = {
        occupancyRate: housingRows.length ? Math.round((occupiedHousing / housingRows.length) * 100) : 0,
        vacantHouses: housingRows.filter((item) => item.occupancyStatus === "VACANT").length,
        pendingHousingMaintenance,
        projectCompletionSummary: projectRows.length ? Math.round(projectRows.reduce((sum, item) => sum + item.completionPercentage, 0) / projectRows.length) : 0,
        poorPremises: housingRows.filter((item) => item.asset?.condition === "POOR" || item.asset?.condition === "UNSERVICEABLE" || item.utilityCondition === "Poor" || item.utilityCondition === "Critical").length,
      };
    } catch {
      // Keep demo indicators when fleet tables are not migrated yet.
    }
  }
  const totalValue = rows.reduce((sum, asset) => sum + asset.purchaseCost, 0);
  const dueMaintenance = rows.filter((asset) => asset.status === "UNDER_MAINTENANCE").length;
  const dueDisposal = rows.filter((asset) => asset.status === "DUE_DISPOSAL").length;
  const idle = rows.filter((asset) => asset.status === "IDLE").length;
  const missing = rows.filter((asset) => asset.status === "MISSING").length;
  const byMinistry = institutions.map((institution) => ({
    name: institution.code,
    fullName: institution.name,
    assets: rows.filter((asset) => asset.institution === institution.name).length,
    value: rows.filter((asset) => asset.institution === institution.name).reduce((sum, asset) => sum + asset.purchaseCost, 0),
  })).filter((item) => item.assets > 0 || readAllRoles.has(user?.role ?? ""));
  const byCategory = Array.from(
    rows.reduce((map, asset) => {
      map.set(asset.category, (map.get(asset.category) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([name, count]) => ({ name, count }));

  return {
    totalAssets: rows.length,
    totalValue,
    totalValueLabel: formatKes(totalValue),
    idle,
    dueMaintenance,
    dueDisposal,
    missing,
    pendingApprovals: Math.max(1, Math.round(rows.length / 6)),
    fleetFuelAnomalies: fleet.filter((item) => item.anomaly !== "None").length,
    ...fleetIndicators,
    ...housingIndicators,
    byMinistry,
    byCategory,
    maintenanceTrend: [
      { month: "Jan", cost: 180000 },
      { month: "Feb", cost: 260000 },
      { month: "Mar", cost: 210000 },
      { month: "Apr", cost: 420000 },
    ],
    disposalSummary: [
      { name: "Ready", count: dueDisposal },
      { name: "Review", count: idle },
      { name: "Retain", count: Math.max(0, rows.length - dueDisposal - idle) },
    ],
    recentActivities: activities,
    highRiskAssets: rows.filter((asset) => asset.riskScore >= 45),
  };
}

export async function getInstitutionDashboard(user: SessionUser | null) {
  const rows = await listAssets(user);
  return {
    total: rows.length,
    assigned: rows.filter((asset) => asset.assignedUser !== "Unassigned").length,
    unassigned: rows.filter((asset) => asset.assignedUser === "Unassigned").length,
    good: rows.filter((asset) => asset.condition === "GOOD" || asset.condition === "NEW").length,
    underRepair: rows.filter((asset) => asset.status === "UNDER_MAINTENANCE").length,
    dueReplacement: rows.filter((asset) => asset.condition === "POOR" || asset.condition === "UNSERVICEABLE").length,
    pendingMaintenance: rows.filter((asset) => asset.status === "UNDER_MAINTENANCE").length,
    recentMovements: rows.slice(0, 5).map((asset) => ({
      assetCode: asset.assetCode,
      assetName: asset.name,
      movement: `${asset.department} - ${asset.location}`,
      date: asset.acquisitionDate,
    })),
  };
}

export async function createAssetFromForm(formData: FormData) {
  const input = Object.fromEntries(formData.entries());
  return createAsset(input, null);
}

export { fleet, housingUnits, stockItems, institutions };
