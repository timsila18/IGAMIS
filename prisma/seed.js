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
  MINISTRY_ADMIN: ["dashboard:view", "assets:view", "assets:create", "assets:update", "fleet:view", "housing:view", "housing:update", "reports:view", "users:view"],
  DEPARTMENT_ASSET_OFFICER: ["assets:view", "assets:create", "assets:update", "fleet:view", "housing:view", "maintenance:create", "transfers:create", "reports:view"],
  FLEET_OFFICER: ["fleet:view", "fleet:create", "fleet:update", "fleet:archive", "assets:view", "maintenance:create", "reports:view"],
  ICT_OFFICER: ["ict:view", "ict:update", "assets:view", "maintenance:create", "reports:view"],
  HOUSING_OFFICER: ["housing:view", "housing:update", "maintenance:create", "reports:view"],
  PROCUREMENT_OFFICER: ["stores:view", "stores:update", "assets:create", "fleet:view", "housing:view", "disposals:view", "reports:view"],
  AUDITOR: ["dashboard:view", "dashboard:national", "audit:view", "assets:view", "fleet:view", "housing:view", "reports:view", "reports:export"],
  EMPLOYEE_USER: ["dashboard:view", "self:view", "fleet:view", "housing:view", "maintenance:create"],
  READ_ONLY_INSPECTOR: ["dashboard:view", "dashboard:national", "assets:view", "fleet:view", "housing:view", "reports:view"],
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

