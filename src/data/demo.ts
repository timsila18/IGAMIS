export type RoleKey =
  | "NATIONAL_TREASURY_SUPER_ADMIN"
  | "MINISTRY_ADMIN"
  | "DEPARTMENT_ASSET_OFFICER"
  | "FLEET_OFFICER"
  | "ICT_OFFICER"
  | "HOUSING_OFFICER"
  | "PROCUREMENT_OFFICER"
  | "AUDITOR"
  | "EMPLOYEE_USER"
  | "READ_ONLY_INSPECTOR";

export type Asset = {
  id: string;
  assetCode: string;
  name: string;
  qrCode: string;
  category: string;
  description: string;
  institution: string;
  department: string;
  location: string;
  acquisitionDate: string;
  purchaseCost: number;
  supplier: string;
  usefulLifeYears: number;
  depreciationMethod: string;
  condition: "NEW" | "GOOD" | "FAIR" | "POOR" | "UNSERVICEABLE";
  status:
    | "ACTIVE"
    | "IDLE"
    | "UNDER_MAINTENANCE"
    | "TRANSFER_PENDING"
    | "DUE_DISPOSAL"
    | "DISPOSED"
    | "MISSING";
  assignedUser: string;
  assignedUserEmail?: string;
  serialNumber?: string;
  assetTagNumber?: string;
  warrantyExpiry: string;
  riskScore: number;
  currentValue?: number;
};

export type DemoUser = {
  email: string;
  password: string;
  name: string;
  role: RoleKey;
  institution: string;
};

export const roles: Record<RoleKey, { name: string; permissions: string[] }> = {
  NATIONAL_TREASURY_SUPER_ADMIN: {
    name: "National Treasury Super Admin",
    permissions: ["*"],
  },
  MINISTRY_ADMIN: {
    name: "Ministry Admin",
    permissions: ["dashboard:view", "assets:*", "reports:view", "users:view"],
  },
  DEPARTMENT_ASSET_OFFICER: {
    name: "Department Asset Officer",
    permissions: ["assets:*", "maintenance:create", "transfers:create", "reports:view"],
  },
  FLEET_OFFICER: {
    name: "Fleet Officer",
    permissions: ["fleet:*", "assets:view", "maintenance:*", "reports:view"],
  },
  ICT_OFFICER: {
    name: "ICT Officer",
    permissions: ["ict:*", "assets:view", "maintenance:*", "reports:view"],
  },
  HOUSING_OFFICER: {
    name: "Housing Officer",
    permissions: ["housing:*", "maintenance:*", "reports:view"],
  },
  PROCUREMENT_OFFICER: {
    name: "Procurement Officer",
    permissions: ["stores:*", "assets:create", "disposals:view", "reports:view"],
  },
  AUDITOR: {
    name: "Auditor",
    permissions: ["dashboard:view", "dashboard:national", "audit:*", "assets:view", "reports:*"],
  },
  EMPLOYEE_USER: {
    name: "Employee/User",
    permissions: ["dashboard:view", "self:view", "maintenance:create"],
  },
  READ_ONLY_INSPECTOR: {
    name: "Read Only Inspector",
    permissions: ["dashboard:view", "dashboard:national", "assets:view", "reports:view"],
  },
};

export const demoUsers: DemoUser[] = [
  {
    email: "treasury.admin@igamis.go.ke",
    password: "IGAMIS@2026",
    name: "Grace Wanjiku",
    role: "NATIONAL_TREASURY_SUPER_ADMIN",
    institution: "The National Treasury",
  },
  {
    email: "health.admin@igamis.go.ke",
    password: "IGAMIS@2026",
    name: "Dr. Peter Mwangi",
    role: "MINISTRY_ADMIN",
    institution: "Ministry of Health",
  },
  {
    email: "fleet@igamis.go.ke",
    password: "IGAMIS@2026",
    name: "Brian Otieno",
    role: "FLEET_OFFICER",
    institution: "The National Treasury",
  },
  {
    email: "auditor@igamis.go.ke",
    password: "IGAMIS@2026",
    name: "Amina Abdullahi",
    role: "AUDITOR",
    institution: "Office of the Auditor General",
  },
];

