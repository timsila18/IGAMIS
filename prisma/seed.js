require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed IGAMIS.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const roleDefinitions = {
  NATIONAL_TREASURY_SUPER_ADMIN: ["*"],
  MINISTRY_ADMIN: ["dashboard:view", "assets:view", "assets:create", "assets:update", "reports:view", "users:view"],
  DEPARTMENT_ASSET_OFFICER: ["assets:view", "assets:create", "assets:update", "maintenance:create", "transfers:create", "reports:view"],
  FLEET_OFFICER: ["fleet:view", "fleet:update", "assets:view", "maintenance:create", "reports:view"],
  ICT_OFFICER: ["ict:view", "ict:update", "assets:view", "maintenance:create", "reports:view"],
  HOUSING_OFFICER: ["housing:view", "housing:update", "maintenance:create", "reports:view"],
  PROCUREMENT_OFFICER: ["stores:view", "stores:update", "assets:create", "disposals:view", "reports:view"],
  AUDITOR: ["dashboard:view", "dashboard:national", "audit:view", "assets:view", "reports:view", "reports:export"],
  EMPLOYEE_USER: ["dashboard:view", "self:view", "maintenance:create"],
  READ_ONLY_INSPECTOR: ["dashboard:view", "dashboard:national", "assets:view", "reports:view"],
};

const roleNames = {
  NATIONAL_TREASURY_SUPER_ADMIN: "National Treasury Super Admin",
  MINISTRY_ADMIN: "Ministry Admin",
  DEPARTMENT_ASSET_OFFICER: "Department Asset Officer",
  FLEET_OFFICER: "Fleet Officer",
  ICT_OFFICER: "ICT Officer",
  HOUSING_OFFICER: "Housing Officer",
  PROCUREMENT_OFFICER: "Procurement Officer",
  AUDITOR: "Auditor",
  EMPLOYEE_USER: "Employee/User",
  READ_ONLY_INSPECTOR: "Read Only Inspector",
};

const institutions = [
  ["The National Treasury", "TNT", "Ministry"],
  ["Ministry of Health", "MOH", "Ministry"],
  ["Ministry of Education", "MOE", "Ministry"],
  ["Kenya Forest Service", "KFS", "State Corporation"],
  ["Kenya Wildlife Service", "KWS", "State Corporation"],
  ["Judiciary", "JUD", "Independent Office"],
];

const categories = [
  ["Vehicles", "VEH"],
  ["Buildings", "BLD"],
  ["Houses", "HSE"],
  ["Furniture", "FUR"],
  ["ICT Equipment", "ICT"],
  ["Machinery", "MAC"],
  ["Uniforms", "QTM"],
  ["Land", "LND"],
  ["Stores", "STR"],
  ["Others", "OTH"],
];

const demoUsers = [
  ["treasury.admin@igamis.go.ke", "Grace Wanjiku", "TNT-0001", "NATIONAL_TREASURY_SUPER_ADMIN", "TNT"],
  ["health.admin@igamis.go.ke", "Dr. Peter Mwangi", "MOH-1001", "MINISTRY_ADMIN", "MOH"],
  ["asset.officer@igamis.go.ke", "Mercy Njeri", "MOE-2204", "DEPARTMENT_ASSET_OFFICER", "MOE"],
  ["fleet@igamis.go.ke", "Brian Otieno", "TNT-3302", "FLEET_OFFICER", "TNT"],
  ["ict@igamis.go.ke", "Kevin Kiptoo", "MOH-4410", "ICT_OFFICER", "MOH"],
  ["housing@igamis.go.ke", "Lucy Achieng", "TNT-5521", "HOUSING_OFFICER", "TNT"],
  ["procurement@igamis.go.ke", "Samuel Kariuki", "KFS-7712", "PROCUREMENT_OFFICER", "KFS"],
  ["auditor@igamis.go.ke", "Amina Abdullahi", "OAG-8802", "AUDITOR", "JUD"],
  ["employee@igamis.go.ke", "John Kamau", "KWS-9912", "EMPLOYEE_USER", "KWS"],
  ["inspector@igamis.go.ke", "Naomi Chebet", "JUD-6620", "READ_ONLY_INSPECTOR", "JUD"],
];

