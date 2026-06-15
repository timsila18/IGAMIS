import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { listAssets } from "@/lib/repository";

export default async function MyAssetsPage() {
  const user = await requireUser();
  const assets = await listAssets(user);

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Employee assets"
        title="My assigned assets"
        description="Assets currently issued to you with condition, location and issue reporting actions."
      />
      <Card>
        <CardContent className="p-5">
          {assets.length ? (
            <div className="overflow-x-auto">
              <Table>
                <THead><TR><TH>Asset code</TH><TH>Name</TH><TH>Category</TH><TH>Condition</TH><TH>Location</TH><TH>Assignment date</TH><TH>Action</TH></TR></THead>
                <TBody>
                  {assets.map((asset) => (
                    <TR key={asset.id}>
                      <TD><Link href={`/assets/${asset.id}`} className="font-semibold text-emerald-800">{asset.assetCode}</Link></TD>
                      <TD>{asset.name}</TD>
                      <TD>{asset.category}</TD>
                      <TD><Badge tone={asset.condition === "GOOD" || asset.condition === "NEW" ? "green" : "gold"}>{asset.condition}</Badge></TD>
                      <TD>{asset.location}</TD>
                      <TD>{asset.acquisitionDate}</TD>
                      <TD><Button size="sm" variant="secondary"><AlertCircle className="h-4 w-4" /> Report issue</Button></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : <EmptyState title="No assigned assets" description="Assets issued to you will appear here once your department asset officer assigns them." />}
        </CardContent>
      </Card>
    </PageFrame>
  );
}
