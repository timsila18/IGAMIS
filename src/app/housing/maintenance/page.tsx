import { HousingOperationalPanel } from "@/components/housing-operational-panel";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listHousingProperties } from "@/lib/housing-repository";

export default async function HousingMaintenancePage() {
  const user = await requireUser();
  const properties = await listHousingProperties(user);
  return <PageFrame><PageTitle eyebrow="Housing & premises" title="Housing maintenance" description="Submit and track plumbing, electrical, roofing, structural, security, cleaning and cabling requests." /><HousingOperationalPanel mode="maintenance" properties={properties} /></PageFrame>;
}