export const institutions = [
  { name: "The National Treasury", code: "TNT", type: "Ministry" },
  { name: "Ministry of Health", code: "MOH", type: "Ministry" },
  { name: "Ministry of Education", code: "MOE", type: "Ministry" },
  { name: "Kenya Forest Service", code: "KFS", type: "State Corporation" },
  { name: "Kenya Wildlife Service", code: "KWS", type: "State Corporation" },
  { name: "Judiciary", code: "JUD", type: "Independent Office" },
];

export const assets: Asset[] = [
  {
    id: "asset-001",
    assetCode: "TNT-VEH-2026-0001",
    name: "Toyota Land Cruiser",
    qrCode: "IGAMIS:TNT-VEH-2026-0001",
    category: "Vehicles",
    description: "Toyota Land Cruiser Prado executive utility vehicle",
    institution: "The National Treasury",
    department: "Administration",
    location: "Treasury Building, Harambee Avenue",
    acquisitionDate: "2024-02-12",
    purchaseCost: 12800000,
    supplier: "Toyota Kenya",
    usefulLifeYears: 8,
    depreciationMethod: "STRAIGHT_LINE",
    condition: "GOOD",
    status: "ACTIVE",
    assignedUser: "Cabinet Secretary Office",
    serialNumber: "GKB 412T",
    assetTagNumber: "GKB 412T",
    warrantyExpiry: "2027-02-12",
    riskScore: 18,
  },
  {
    id: "asset-002",
    assetCode: "MOH-ICT-2025-0318",
    name: "Laptop",
    qrCode: "IGAMIS:MOH-ICT-2025-0318",
    category: "ICT Equipment",
    description: "Dell Latitude encrypted laptop with endpoint protection",
    institution: "Ministry of Health",
    department: "Digital Health",
    location: "Afya House, Nairobi",
    acquisitionDate: "2025-05-08",
    purchaseCost: 186000,
    supplier: "Copy Cat Group",
    usefulLifeYears: 4,
    depreciationMethod: "STRAIGHT_LINE",
    condition: "NEW",
    status: "ACTIVE",
    assignedUser: "Payroll MOH-44219",
    assignedUserEmail: "employee@igamis.go.ke",
    serialNumber: "DL-9431-KE",
    assetTagNumber: "MOH-LAP-0318",
    warrantyExpiry: "2028-05-08",
    riskScore: 9,
  },
  {
    id: "asset-003",
    assetCode: "MOE-BLD-2023-0044",
    name: "Ministry office building",
    qrCode: "IGAMIS:MOE-BLD-2023-0044",
    category: "Buildings",
    description: "Regional education records archive block",
    institution: "Ministry of Education",
    department: "Infrastructure",
    location: "Jogoo House B compound",
    acquisitionDate: "2023-11-30",
    purchaseCost: 146000000,
    supplier: "State Department for Public Works",
    usefulLifeYears: 40,
    depreciationMethod: "STRAIGHT_LINE",
    condition: "GOOD",
    status: "ACTIVE",
    assignedUser: "Records Directorate",
    serialNumber: "BLD-MOE-044",
    assetTagNumber: "MOE-BLD-044",
    warrantyExpiry: "2026-11-30",
    riskScore: 14,
  },
  {
    id: "asset-004",
    assetCode: "KFS-QM-2024-0902",
    name: "KFS uniform kit",
    qrCode: "IGAMIS:KFS-QM-2024-0902",
    category: "Uniforms",
    description: "Forest ranger protective gear batch",
    institution: "Kenya Forest Service",
    department: "Quartermaster",
    location: "KFS Headquarters stores",
    acquisitionDate: "2024-08-18",
    purchaseCost: 9200000,
    supplier: "Rivatex East Africa",
    usefulLifeYears: 3,
    depreciationMethod: "STRAIGHT_LINE",
    condition: "GOOD",
    status: "IDLE",
    assignedUser: "Unassigned batch",
    serialNumber: "KIT-KFS-0902",
    assetTagNumber: "KFS-KIT-0902",
    warrantyExpiry: "2026-08-18",
    riskScore: 31,
  },
  {
    id: "asset-005",
    assetCode: "KWS-VEH-2022-0142",
    name: "Nissan patrol field vehicle",
    qrCode: "IGAMIS:KWS-VEH-2022-0142",
    category: "Vehicles",
    description: "Nissan patrol field vehicle",
    institution: "Kenya Wildlife Service",
    department: "Field Operations",
    location: "Nairobi National Park station",
    acquisitionDate: "2022-07-15",
    purchaseCost: 8900000,
    supplier: "CFAO Motors",
    usefulLifeYears: 7,
    depreciationMethod: "REDUCING_BALANCE",
    condition: "FAIR",
    status: "UNDER_MAINTENANCE",
    assignedUser: "Ranger Unit 4",
    assignedUserEmail: "employee@igamis.go.ke",
    serialNumber: "GKX 771K",
    assetTagNumber: "KWS-VEH-0142",
    warrantyExpiry: "2025-07-15",
    riskScore: 46,
  },
  {
    id: "asset-006",
    assetCode: "JUD-FUR-2021-0221",
    name: "Filing cabinet",
    qrCode: "IGAMIS:JUD-FUR-2021-0221",
    category: "Furniture",
    description: "Mahogany court filing cabinets",
    institution: "Judiciary",
    department: "Milimani Law Courts",
    location: "Milimani Registry",
    acquisitionDate: "2021-03-22",
    purchaseCost: 740000,
    supplier: "Executive Furniture Ltd",
    usefulLifeYears: 10,
    depreciationMethod: "STRAIGHT_LINE",
    condition: "POOR",
    status: "DUE_DISPOSAL",
    assignedUser: "Chief Registrar Office",
    serialNumber: "CAB-JUD-0221",
    assetTagNumber: "JUD-FUR-0221",
    warrantyExpiry: "2024-03-22",
    riskScore: 64,
  },
];

