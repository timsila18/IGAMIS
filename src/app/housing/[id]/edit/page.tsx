import { notFound } from "next/navigation";
import { HousingPropertyForm } from "@/components/housing-property-form";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { getHousingFormValues, getHousingLookups } from "@/lib/housing-repository";

export default async function EditHousingPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [lookups, initialValues] = await Promise.all([getHousingLookups(user), getHousingFormValues(id, user)]);
  if (!initialValues) notFound();
  return <PageFrame><PageTitle eyebrow="Housing & premises" title="Edit property" description="Update property identity, location, occupancy, lifecycle, value and utility details with audit logging." /><HousingPropertyForm mode="edit" propertyId={id} lookups={lookups} initialValues={initialValues} /></PageFrame>;
}
