import { FleetVehicleForm } from "@/components/fleet-vehicle-form";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { getFleetLookups } from "@/lib/fleet-repository";

export default async function NewFleetVehiclePage() {
  const user = await requireUser();
  const lookups = await getFleetLookups(user);

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Fleet management"
        title="Register new vehicle"
        description="Create a vehicle as both an Asset Master Registry record and a fleet-specific operational profile."
      />
      <FleetVehicleForm mode="create" lookups={lookups} />
    </PageFrame>
  );
}
