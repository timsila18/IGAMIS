import { ModuleBoard } from "@/components/module-board";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { fleet } from "@/lib/repository";

export default function FleetPage() {
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Fleet management"
        title="Government vehicle operations"
        description="Vehicle records, fuel anomaly detection, insurance, service dates, accident history, GPS placeholders, tyres, batteries and disposal alerts."
      />
      <ModuleBoard
        title="Fleet register"
        description="Operational vehicle records with cost and compliance signals."
        stats={[
          { label: "Vehicles", value: fleet.length },
          { label: "Fuel anomalies", value: fleet.filter((item) => item.anomaly !== "None").length, tone: "gold" },
          { label: "Due service", value: 1, tone: "red" },
          { label: "GPS ready", value: "100%" },
        ]}
        rows={fleet.map((item) => ({
          Registration: item.registrationNumber,
          Institution: item.institution,
          Mileage: `${item.mileageKm.toLocaleString("en-KE")} km`,
          Fuel: item.fuelType,
          Anomaly: item.anomaly,
          "Next service": item.nextService,
        }))}
      />
    </PageFrame>
  );
}
