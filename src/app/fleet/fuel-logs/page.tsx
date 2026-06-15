import { FleetOperationalPanel } from "@/components/fleet-operational-panel";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listFleetVehicles } from "@/lib/fleet-repository";

export default async function FuelLogsPage() {
  const user = await requireUser();
  const vehicles = await listFleetVehicles(user);
  return (
    <PageFrame>
      <PageTitle eyebrow="Fleet management" title="Fuel logs" description="Capture fuel usage, calculate consumption, flag abnormal usage and maintain monthly fuel cost trends." />
      <FleetOperationalPanel mode="fuel" vehicles={vehicles} />
    </PageFrame>
  );
}
