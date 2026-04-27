import { z } from "zod";
import { conditionValues, depreciationValues, statusValues } from "@/lib/asset-validation";

export const propertyTypes = [
  "Staff Quarters",
  "Affordable Housing Unit",
  "Government Office",
  "Warehouse",
  "Training Centre",
  "Camp",
  "Guest House",
  "Residence",
  "Land Parcel",
  "Temporary Structure",
  "Permanent Structure",
  "Semi-Permanent Structure",
] as const;

export const occupancyStatuses = ["VACANT", "OCCUPIED", "UNDER_MAINTENANCE", "RESERVED", "UNDER_CONSTRUCTION"] as const;
export const conditionRatings = ["Excellent", "Good", "Fair", "Poor", "Critical"] as const;
export const maintenanceTypes = ["Plumbing", "Electrical", "Painting", "Roofing", "Structural", "Security", "Cleaning", "Water system", "Internet/Cabling", "Other"] as const;

const optionalText = z.string().optional().transform((value) => value?.trim() || undefined);
const optionalDate = z.string().optional().transform((value) => value || undefined);

export const housingPropertySchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  institutionId: z.string().min(1),
  departmentId: z.string().optional(),
  locationId: z.string().optional(),
  acquisitionDate: z.string().min(1),
  purchaseCost: z.coerce.number().nonnegative(),
  usefulLifeYears: z.coerce.number().int().min(1).max(80),
  depreciationMethod: z.enum(depreciationValues),
  condition: z.enum(conditionValues),
  status: z.enum(statusValues),
  unitType: z.enum(propertyTypes),
  county: z.string().min(2),
  subCounty: optionalText,
  town: z.string().min(2),
  ward: optionalText,
  physicalAddress: z.string().min(3),
  gpsCoordinates: optionalText,
  bedrooms: z.coerce.number().int().nonnegative(),
  bathrooms: z.coerce.number().int().nonnegative(),
  rooms: z.coerce.number().int().min(1),
  plotSize: optionalText,
  floorSize: optionalText,
  constructionType: z.string().min(2),
  yearBuilt: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 2).optional().or(z.literal("").transform(() => undefined)),
  occupancyCapacity: z.coerce.number().int().min(1),
  utilitiesAvailable: z.string().optional(),
  monthlyRentValue: z.coerce.number().nonnegative(),
  estimatedMarketValue: z.coerce.number().nonnegative(),
  occupancyStatus: z.enum(occupancyStatuses),
  occupantName: optionalText,
  occupantPayrollNo: optionalText,
  rentDeduction: z.coerce.number().nonnegative(),
  remarks: optionalText,
});

export const allocationSchema = z.object({
  housingUnitId: z.string().min(1),
  employeeName: z.string().min(2),
  payrollNo: z.string().min(2),
  institution: z.string().min(2),
  allocationDate: z.string().min(1),
  expectedVacationDate: optionalDate,
  monthlyRentDeduction: z.coerce.number().nonnegative(),
  familySize: z.coerce.number().int().min(1),
  status: z.string().min(2),
});

export const housingMaintenanceSchema = z.object({
  housingUnitId: z.string().min(1),
  occupant: z.string().min(2),
  requestType: z.enum(maintenanceTypes),
  description: z.string().min(5),
  priority: z.string().min(2),
  technicianVendor: optionalText,
  estimatedCost: z.coerce.number().nonnegative(),
  actualCost: z.coerce.number().nonnegative(),
  status: z.string().min(2),
  completionDate: optionalDate,
});

export const constructionProjectSchema = z.object({
  projectName: z.string().min(3),
  projectType: z.string().min(2),
  institutionId: z.string().min(1),
  contractor: z.string().min(2),
  county: z.string().min(2),
  town: z.string().min(2),
  startDate: z.string().min(1),
  expectedCompletion: z.string().min(1),
  budgetApproved: z.coerce.number().nonnegative(),
  amountSpent: z.coerce.number().nonnegative(),
  completionPercentage: z.coerce.number().int().min(0).max(100),
  status: z.string().min(2),
  inspectionNotes: optionalText,
});

export type HousingPropertyInput = z.infer<typeof housingPropertySchema>;
export type HousingPropertyFormValues = z.input<typeof housingPropertySchema>;
export type AllocationInput = z.infer<typeof allocationSchema>;
export type HousingMaintenanceInput = z.infer<typeof housingMaintenanceSchema>;
export type ConstructionProjectInput = z.infer<typeof constructionProjectSchema>;
