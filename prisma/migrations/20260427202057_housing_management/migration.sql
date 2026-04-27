-- AlterTable
ALTER TABLE "housing_units" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "bathrooms" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bedrooms" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "constructionType" TEXT NOT NULL DEFAULT 'Permanent Structure',
ADD COLUMN     "county" TEXT NOT NULL DEFAULT 'Nairobi',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "estimatedMarketValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "floorSize" TEXT,
ADD COLUMN     "gpsCoordinates" TEXT,
ADD COLUMN     "monthlyRentValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "occupancyCapacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "occupantPayrollNo" TEXT,
ADD COLUMN     "physicalAddress" TEXT,
ADD COLUMN     "plotSize" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "rooms" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "subCounty" TEXT,
ADD COLUMN     "town" TEXT NOT NULL DEFAULT 'Nairobi',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "utilitiesAvailable" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "ward" TEXT,
ADD COLUMN     "yearBuilt" INTEGER;

-- AlterTable
ALTER TABLE "premises" ADD COLUMN     "accessibilityCompliance" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
ADD COLUMN     "annualMaintenanceBudget" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "buildingUsage" TEXT,
ADD COLUMN     "county" TEXT NOT NULL DEFAULT 'Nairobi',
ADD COLUMN     "dailyOccupancyEstimate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fireCompliance" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
ADD COLUMN     "leaseOwnedStatus" TEXT NOT NULL DEFAULT 'OWNED',
ADD COLUMN     "numberOfOffices" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parkingSpaces" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "securityLevel" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "town" TEXT NOT NULL DEFAULT 'Nairobi';

-- CreateTable
CREATE TABLE "housing_allocations" (
    "id" TEXT NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "employeeId" TEXT,
    "employeeName" TEXT NOT NULL,
    "payrollNo" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "allocationDate" TIMESTAMP(3) NOT NULL,
    "expectedVacationDate" TIMESTAMP(3),
    "monthlyRentDeduction" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "familySize" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedAt" TIMESTAMP(3),
    "vacatedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "housing_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "housing_maintenance_requests" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "occupant" TEXT NOT NULL,
    "requesterId" TEXT,
    "requestType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "dateSubmitted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedToId" TEXT,
    "technicianVendor" TEXT,
    "estimatedCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "actualCost" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "completionDate" TIMESTAMP(3),
    "beforePhotoPaths" TEXT[],
    "afterPhotoPaths" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "housing_maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_inspections" (
    "id" TEXT NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "conditionRating" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "nextInspectionDate" TIMESTAMP(3),
    "documentPaths" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_projects" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "contractor" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedCompletion" TIMESTAMP(3) NOT NULL,
    "budgetApproved" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "amountSpent" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "completionPercentage" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sitePhotoPaths" TEXT[],
    "inspectionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "construction_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_documents" (
    "id" TEXT NOT NULL,
    "housingUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "housing_allocations_housingUnitId_allocationDate_idx" ON "housing_allocations"("housingUnitId", "allocationDate");

-- CreateIndex
CREATE UNIQUE INDEX "housing_maintenance_requests_requestNo_key" ON "housing_maintenance_requests"("requestNo");

-- CreateIndex
CREATE INDEX "housing_maintenance_requests_housingUnitId_dateSubmitted_idx" ON "housing_maintenance_requests"("housingUnitId", "dateSubmitted");

-- CreateIndex
CREATE INDEX "property_inspections_housingUnitId_inspectionDate_idx" ON "property_inspections"("housingUnitId", "inspectionDate");

-- CreateIndex
CREATE UNIQUE INDEX "construction_projects_projectCode_key" ON "construction_projects"("projectCode");

-- AddForeignKey
ALTER TABLE "housing_allocations" ADD CONSTRAINT "housing_allocations_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "housing_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing_allocations" ADD CONSTRAINT "housing_allocations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing_allocations" ADD CONSTRAINT "housing_allocations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing_maintenance_requests" ADD CONSTRAINT "housing_maintenance_requests_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "housing_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing_maintenance_requests" ADD CONSTRAINT "housing_maintenance_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "housing_maintenance_requests" ADD CONSTRAINT "housing_maintenance_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_inspections" ADD CONSTRAINT "property_inspections_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "housing_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_projects" ADD CONSTRAINT "construction_projects_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_housingUnitId_fkey" FOREIGN KEY ("housingUnitId") REFERENCES "housing_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
