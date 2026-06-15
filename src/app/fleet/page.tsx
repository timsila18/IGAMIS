import { AlertTriangle, Car, Fuel, Gauge, ShieldCheck, Wrench } from "lucide-react";
import { FleetCharts } from "@/components/fleet-charts";
import { FleetRegistry } from "@/components/fleet-registry";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getFleetDashboard } from "@/lib/fleet-repository";

const icons = [Car, ShieldCheck, Wrench, AlertTriangle, Fuel, Gauge, Car, Wrench];

export default async function FleetPage() {
  const user = await requireUser();
  const dashboard = await getFleetDashboard(user);
  const cards = [
    ["Total vehicles", dashboard.totalVehicles, "Vehicles in authorized scope"],
    ["Active vehicles", dashboard.active, "Available for operations"],
    ["Under repair", dashboard.underRepair, "Maintenance exposure"],
    ["Due service", dashboard.dueService, "Due soon or overdue"],
    ["Insurance renewal", dashboard.dueInsurance, "Expiring within 45 days"],
    ["Avg monthly fuel", dashboard.avgMonthlyFuelCostLabel, "Recorded fuel spend"],
    ["Avg mileage", `${dashboard.avgMileage.toLocaleString("en-KE")} km`, "Per registered vehicle"],
    ["Disposal watch", dashboard.recommendedDisposal, "Recommended disposal"],
  ];

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Fleet management"
        title="Government vehicle operations"
        description="Vehicle registry, fuel monitoring, service schedules, insurance compliance, accidents, disposal readiness, NTSA placeholders and GPS readiness."
      />
      <div className="mb-5 rounded-lg border border-[#c8a640]/30 bg-[#c8a640]/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold">Fleet compliance command strip</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              {dashboard.highFuelAlerts} high fuel consumption alerts, {dashboard.dueInsurance} insurance renewals, {dashboard.dueService} service alerts.
            </div>
          </div>
          <Badge tone={dashboard.highFuelAlerts ? "red" : "green"}>{dashboard.highFuelAlerts ? "Action required" : "Stable"}</Badge>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, detail], index) => {
          const Icon = icons[index];
          return (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-950 text-[#d9bd59]"><Icon className="h-5 w-5" /></div>
                  <Badge tone={index >= 2 && index <= 4 ? "gold" : "green"}>Live</Badge>
                </div>
                <div className="mt-5 text-2xl font-black tracking-normal">{value}</div>
                <div className="mt-1 text-sm font-semibold">{label}</div>
                <div className="text-xs text-neutral-500">{detail}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-5">
        <FleetCharts
          byInstitution={dashboard.byInstitution}
          fuelTrend={dashboard.fuelTrend}
          mileageTrend={dashboard.mileageTrend}
          serviceCostByVehicle={dashboard.serviceCostByVehicle}
          conditionSummary={dashboard.conditionSummary}
        />
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent vehicle movements</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recentMovements.length ? dashboard.recentMovements.map((item) => (
              <div key={`${item.vehicle}-${item.date}-${item.reason}`} className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <div className="font-semibold">{item.vehicle} - {item.reason}</div>
                <div className="text-neutral-500">{item.from} to {item.to} on {item.date}</div>
              </div>
            )) : <div className="text-sm text-neutral-500">No movement history captured yet.</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent service records</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recentServices.length ? dashboard.recentServices.map((item) => (
              <div key={item.id} className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <div className="font-semibold">{item.registrationNumber} - {item.serviceType}</div>
                <div className="text-neutral-500">{item.vendor} on {item.serviceDate}</div>
              </div>
            )) : <div className="text-sm text-neutral-500">No service records captured yet.</div>}
          </CardContent>
        </Card>
      </div>
      <div className="mt-5">
        <FleetRegistry vehicles={dashboard.vehicles} user={user} />
      </div>
    </PageFrame>
  );
}
