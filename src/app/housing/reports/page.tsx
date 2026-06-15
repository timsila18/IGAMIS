import { HousingReports } from "@/components/housing-reports";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listHousingProjects, listHousingProperties } from "@/lib/housing-repository";

export default async function HousingReportsPage() {
  const user = await requireUser();
  const [properties, projects] = await Promise.all([listHousingProperties(user), listHousingProjects(user)]);
  return <PageFrame><PageTitle eyebrow="Housing & premises" title="Housing reports" description="Property register, occupancy, vacant units, maintenance costs, allocation history, construction progress and condition reports." /><HousingReports properties={properties} projects={projects} /></PageFrame>;
}
