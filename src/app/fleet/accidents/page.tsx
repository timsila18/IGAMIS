import { FleetOperationalPanel } from "@/components/fleet-operational-panel";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listFleetVehicles } from "@/lib/fleet-repository";

export default async function FleetAccidentsPage() {
  const user = await requireUser();
  const vehicles = await listFleetVehicles(user);
  return (
    <PageFrame>
      <PageTitle eyebrow="Fleet management" title="Accident logs" description="Capture accident details, police abstract references, insurance claims, repair estimates and closure status." />
      <FleetOperationalPanel mode="accident" vehicles={vehicles} />
    </PageFrame>
  );
}