const sampleAssets = [
  ["TNT", "Vehicles", "Toyota Land Cruiser", "Toyota Land Cruiser Prado executive utility vehicle", 12800000, "Toyota Kenya", 8, "GOOD", "ACTIVE", "GKB 412T"],
  ["TNT", "Houses", "Government staff house", "Three-bedroom staff house in Nairobi government estate", 18500000, "State Department for Housing", 35, "GOOD", "ACTIVE", "TNT-HSE-001"],
  ["MOH", "ICT Equipment", "HP desktop computer", "HP EliteDesk desktop for health records processing", 145000, "Copy Cat Group", 4, "GOOD", "ACTIVE", "HP-MOH-7781"],
  ["TNT", "Furniture", "Office executive desk", "Executive hardwood office desk", 180000, "Executive Furniture Ltd", 10, "GOOD", "ACTIVE", "DESK-TNT-004"],
  ["JUD", "ICT Equipment", "Printer", "HP LaserJet secure registry printer", 98000, "HP Kenya Partner", 5, "FAIR", "ACTIVE", "PRN-JUD-812"],
  ["KFS", "Uniforms", "KFS uniform kit", "Forest ranger uniform and protective kit", 22000, "Rivatex East Africa", 3, "GOOD", "IDLE", "KIT-KFS-0902"],
  ["MOE", "Buildings", "Ministry office building", "Regional education records archive block", 146000000, "State Department for Public Works", 40, "GOOD", "ACTIVE", "BLD-MOE-044"],
  ["MOH", "ICT Equipment", "Laptop", "Dell Latitude encrypted laptop", 186000, "Copy Cat Group", 4, "NEW", "ACTIVE", "DL-9431-KE"],
  ["MOE", "ICT Equipment", "Projector", "Boardroom laser projector", 210000, "Office Technologies Ltd", 5, "GOOD", "ACTIVE", "PRJ-MOE-221"],
  ["JUD", "Furniture", "Filing cabinet", "Mahogany court filing cabinet", 740000, "Executive Furniture Ltd", 10, "POOR", "DUE_DISPOSAL", "CAB-JUD-0221"],
];

async function upsertPermissions() {
  const keys = new Set(Object.values(roleDefinitions).flat());
  keys.delete("*");

  const permissionRows = {};
  for (const key of keys) {
    const [module, action] = key.split(":");
    permissionRows[key] = await prisma.permission.upsert({
      where: { key },
      create: {
        key,
        module,
        action,
        description: `${action} access for ${module}`,
      },
      update: {
        module,
        action,
      },
    });
  }

  return permissionRows;
}

