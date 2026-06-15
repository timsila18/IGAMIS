-- AlterTable
ALTER TABLE "fleet_assets" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "bodyType" TEXT NOT NULL DEFAULT 'SUV',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "driverPayrollNo" TEXT,
ADD COLUMN     "fuelCardNumber" TEXT,
ADD COLUMN     "gpsLastKnownLocation" TEXT,
ADD COLUMN     "gpsLastSyncAt" TIMESTAMP(3),
ADD COLUMN     "gpsMileageSyncStatus" TEXT,
ADD COLUMN     "gpsTrackerId" TEXT,
ADD COLUMN     "insurancePolicyNumber" TEXT,
ADD COLUMN     "insuranceProvider" TEXT,
ADD COLUMN     "insuranceStartDate" TIMESTAMP(3),
ADD COLUMN     "make" TEXT NOT NULL DEFAULT 'Toyota',
ADD COLUMN     "model" TEXT NOT NULL DEFAULT 'Land Cruiser',
ADD COLUMN     "nextServiceMileage" INTEGER,
ADD COLUMN     "ntsaRegistrationStatus" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "tankCapacityLitres" DECIMAL(10,2) NOT NULL DEFAULT 80,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "yearOfManufacture" INTEGER NOT NULL DEFAULT 2024;

-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" TEXT NOT NULL,
    "fleetAssetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "odometerReadingKm" INTEGER NOT NULL,
    "litres" DECIMAL(12,2) NOT NULL,
    "costPerLitre" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(18,2) NOT NULL,
    "fuelStation" TEXT NOT NULL,
    "fuelCardReference" TEXT,
    "recordedById" TEXT,
    "consumptionRate" DECIMAL(12,2),
    "abnormalFlag" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL,
    "fleetAssetId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "serviceType" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "odometerReadingKm" INTEGER NOT NULL,
    "workDone" TEXT NOT NULL,
    "partsReplaced" TEXT,
    "labourCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "partsCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "nextServiceDate" TIMESTAMP(3),
    "nextServiceMileage" INTEGER,
    "invoiceDocumentPath" TEXT,
    "recordedById" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_records" (
    "id" TEXT NOT NULL,
    "fleetAssetId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "coverType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "premiumAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "policyDocumentPath" TEXT,
    "renewalStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accident_logs" (
    "id" TEXT NOT NULL,
    "fleetAssetId" TEXT NOT NULL,
    "accidentDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "policeAbstractNumber" TEXT,
    "insuranceClaimNumber" TEXT,
    "repairEstimate" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "actualRepairCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "photoPaths" TEXT[],
    "documentPaths" TEXT[],
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accident_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_assignments" (
    "id" TEXT NOT NULL,
    "fleetAssetId" TEXT NOT NULL,
    "driverId" TEXT,
    "driverName" TEXT NOT NULL,
    "payrollNo" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_documents" (
    "id" TEXT NOT NULL,
    "fleetAssetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fuel_logs_fleetAssetId_date_idx" ON "fuel_logs"("fleetAssetId", "date");

-- CreateIndex
CREATE INDEX "service_records_fleetAssetId_serviceDate_idx" ON "service_records"("fleetAssetId", "serviceDate");

-- CreateIndex
CREATE INDEX "insurance_records_fleetAssetId_expiryDate_idx" ON "insurance_records"("fleetAssetId", "expiryDate");

-- CreateIndex
CREATE INDEX "accident_logs_fleetAssetId_accidentDate_idx" ON "accident_logs"("fleetAssetId", "accidentDate");

-- CreateIndex
CREATE INDEX "vehicle_assignments_fleetAssetId_assignedAt_idx" ON "vehicle_assignments"("fleetAssetId", "assignedAt");

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_fleetAssetId_fkey" FOREIGN KEY ("fleetAssetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_fleetAssetId_fkey" FOREIGN KEY ("fleetAssetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_records" ADD CONSTRAINT "insurance_records_fleetAssetId_fkey" FOREIGN KEY ("fleetAssetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_records" ADD CONSTRAINT "insurance_records_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_logs" ADD CONSTRAINT "accident_logs_fleetAssetId_fkey" FOREIGN KEY ("fleetAssetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_logs" ADD CONSTRAINT "accident_logs_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_fleetAssetId_fkey" FOREIGN KEY ("fleetAssetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_assignments" ADD CONSTRAINT "vehicle_assignments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_documents" ADD CONSTRAINT "vehicle_documents_fleetAssetId_fkey" FOREIGN KEY ("fleetAssetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
