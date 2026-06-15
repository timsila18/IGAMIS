import { FleetOperationalPanel } from "@/components/fleet-operational-panel";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listFleetVehicles } from "@/lib/fleet-repository";

export default async function ServiceRecordsPage() {
  const user = await requireUser();
  const vehicles = await listFleetVehicles(user);
  return (
    <PageFrame>
      <PageTitle eyebrow="Fleet management" title="Service records" description="Capture garage history, service costs, next service alerts, vendor history and invoice placeholders." />
      <FleetOperationalPanel mode="service" vehicles={vehicles} />
    </PageFrame>
  );
}