async function main() {
  const permissionRows = await upsertPermissions();

  const roleRows = {};
  for (const [key, permissions] of Object.entries(roleDefinitions)) {
    roleRows[key] = await prisma.role.upsert({
      where: { key },
      create: {
        key,
        name: roleNames[key],
        description: `${roleNames[key]} role for IGAMIS RBAC`,
      },
      update: {
        name: roleNames[key],
      },
    });

    if (permissions.includes("*")) {
      for (const permission of Object.values(permissionRows)) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: roleRows[key].id, permissionId: permission.id } },
          create: { roleId: roleRows[key].id, permissionId: permission.id },
          update: {},
        });
      }
    } else {
      for (const permissionKey of permissions) {
        const permission = permissionRows[permissionKey];
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: roleRows[key].id, permissionId: permission.id } },
          create: { roleId: roleRows[key].id, permissionId: permission.id },
          update: {},
        });
      }
    }
  }

  const institutionRows = {};
  const departmentRows = {};
  const locationRows = {};

  for (const [name, code, type] of institutions) {
    institutionRows[code] = await prisma.institution.upsert({
      where: { code },
      create: { name, code, type, county: "Nairobi" },
      update: { name, type },
    });

    departmentRows[code] = await prisma.department.upsert({
      where: { institutionId_code: { institutionId: institutionRows[code].id, code: "ADMIN" } },
      create: { name: "Administration", code: "ADMIN", institutionId: institutionRows[code].id },
      update: {},
    });

    locationRows[code] = await prisma.location.upsert({
      where: { institutionId_code: { institutionId: institutionRows[code].id, code: `${code}-HQ` } },
      create: {
        name: `${name} Headquarters`,
        code: `${code}-HQ`,
        type: "Headquarters",
        county: "Nairobi",
        institutionId: institutionRows[code].id,
        departmentId: departmentRows[code].id,
      },
      update: {},
    });
  }

  const categoryRows = {};
  for (const [name, code] of categories) {
    categoryRows[name] = await prisma.assetCategory.upsert({
      where: { code },
      create: { name, code },
      update: { name },
    });
  }

  for (const [email, fullName, payrollNo, roleKey, institutionCode] of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        fullName,
        payrollNo,
        phone: "+254700000000",
        status: "ACTIVE",
        institutionId: institutionRows[institutionCode].id,
        departmentId: departmentRows[institutionCode].id,
        primaryRoleId: roleRows[roleKey].id,
      },
      update: {
        fullName,
        payrollNo,
        institutionId: institutionRows[institutionCode].id,
        departmentId: departmentRows[institutionCode].id,
        primaryRoleId: roleRows[roleKey].id,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId_institutionId: { userId: user.id, roleId: roleRows[roleKey].id, institutionId: institutionRows[institutionCode].id } },
      create: { userId: user.id, roleId: roleRows[roleKey].id, institutionId: institutionRows[institutionCode].id },
      update: {},
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "treasury.admin@igamis.go.ke" } });
  const passwordHash = await bcrypt.hash("IGAMIS@2026", 10);

  let firstFleetAsset = null;
  for (let index = 0; index < sampleAssets.length; index++) {
    const [institutionCode, categoryName, name, description, purchaseCost, supplier, usefulLifeYears, condition, status, tag] = sampleAssets[index];
    const categoryCode = categoryRows[categoryName].code;
    const assetCode = `IGAMIS-${institutionCode}-${categoryCode}-2026-${String(index + 1).padStart(6, "0")}`;
    const asset = await prisma.asset.upsert({
      where: { assetCode },
      create: {
        assetCode,
        name,
        qrCode: JSON.stringify({
          assetCode,
          institution: institutionRows[institutionCode].name,
          category: categoryName,
          verificationUrl: `https://igamis.go.ke/verify/${assetCode}`,
        }),
        barcode: assetCode,
        serialNumber: tag,
        assetTagNumber: tag,
        categoryId: categoryRows[categoryName].id,
        description,
        institutionId: institutionRows[institutionCode].id,
        departmentId: departmentRows[institutionCode].id,
        locationId: locationRows[institutionCode].id,
        location: `${institutionRows[institutionCode].name} Headquarters`,
        acquisitionDate: new Date(2024, index % 10, 12),
        purchaseCost,
        supplier,
        usefulLifeYears,
        depreciationMethod: "STRAIGHT_LINE",
        condition,
        status,
        assignedUserId: index % 3 === 0 ? admin.id : null,
        warrantyExpiry: new Date(2028, index % 10, 12),
        photos: [],
        tags: [categoryCode.toLowerCase()],
      },
      update: {
        name,
        serialNumber: tag,
        assetTagNumber: tag,
      },
    });

    if (index === 0) firstFleetAsset = asset;
  }

  if (firstFleetAsset) {
    await prisma.fleetAsset.upsert({
      where: { assetId: firstFleetAsset.id },
      create: {
        assetId: firstFleetAsset.id,
        registrationNumber: "GKB 412T",
        engineNumber: "1GD-IGAMIS-412",
        chassisNumber: "JTEBR3FJX0K412T",
        fuelType: "Diesel",
        driverAssigned: "Central Transport Pool",
        mileageKm: 42800,
        insuranceExpiry: new Date("2026-12-31"),
        nextServiceDate: new Date("2026-05-18"),
      },
      update: {},
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SEED",
      module: "system",
      recordId: "initial-seed",
      oldValue: null,
      newValue: { institutions: institutions.length, users: demoUsers.length },
      ipAddress: "127.0.0.1",
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: "IGAMIS foundation seeded",
      body: `Demo users are ready. Demo password hash prefix: ${passwordHash.slice(0, 16)}...`,
      type: "SECURITY",
    },
  });

  console.log("IGAMIS seed completed.");
  console.log("Demo password for all accounts: IGAMIS@2026");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
