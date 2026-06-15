import { Building2, ClipboardCheck, Home, Hotel, MapPin, Wrench } from "lucide-react";
import { HousingCharts } from "@/components/housing-charts";
import { HousingRegistry } from "@/components/housing-registry";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getHousingDashboard } from "@/lib/housing-repository";

const icons = [Home, Hotel, MapPin, Wrench, Building2, Building2, ClipboardCheck, Building2, ClipboardCheck, Wrench];

export default async function HousingPage() {
  const user = await requireUser();
  const dashboard = await getHousingDashboard(user);
  const cards = [
    ["Total units", dashboard.total, "All properties"],
    ["Occupied", dashboard.occupied, "Allocated units"],
    ["Vacant", dashboard.vacant, "Available stock"],
    ["Maintenance", dashboard.underMaintenance, "Under repair"],
    ["Staff quarters", dashboard.staffQuarters, "Staff housing"],
    ["Affordable units", dashboard.affordable, "Affordable housing"],
    ["Government offices", dashboard.offices, "Office premises"],
    ["Active projects", dashboard.activeProjects, "Construction portfolio"],
    ["Pending allocations", dashboard.pendingAllocations, "Approval queue"],
    ["Pending maintenance", dashboard.pendingMaintenance, "Open requests"],
  ];
  return (
    <PageFrame>
      <PageTitle eyebrow="Housing & premises" title="Government property command center" description="Manage staff quarters, affordable housing units, offices, warehouses, camps, construction projects, allocations and maintenance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, detail], index) => {
          const Icon = icons[index];
          return <Card key={label}><CardContent className="p-4"><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-950 text-[#d9bd59]"><Icon className="h-5 w-5" /></div><Badge tone={index >= 7 ? "gold" : "green"}>Live</Badge></div><div className="mt-5 text-2xl font-black">{value}</div><div className="mt-1 text-sm font-semibold">{label}</div><div className="text-xs text-neutral-500">{detail}</div></CardContent></Card>;
        })}
      </div>
      <div className="mt-5"><HousingCharts occupancyByInstitution={dashboard.occupancyByInstitution} typeDistribution={dashboard.typeDistribution} maintenanceTrend={dashboard.maintenanceTrend} constructionSummary={dashboard.constructionSummary} occupancySummary={dashboard.occupancySummary} /></div>
      <div className="mt-5"><HousingRegistry properties={dashboard.properties} user={user} /></div>
    </PageFrame>
  );
}
