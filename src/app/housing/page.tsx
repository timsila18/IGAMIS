import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { formatKes } from "@/data/demo";
import { housingUnits } from "@/lib/repository";

export default function HousingPage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Housing and premises"
        title="Staff houses, offices, warehouses and affordable housing"
        description="Occupancy, allocation workflows, rent deduction, utility condition, maintenance requests, construction progress and GIS-ready location data."
      />
      <ModuleBoard
        title="Premises portfolio"
        description="Housing and premises operational control."
        stats={[
          { label: "Units", value: housingUnits.length },
          { label: "Occupied", value: housingUnits.filter((unit) => unit.status === "Occupied").length },
          { label: "Vacant", value: housingUnits.filter((unit) => unit.status === "Vacant").length, tone: "gold" },
          { label: "Avg progress", value: `${Math.round(housingUnits.reduce((sum, unit) => sum + unit.progress, 0) / housingUnits.length)}%` },
        ]}
        rows={housingUnits.map((unit) => ({
          Unit: unit.unitCode,
          Institution: unit.institution,
          Type: unit.type,
          Status: unit.status,
          Rent: formatKes(unit.rent),
          Condition: unit.condition,
          Progress: `${unit.progress}%`,
        }))}
      />
    </PageFrame>
  );
}
