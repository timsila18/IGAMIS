import { notFound } from "next/navigation";
import { FleetVehicleForm } from "@/components/fleet-vehicle-form";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { getFleetFormValues, getFleetLookups } from "@/lib/fleet-repository";

export default async function EditFleetVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [lookups, initialValues] = await Promise.all([getFleetLookups(user), getFleetFormValues(id, user)]);
  if (!initialValues) notFound();

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Fleet management"
        title="Edit vehicle"
        description="Update vehicle identity, registry, insurance, service, assignment and GPS placeholder fields with audit logging."
      />
      <FleetVehicleForm mode="edit" fleetId={id} lookups={lookups} initialValues={initialValues} />
    </PageFrame>
  );
}
