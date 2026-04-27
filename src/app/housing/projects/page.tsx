import { HousingOperationalPanel } from "@/components/housing-operational-panel";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listHousingProjects, listHousingProperties } from "@/lib/housing-repository";

export default async function HousingProjectsPage() {
  const user = await requireUser();
  const [properties, projects] = await Promise.all([listHousingProperties(user), listHousingProjects(user)]);
  return <PageFrame><PageTitle eyebrow="Housing & premises" title="Construction projects" description="Track affordable housing projects, offices, renovations and staff-quarter developments with spend and delay alerts." /><HousingOperationalPanel mode="projects" properties={properties} projects={projects} /></PageFrame>;
}