const sampleFleet = [
  ["TNT", "Toyota Land Cruiser", "Toyota Land Cruiser Prado executive utility vehicle", 12800000, "Toyota Kenya", "GKB 412T", "Toyota", "Land Cruiser", "SUV", 2024, "1GD-IGAMIS-412", "JTEBR3FJX0K412T", "Diesel", 87, 42800, "Central Transport Pool", "TNT-3302", "GA Insurance", "POL-GKB-412T", "2026-12-31", "2026-05-18", 47800, "GPS-TNT-412"],
  ["TNT", "Toyota Hilux", "Toyota Hilux double cab utility vehicle", 7600000, "Toyota Kenya", "GKB 118M", "Toyota", "Hilux", "Pickup", 2022, "2GD-IGAMIS-118", "AHTBB3CD20118M", "Diesel", 80, 81200, "Transport Pool Driver", "TNT-3302", "Britam General", "POL-GKB-118M", "2026-10-14", "2026-06-02", 86000, "GPS-TNT-118"],
  ["KWS", "Nissan Patrol", "Nissan Patrol field conservation vehicle", 8900000, "CFAO Motors", "GKX 771K", "Nissan", "Patrol", "SUV", 2021, "ZD30-IGAMIS-771", "JN1TCSY61Z0771K", "Diesel", 95, 139400, "Ranger Unit 4", "KWS-9912", "ICEA Lion", "POL-GKX-771K", "2026-05-10", "2026-04-30", 140000, "GPS-KWS-771"],
  ["MOE", "Isuzu Truck", "Isuzu administrative stores truck", 9800000, "Isuzu East Africa", "GKA 522E", "Isuzu", "FRR", "Truck", 2020, "4HK1-IGAMIS-522", "JALFRR90PE0522E", "Diesel", 120, 168200, "Stores Transport Unit", "MOE-2204", "Jubilee Allianz", "POL-GKA-522E", "2026-08-22", "2026-05-12", 172000, "GPS-MOE-522"],
  ["KFS", "KFS field vehicle", "Toyota Land Cruiser forest patrol vehicle", 9400000, "Toyota Kenya", "GKB 913F", "Toyota", "Land Cruiser", "SUV", 2019, "1HZ-IGAMIS-913", "JTEHZJ79J00913F", "Diesel", 90, 214900, "KFS Field Command", "KFS-7712", "APA Insurance", "POL-GKB-913F", "2026-06-19", "2026-04-28", 215000, "GPS-KFS-913"],
  ["MOH", "Ministry saloon car", "Toyota Corolla official saloon car", 4200000, "Toyota Kenya", "GKB 204H", "Toyota", "Corolla", "Saloon", 2023, "2ZR-IGAMIS-204", "JTDBR32E40204H", "Petrol", 50, 36400, "Afya House Pool", "MOH-1001", "GA Insurance", "POL-GKB-204H", "2027-01-05", "2026-07-10", 41000, "GPS-MOH-204"],
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

  const usersByPayroll = {};
  for (const user of await prisma.user.findMany()) {
    if (user.payrollNo) usersByPayroll[user.payrollNo] = user;
  }

  for (let index = 0; index < sampleFleet.length; index++) {
    const [institutionCode, name, description, purchaseCost, supplier, registrationNumber, make, model, bodyType, yearOfManufacture, engineNumber, chassisNumber, fuelType, tankCapacity, mileageKm, driverAssigned, driverPayrollNo, insuranceProvider, insurancePolicyNumber, insuranceExpiry, nextServiceDate, nextServiceMileage, gpsTrackerId] = sampleFleet[index];
    const assetCode = `IGAMIS-${institutionCode}-VEH-2026-${String(index + 1).padStart(6, "0")}`;
    const assignedUser = usersByPayroll[driverPayrollNo] ?? null;
    const asset = await prisma.asset.upsert({
      where: { assetCode },
      create: {
        assetCode,
        name,
        qrCode: JSON.stringify({
          assetCode,
          institution: institutionRows[institutionCode].name,
          category: "Vehicles",
          verificationUrl: `https://igamis.go.ke/verify/${assetCode}`,
        }),
        barcode: assetCode,
        serialNumber: chassisNumber,
        assetTagNumber: registrationNumber,
        categoryId: categoryRows.Vehicles.id,
        description,
        institutionId: institutionRows[institutionCode].id,
        departmentId: departmentRows[institutionCode].id,
        locationId: locationRows[institutionCode].id,
        location: `${institutionRows[institutionCode].name} Headquarters`,
        acquisitionDate: new Date(2022 + (index % 3), index % 11, 10),
        purchaseCost,
        supplier,
        usefulLifeYears: 8,
        depreciationMethod: "STRAIGHT_LINE",
        condition: mileageKm > 200000 ? "FAIR" : "GOOD",
        status: mileageKm > 130000 ? "UNDER_MAINTENANCE" : "ACTIVE",
        assignedUserId: assignedUser?.id ?? null,
        warrantyExpiry: new Date(insuranceExpiry),
        photos: [],
        tags: ["fleet", "vehicle"],
      },
      update: {
        name,
        serialNumber: chassisNumber,
        assetTagNumber: registrationNumber,
        assignedUserId: assignedUser?.id ?? null,
      },
    });

    const fleet = await prisma.fleetAsset.upsert({
      where: { registrationNumber },
      create: {
        assetId: asset.id,
        registrationNumber,
        ntsaRegistrationStatus: "VERIFIED",
        make,
        model,
        bodyType,
        yearOfManufacture,
        engineNumber,
        chassisNumber,
        fuelType,
        tankCapacityLitres: tankCapacity,
        driverAssigned,
        driverPayrollNo,
        mileageKm,
        insuranceProvider,
        insurancePolicyNumber,
        insuranceStartDate: new Date("2026-01-01"),
        insuranceExpiry: new Date(insuranceExpiry),
        lastServiceDate: new Date("2026-02-15"),
        nextServiceDate: new Date(nextServiceDate),
        nextServiceMileage,
        gpsTrackerId,
        gpsLastKnownLocation: `${institutionRows[institutionCode].name} Headquarters`,
        gpsLastSyncAt: new Date("2026-04-20"),
        gpsMileageSyncStatus: "MANUAL_SYNC_READY",
        fuelCardNumber: `CARD-${registrationNumber.replaceAll(" ", "")}`,
        remarks: "Seeded national fleet record",
      },
      update: {
        assetId: asset.id,
        make,
        model,
        bodyType,
        mileageKm,
        insuranceExpiry: new Date(insuranceExpiry),
        nextServiceDate: new Date(nextServiceDate),
        nextServiceMileage,
      },
    });

    await prisma.vehicleAssignment.deleteMany({ where: { fleetAssetId: fleet.id } });
    await prisma.vehicleAssignment.create({
      data: {
        fleetAssetId: fleet.id,
        driverId: assignedUser?.id ?? null,
        driverName: driverAssigned,
        payrollNo: driverPayrollNo,
        notes: "Seeded driver assignment",
      },
    });

    await prisma.fuelLog.deleteMany({ where: { fleetAssetId: fleet.id } });
    await prisma.fuelLog.createMany({
      data: [
        {
          fleetAssetId: fleet.id,
          date: new Date("2026-02-10"),
          odometerReadingKm: Math.max(0, mileageKm - 2400),
          litres: 68,
          costPerLitre: 182,
          totalCost: 12376,
          fuelStation: "National Oil Nairobi",
          fuelCardReference: `FUEL-${registrationNumber}-001`,
          recordedById: admin.id,
          consumptionRate: 12.4,
          abnormalFlag: false,
        },
        {
          fleetAssetId: fleet.id,
          date: new Date("2026-03-12"),
          odometerReadingKm: Math.max(0, mileageKm - 1200),
          litres: index === 2 ? 122 : 72,
          costPerLitre: 184,
          totalCost: index === 2 ? 22448 : 13248,
          fuelStation: "KenolKobil Government Card",
          fuelCardReference: `FUEL-${registrationNumber}-002`,
          recordedById: admin.id,
          consumptionRate: index === 2 ? 21.8 : 13.1,
          abnormalFlag: index === 2,
        },
      ],
    });

    await prisma.serviceRecord.deleteMany({ where: { fleetAssetId: fleet.id } });
    await prisma.serviceRecord.create({
      data: {
        fleetAssetId: fleet.id,
        serviceDate: new Date("2026-02-15"),
        serviceType: "Preventive maintenance",
        vendor: index % 2 === 0 ? "Toyota Kenya Workshop" : "Government Mechanical Garage",
        odometerReadingKm: Math.max(0, mileageKm - 900),
        workDone: "Oil service, brake inspection and suspension check",
        partsReplaced: "Oil filter, air filter",
        labourCost: 22000,
        partsCost: index >= 3 ? 185000 : 68000,
        totalCost: index >= 3 ? 207000 : 90000,
        nextServiceDate: new Date(nextServiceDate),
        nextServiceMileage,
        recordedById: admin.id,
        remarks: "Seeded service record",
      },
    });

    await prisma.insuranceRecord.deleteMany({ where: { fleetAssetId: fleet.id } });
    await prisma.insuranceRecord.create({
      data: {
        fleetAssetId: fleet.id,
        provider: insuranceProvider,
        policyNumber: insurancePolicyNumber,
        coverType: "Comprehensive",
        startDate: new Date("2026-01-01"),
        expiryDate: new Date(insuranceExpiry),
        premiumAmount: Math.round(purchaseCost * 0.035),
        renewalStatus: "ACTIVE",
        recordedById: admin.id,
      },
    });
  }

  const accidentVehicle = await prisma.fleetAsset.findUnique({ where: { registrationNumber: "GKX 771K" } });
  if (accidentVehicle) {
    await prisma.accidentLog.deleteMany({ where: { fleetAssetId: accidentVehicle.id } });
    await prisma.accidentLog.create({
      data: {
        fleetAssetId: accidentVehicle.id,
        accidentDate: new Date("2026-03-22"),
        location: "Nairobi National Park service road",
        driver: "Ranger Unit 4",
        description: "Minor field operation collision during patrol response.",
        policeAbstractNumber: "ABS-KWS-2026-031",
        insuranceClaimNumber: "CLM-GKX771K-2026",
        repairEstimate: 420000,
        actualRepairCost: 385000,
        status: "CLAIM_SUBMITTED",
        photoPaths: [],
        documentPaths: [],
        recordedById: admin.id,
      },
    });
  }

  const sampleHousing = [
    ["TNT", "Treasury Staff Quarters Nairobi", "Staff Quarters", "Nairobi", "Nairobi", "Harambee Estate, Nairobi", 3, 2, 6, 1978, 18500000, "OCCUPIED", "John Kamau", "KWS-9912", 18500, "Good"],
    ["KFS", "KFS Forest Station House", "Staff Quarters", "Nyeri", "Nyeri", "KFS Forest Station, Nyeri", 2, 1, 4, 1998, 7200000, "OCCUPIED", "Samuel Kariuki", "KFS-7712", 8500, "Fair"],
    ["JUD", "Judiciary Residence Nakuru", "Residence", "Nakuru", "Nakuru", "Milimani Estate, Nakuru", 4, 3, 8, 2012, 26000000, "VACANT", null, null, 0, "Good"],
    ["MOE", "Ministry Office Block Nairobi", "Government Office", "Nairobi", "Nairobi", "Jogoo House compound", 0, 12, 42, 2006, 146000000, "OCCUPIED", "Records Directorate", "MOE-2204", 0, "Good"],
    ["TNT", "Affordable Housing Unit Park Road", "Affordable Housing Unit", "Nairobi", "Ngara", "Park Road Estate", 2, 1, 4, 2024, 4200000, "VACANT", null, null, 12000, "Excellent"],
    ["MOH", "Government Warehouse Mombasa", "Warehouse", "Mombasa", "Mombasa", "Changamwe depot", 0, 4, 10, 2018, 64000000, "UNDER_MAINTENANCE", "Medical Supplies Unit", "MOH-1001", 0, "Poor"],
  ];

  for (let index = 0; index < sampleHousing.length; index++) {
    const [institutionCode, name, unitType, county, town, address, bedrooms, bathrooms, rooms, yearBuilt, value, occupancyStatus, occupantName, occupantPayrollNo, rent, conditionLabel] = sampleHousing[index];
    const categoryName = unitType === "Government Office" || unitType === "Warehouse" ? "Buildings" : "Houses";
    const categoryCode = categoryRows[categoryName].code;
    const assetCode = `IGAMIS-${institutionCode}-${categoryCode}-2026-${String(index + 21).padStart(6, "0")}`;
    const assetCondition = conditionLabel === "Excellent" ? "NEW" : conditionLabel === "Good" ? "GOOD" : conditionLabel === "Fair" ? "FAIR" : conditionLabel === "Poor" ? "POOR" : "UNSERVICEABLE";
    const asset = await prisma.asset.upsert({
      where: { assetCode },
      create: {
        assetCode,
        name,
        qrCode: JSON.stringify({ assetCode, institution: institutionRows[institutionCode].name, category: categoryName, verificationUrl: `https://igamis.go.ke/verify/${assetCode}` }),
        barcode: assetCode,
        categoryId: categoryRows[categoryName].id,
        description: `${unitType} managed through IGAMIS Housing & Premises`,
        institutionId: institutionRows[institutionCode].id,
        departmentId: departmentRows[institutionCode].id,
        locationId: locationRows[institutionCode].id,
        location: address,
        acquisitionDate: new Date(yearBuilt, 0, 1),
        purchaseCost: value,
        usefulLifeYears: unitType === "Warehouse" || unitType === "Government Office" ? 40 : 35,
        depreciationMethod: "STRAIGHT_LINE",
        condition: assetCondition,
        status: occupancyStatus === "UNDER_MAINTENANCE" ? "UNDER_MAINTENANCE" : "ACTIVE",
        photos: [],
        tags: ["housing", unitType.toLowerCase()],
      },
      update: { name, condition: assetCondition },
    });

    const unit = await prisma.housingUnit.upsert({
      where: { unitCode: assetCode },
      create: {
        assetId: asset.id,
        institutionId: institutionRows[institutionCode].id,
        locationId: locationRows[institutionCode].id,
        unitCode: assetCode,
        unitType,
        county,
        subCounty: town,
        town,
        ward: "Central",
        physicalAddress: address,
        gpsCoordinates: "-1.286389,36.817223",
        bedrooms,
        bathrooms,
        rooms,
        plotSize: "0.25 acres",
        floorSize: `${rooms * 28} sqm`,
        constructionType: unitType === "Temporary Structure" ? "Temporary Structure" : "Permanent Structure",
        yearBuilt,
        occupancyCapacity: Math.max(1, rooms),
        utilitiesAvailable: ["Water", "Electricity", "Security"],
        monthlyRentValue: rent,
        estimatedMarketValue: value,
        occupancyStatus,
        occupantName,
        occupantPayrollNo,
        rentDeduction: rent,
        utilityCondition: conditionLabel,
        constructionProgress: unitType === "Affordable Housing Unit" ? 100 : 100,
        gisLocation: "-1.286389,36.817223",
        remarks: "Seeded housing and premises property",
      },
      update: {
        assetId: asset.id,
        occupancyStatus,
        occupantName,
        occupantPayrollNo,
        estimatedMarketValue: value,
        utilityCondition: conditionLabel,
      },
    });

    await prisma.housingAllocation.deleteMany({ where: { housingUnitId: unit.id } });
    if (occupantName && occupantPayrollNo) {
      const employee = usersByPayroll[occupantPayrollNo] ?? null;
      await prisma.housingAllocation.create({
        data: {
          housingUnitId: unit.id,
          employeeId: employee?.id ?? null,
          employeeName: occupantName,
          payrollNo: occupantPayrollNo,
          institution: institutionRows[institutionCode].name,
          allocationDate: new Date("2026-01-15"),
          expectedVacationDate: new Date("2028-01-15"),
          monthlyRentDeduction: rent,
          familySize: 4,
          status: "APPROVED",
          approvedAt: new Date("2026-01-16"),
          createdById: admin.id,
        },
      });
    }

    await prisma.housingMaintenanceRequest.deleteMany({ where: { housingUnitId: unit.id } });
    if (index === 1 || index === 5) {
      await prisma.housingMaintenanceRequest.create({
        data: {
          requestNo: `HM-2026-${String(index + 1).padStart(5, "0")}`,
          housingUnitId: unit.id,
          occupant: occupantName ?? "Facilities Manager",
          requesterId: admin.id,
          requestType: index === 5 ? "Roofing" : "Plumbing",
          description: index === 5 ? "Warehouse roof leak and gutter replacement" : "Water system pressure and kitchen sink repair",
          priority: index === 5 ? "HIGH" : "MEDIUM",
          technicianVendor: "State Department for Public Works",
          estimatedCost: index === 5 ? 1850000 : 125000,
          actualCost: index === 5 ? 0 : 98000,
          status: index === 5 ? "IN_PROGRESS" : "COMPLETED",
          completionDate: index === 5 ? null : new Date("2026-03-12"),
          beforePhotoPaths: [],
          afterPhotoPaths: [],
        },
      });
    }

    await prisma.propertyInspection.deleteMany({ where: { housingUnitId: unit.id } });
    await prisma.propertyInspection.create({
      data: {
        housingUnitId: unit.id,
        inspectionDate: new Date("2026-02-20"),
        inspectorName: "IGAMIS Property Inspector",
        conditionRating: conditionLabel,
        findings: `${name} assessed as ${conditionLabel}.`,
        recommendation: conditionLabel === "Poor" ? "Renovation recommended" : conditionLabel === "Fair" ? "Major repair needed" : "Routine maintenance",
        nextInspectionDate: new Date("2027-02-20"),
        documentPaths: [],
      },
    });
  }

  await prisma.constructionProject.deleteMany({ where: { projectCode: { startsWith: "IGAMIS-" } } });
  const projectSeeds = [
    ["TNT", "Park Road Affordable Housing Phase II", "Affordable housing project", "Nairobi", "Ngara", "National Housing Corporation", 450000000, 284000000, 63, "ACTIVE"],
    ["MOE", "Regional Education Office Renovation", "Renovation", "Kisumu", "Kisumu", "State Department for Public Works", 120000000, 91000000, 76, "ACTIVE"],
    ["KFS", "Forest Station Staff Quarters Development", "Staff quarter development", "Nyeri", "Nyeri", "Kenya Public Works Contractor", 88000000, 42000000, 48, "DELAYED"],
  ];
  for (let index = 0; index < projectSeeds.length; index++) {
    const [institutionCode, projectName, projectType, county, town, contractor, budgetApproved, amountSpent, completionPercentage, status] = projectSeeds[index];
    await prisma.constructionProject.create({
      data: {
        projectCode: `IGAMIS-${institutionCode}-PRJ-2026-${String(index + 1).padStart(4, "0")}`,
        projectName,
        projectType,
        institutionId: institutionRows[institutionCode].id,
        contractor,
        county,
        town,
        startDate: new Date("2026-01-10"),
        expectedCompletion: new Date("2026-12-15"),
        budgetApproved,
        amountSpent,
        completionPercentage,
        status,
        sitePhotoPaths: [],
        inspectionNotes: status === "DELAYED" ? "Delay alert: material delivery variance." : "Progress within reporting tolerance.",
      },
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
