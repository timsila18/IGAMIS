import { Archive, Boxes, CheckCircle2, PackageCheck, UserCheck, Wrench } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { getInstitutionDashboard } from "@/lib/repository";

const icons = [Boxes, UserCheck, Archive, CheckCircle2, Wrench, PackageCheck];

export default async function InstitutionDashboardPage() {
  const user = await requireUser();
  const metrics = await getInstitutionDashboard(user);
  const cards = [
    ["Total institution assets", metrics.total],
    ["Assigned assets", metrics.assigned],
    ["Unassigned assets", metrics.unassigned],
    ["Good condition", metrics.good],
    ["Under repair", metrics.underRepair],
    ["Due replacement", metrics.dueReplacement],
  ] as const;

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Institution dashboard"
        title={`${user.institution} asset operations`}
        description="Institution-level view of assets, assignments, repairs, replacement exposure, maintenance requests and movement activity."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map(([label, value], index) => {
          const Icon = icons[index];
          return (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-950 text-[#d9bd59]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-5 text-3xl font-black tracking-normal">{value}</div>
                <div className="mt-1 text-sm font-semibold">{label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Recent movements</CardTitle>
          <CardDescription>Latest assignment and location signals in your institution scope.</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentMovements.length ? (
            <Table>
              <THead><TR><TH>Asset</TH><TH>Name</TH><TH>Movement</TH><TH>Date</TH></TR></THead>
              <TBody>
                {metrics.recentMovements.map((movement) => (
                  <TR key={movement.assetCode}>
                    <TD className="font-semibold">{movement.assetCode}</TD>
                    <TD>{movement.assetName}</TD>
                    <TD>{movement.movement}</TD>
                    <TD>{movement.date}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : <EmptyState title="No recent movements" description="Movement history will appear as assets transfer between users, offices and departments." />}
        </CardContent>
      </Card>
    </PageFrame>
  );
}