export const fleet = [
  { registrationNumber: "GKB 412T", institution: "The National Treasury", mileageKm: 42800, fuelType: "Diesel", anomaly: "None", nextService: "2026-05-18" },
  { registrationNumber: "GKX 771K", institution: "Kenya Wildlife Service", mileageKm: 139400, fuelType: "Diesel", anomaly: "Fuel spike 18%", nextService: "2026-04-30" },
  { registrationNumber: "GKB 118M", institution: "Ministry of Health", mileageKm: 81200, fuelType: "Petrol", anomaly: "Late log submission", nextService: "2026-06-02" },
];

export const housingUnits = [
  { unitCode: "TNT-HSE-001", institution: "The National Treasury", type: "Staff house", status: "Occupied", rent: 18500, condition: "Good", progress: 100 },
  { unitCode: "MOH-AHU-118", institution: "Ministry of Health", type: "Affordable housing unit", status: "Vacant", rent: 12000, condition: "New", progress: 100 },
  { unitCode: "KFS-CMP-044", institution: "Kenya Forest Service", type: "Camp office", status: "Maintenance", rent: 0, condition: "Fair", progress: 72 },
];

export const stockItems = [
  { sku: "STN-A4-BOX", name: "A4 security stationery", type: "Stationery", quantity: 180, reorderLevel: 120, supplier: "Government Printer" },
  { sku: "FUEL-DSL-NBI", name: "Diesel stock Nairobi depot", type: "Fuel stock", quantity: 9200, reorderLevel: 10000, supplier: "National Oil" },
  { sku: "SPARE-TYR-17", name: "All terrain vehicle tyres", type: "Spare parts", quantity: 32, reorderLevel: 24, supplier: "AutoXpress" },
];

export const activities = [
  "Auditor flagged 12 unverified ICT assets at Afya House",
  "KWS field vehicle GKX 771K moved to maintenance workflow",
  "Treasury approved transfer of 4 laptops to Pensions Department",
  "Judiciary disposal board opened survey for registry furniture",
  "KFS quartermaster stock batch prepared for ranger allocation",
];

export const formatKes = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
