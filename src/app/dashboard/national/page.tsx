import { AlertTriangle, Banknote, Boxes, ClipboardCheck, Gavel, Wrench } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard-charts";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKes } from "@/data/demo";
import { requireUser } from "@/lib/auth";
import { getNationalMetrics } from "@/lib/repository";

const metricIcons = [Boxes, Banknote, Wrench, Gavel, AlertTriangle, ClipboardCheck];

export default async function NationalDashboardPage() {
  const user = await requireUser();
  const metrics = await getNationalMetrics(user);
  const cards = [
    { label: "Total government assets", value: metrics.totalAssets.toLocaleString("en-KE"), detail: "Registered national records" },
    { label: "Estimated asset value", value: metrics.totalValueLabel, detail: "Historic acquisition value" },
    { label: "Due maintenance", value: metrics.dueMaintenance, detail: "Assets under repair" },
    { label: "Due disposal", value: metrics.dueDisposal, detail: "Disposal candidates" },
    { label: "Missing/unverified", value: metrics.missing, detail: "Verification exceptions" },
    { label: "Pending approvals", value: metrics.pendingApprovals, detail: "Workflow queue" },
  ];

  return (
    <PageFrame>
      <PageTitle
        eyebrow="National Treasury dashboard"
        title="National asset command center"
        description="Treasury-grade overview of public assets, values, maintenance exposure, disposal readiness, missing assets and audit activity."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map((card, index) => {
          const Icon = metricIcons[index];
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-950 text-[#d9bd59]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge tone={index >= 2 ? "gold" : "green"}>Live</Badge>
                </div>
                <div className="mt-5 text-2xl font-black tracking-normal">{card.value}</div>
                <div className="mt-1 text-sm font-semibold">{card.label}</div>
                <div className="text-xs text-neutral-500">{card.detail}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-5">
        <DashboardCharts
          byMinistry={metrics.byMinistry}
          byCategory={metrics.byCategory}
          maintenanceTrend={metrics.maintenanceTrend}
          disposalSummary={metrics.disposalSummary}
        />
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>High-risk asset watchlist</CardTitle>
            <CardDescription>Priority assets with disposal, maintenance, verification or valuation concern.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.highRiskAssets.length ? metrics.highRiskAssets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                <div>
                  <div className="font-semibold">{asset.assetCode}</div>
                  <div className="text-sm text-neutral-500">{asset.name}</div>
                </div>
                <div className="text-right">
                  <Badge tone="red">{asset.riskScore}% risk</Badge>
                  <div className="mt-1 text-xs text-neutral-500">{formatKes(asset.purchaseCost)}</div>
                </div>
              </div>
            )) : <div className="text-sm text-neutral-500">No high-risk assets in the current scope.</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent audit activities</CardTitle>
            <CardDescription>Audit-grade activity feed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.recentActivities.map((activity) => (
              <div key={activity} className="border-l-2 border-[#c8a640] pl-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {activity}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageFrame>
  );
}
