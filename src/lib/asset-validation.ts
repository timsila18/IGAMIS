import { z } from "zod";

export const conditionValues = ["NEW", "GOOD", "FAIR", "POOR", "UNSERVICEABLE"] as const;
export const statusValues = ["ACTIVE", "IDLE", "UNDER_MAINTENANCE", "TRANSFER_PENDING", "DUE_DISPOSAL", "DISPOSED", "MISSING"] as const;
export const depreciationValues = ["STRAIGHT_LINE", "REDUCING_BALANCE", "UNITS_OF_PRODUCTION", "NONE"] as const;

export const assetInputSchema = z.object({
  name: z.string().min(2, "Asset name is required."),
  description: z.string().min(5, "Description is required."),
  categoryId: z.string().min(1, "Select a category."),
  institutionId: z.string().min(1, "Select an institution."),
  departmentId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  location: z.string().min(2, "Location is required."),
  acquisitionDate: z.string().min(1, "Acquisition date is required."),
  purchaseCost: z.coerce.number().min(0),
  supplier: z.string().optional().nullable(),
  usefulLifeYears: z.coerce.number().int().min(1).max(100),
  depreciationMethod: z.enum(depreciationValues),
  condition: z.enum(conditionValues),
  status: z.enum(statusValues),
  assignedUserId: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  assetTagNumber: z.string().optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
});

export type AssetInput = z.infer<typeof assetInputSchema>;
