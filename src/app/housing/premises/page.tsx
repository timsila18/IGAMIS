import { HousingRegistry } from "@/components/housing-registry";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listHousingProperties } from "@/lib/housing-repository";

export default async function PremisesPage() {
  const user = await requireUser();
  const properties = (await listHousingProperties(user)).filter((item) => ["Government Office", "Warehouse", "Training Centre", "Camp"].includes(item.unitType));
  return <PageFrame><PageTitle eyebrow="Housing & premises" title="Government premises" description="Offices, warehouses, compounds, camps and operational premises with compliance and occupancy signals." /><HousingRegistry properties={properties} user={user} /></PageFrame>;
}
