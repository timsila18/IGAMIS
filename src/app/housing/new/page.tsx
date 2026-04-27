import { HousingPropertyForm } from "@/components/housing-property-form";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { getHousingLookups } from "@/lib/housing-repository";

export default async function NewHousingPropertyPage() {
  const user = await requireUser();
  const lookups = await getHousingLookups(user);
  return <PageFrame><PageTitle eyebrow="Housing & premises" title="Register property" description="Create a persistent asset record and housing/premises profile with location, occupancy, utilities and value details." /><HousingPropertyForm mode="create" lookups={lookups} /></PageFrame>;
}
