import { FleetOperationalPanel } from "@/components/fleet-operational-panel";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listFleetVehicles } from "@/lib/fleet-repository";

export default async function FleetInsurancePage() {
  const user = await requireUser();
  const vehicles = await listFleetVehicles(user);
  return (
    <PageFrame>
      <PageTitle eyebrow="Fleet management" title="Insurance tracking" description="Track providers, policy numbers, cover types, premiums, renewal status and expiry alerts." />
      <FleetOperationalPanel mode="insurance" vehicles={vehicles} />
    </PageFrame>
  );
}
