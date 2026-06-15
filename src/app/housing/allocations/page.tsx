import { HousingOperationalPanel } from "@/components/housing-operational-panel";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listHousingProperties } from "@/lib/housing-repository";

export default async function HousingAllocationsPage() {
  const user = await requireUser();
  const properties = await listHousingProperties(user);
  return <PageFrame><PageTitle eyebrow="Housing & premises" title="Allocation management" description="Allocate, transfer, vacate and audit staff quarter occupancy with approval-ready records." /><HousingOperationalPanel mode="allocations" properties={properties} /></PageFrame>;
}
