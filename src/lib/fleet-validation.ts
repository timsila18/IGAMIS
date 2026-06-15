import { z } from "zod";
import { conditionValues, depreciationValues, statusValues } from "@/lib/asset-validation";

const optionalDate = z.string().optional().transform((value) => value || undefined);
const optionalText = z.string().optional().transform((value) => value?.trim() || undefined);

export const fuelTypes = ["Diesel", "Petrol", "Hybrid", "Electric", "LPG"] as const;

export const fleetVehicleSchema = z.object({
  name: z.string().min(3, "Vehicle asset name is required."),
  description: z.string().min(10, "Describe the vehicle purpose and profile."),
  institutionId: z.string().min(1, "Institution is required."),
  departmentId: z.string().optional(),
  locationId: z.string().optional(),
  location: z.string().min(2, "Location is required."),
  acquisitionDate: z.string().min(1, "Acquisition date is required."),
  purchaseCost: z.coerce.number().nonnegative(),
  supplier: optionalText,
  usefulLifeYears: z.coerce.number().int().min(1).max(40),
  depreciationMethod: z.enum(depreciationValues),
  condition: z.enum(conditionValues),
  status: z.enum(statusValues),
  assignedUserId: z.string().optional(),
  registrationNumber: z.string().min(3, "Registration number is required.").transform((value) => value.trim().toUpperCase()),
  ntsaRegistrationStatus: z.string().min(2),
  make: z.string().min(2, "Make is required."),
  model: z.string().min(1, "Model is required."),
  bodyType: z.string().min(2, "Body type is required."),
  yearOfManufacture: z.coerce.number().int().min(1970).max(new Date().getFullYear() + 1),
  engineNumber: z.string().min(3, "Engine number is required."),
  chassisNumber: z.string().min(3, "Chassis number is required."),
  fuelType: z.enum(fuelTypes),
  tankCapacityLitres: z.coerce.number().positive(),
  mileageKm: z.coerce.number().int().nonnegative(),
  driverAssigned: optionalText,
  driverPayrollNo: optionalText,
  insuranceProvider: optionalText,
  insurancePolicyNumber: optionalText,
  insuranceStartDate: optionalDate,
  insuranceExpiry: z.string().min(1, "Insurance expiry is required."),
  lastServiceDate: optionalDate,
  nextServiceDate: optionalDate,
  nextServiceMileage: z.coerce.number().int().nonnegative().optional().or(z.literal("").transform(() => undefined)),
  gpsTrackerId: optionalText,
  fuelCardNumber: optionalText,
  remarks: optionalText,
});

export type FleetVehicleInput = z.infer<typeof fleetVehicleSchema>;
export type FleetVehicleFormValues = z.input<typeof fleetVehicleSchema>;

export const fuelLogSchema = z.object({
  fleetAssetId: z.string().min(1),
  date: z.string().min(1),
  odometerReadingKm: z.coerce.number().int().nonnegative(),
  litres: z.coerce.number().positive(),
  costPerLitre: z.coerce.number().positive(),
  fuelStation: z.string().min(2),
  fuelCardReference: optionalText,
  remarks: optionalText,
});

export const serviceRecordSchema = z.object({
  fleetAssetId: z.string().min(1),
  serviceDate: z.string().min(1),
  serviceType: z.string().min(2),
  vendor: z.string().min(2),
  odometerReadingKm: z.coerce.number().int().nonnegative(),
  workDone: z.string().min(5),
  partsReplaced: optionalText,
  labourCost: z.coerce.number().nonnegative(),
  partsCost: z.coerce.number().nonnegative(),
  nextServiceDate: optionalDate,
  nextServiceMileage: z.coerce.number().int().nonnegative().optional().or(z.literal("").transform(() => undefined)),
  remarks: optionalText,
});

export const insuranceRecordSchema = z.object({
  fleetAssetId: z.string().min(1),
  provider: z.string().min(2),
  policyNumber: z.string().min(2),
  coverType: z.string().min(2),
  startDate: z.string().min(1),
  expiryDate: z.string().min(1),
  premiumAmount: z.coerce.number().nonnegative(),
  renewalStatus: z.string().min(2),
});

export const accidentLogSchema = z.object({
  fleetAssetId: z.string().min(1),
  accidentDate: z.string().min(1),
  location: z.string().min(2),
  driver: z.string().min(2),
  description: z.string().min(5),
  policeAbstractNumber: optionalText,
  insuranceClaimNumber: optionalText,
  repairEstimate: z.coerce.number().nonnegative(),
  actualRepairCost: z.coerce.number().nonnegative(),
  status: z.string().min(2),
});

export type FuelLogInput = z.infer<typeof fuelLogSchema>;
export type ServiceRecordInput = z.infer<typeof serviceRecordSchema>;
export type InsuranceRecordInput = z.infer<typeof insuranceRecordSchema>;
export type AccidentLogInput = z.infer<typeof accidentLogSchema>;
