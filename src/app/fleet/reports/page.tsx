import { FleetReports } from "@/components/fleet-reports";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listFleetVehicles } from "@/lib/fleet-repository";

export default async function FleetReportsPage() {
  const user = await requireUser();
  const vehicles = await listFleetVehicles(user);
  return (
    <PageFrame>
      <PageTitle
        eyebrow="Fleet management"
        title="Fleet reports"
        description="Fleet register, fuel consumption, service cost, insurance expiry, accident and disposal recommendation reports."
      />
      <FleetReports vehicles={vehicles} />
    </PageFrame>
  );
}
