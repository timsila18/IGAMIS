import Link from "next/link";
import { notFound } from "next/navigation";
import { Edit, FileText, History, ShieldCheck, Wrench } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatKes } from "@/data/demo";
import { requireUser } from "@/lib/auth";
import { getAssetById } from "@/lib/repository";

export default async function AssetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const result = await getAssetById(id, user);
  if (!result) notFound();

  const { asset, raw, qrSvg } = result;

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Asset profile"
        title={asset.name}
        description={`${asset.assetCode} - ${asset.institution} - ${asset.department}`}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Lifecycle and custody</CardTitle>
                <CardDescription>{asset.description}</CardDescription>
              </div>
              <Link href={`/assets/${id}/edit`}>
                <Button size="sm"><Edit className="h-4 w-4" /> Edit</Button>
              </Link>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Fact label="Condition" value={asset.condition} />
              <Fact label="Status" value={asset.status.replaceAll("_", " ")} />
              <Fact label="Assigned user" value={asset.assignedUser} />
              <Fact label="Location" value={asset.location} />
              <Fact label="Serial number" value={asset.serialNumber ?? "Not recorded"} />
              <Fact label="Asset tag" value={asset.assetTagNumber ?? "Not recorded"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Financial details</CardTitle>
              <CardDescription>Acquisition cost, current depreciated value and warranty dates.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <Fact label="Purchase cost" value={formatKes(asset.purchaseCost)} />
              <Fact label="Current value" value={formatKes(asset.currentValue ?? asset.purchaseCost)} />
              <Fact label="Acquired" value={asset.acquisitionDate} />
              <Fact label="Warranty" value={asset.warrantyExpiry} />
            </CardContent>
          </Card>
          <Timeline title="Movement history" icon={History} rows={raw?.movements?.map((item) => ({
            label: item.reason,
            detail: `${item.fromLocation?.name ?? "Origin"} to ${item.toLocation?.name ?? "Destination"}`,
            date: item.movedAt.toISOString().slice(0, 10),
          })) ?? []} empty="No movement history" />
          <Timeline title="Maintenance history" icon={Wrench} rows={raw?.maintenanceRequests?.map((item) => ({
            label: item.requestNo,
            detail: item.description,
            date: item.createdAt.toISOString().slice(0, 10),
          })) ?? []} empty="No maintenance history" />
          <Card>
            <CardHeader>
              <CardTitle>Audit log timeline</CardTitle>
              <CardDescription>Evidence-grade history of actions against this asset.</CardDescription>
            </CardHeader>
            <CardContent>
              {raw?.auditLogs?.length ? (
                <Table>
                  <THead><TR><TH>Action</TH><TH>Actor</TH><TH>Module</TH><TH>Time</TH></TR></THead>
                  <TBody>
                    {raw.auditLogs.map((log) => (
                      <TR key={log.id}>
                        <TD><Badge tone="neutral">{log.action}</Badge></TD>
                        <TD>{log.actor?.fullName ?? "System"}</TD>
                        <TD>{log.module}</TD>
                        <TD>{log.createdAt.toISOString().slice(0, 16).replace("T", " ")}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              ) : <EmptyState title="No audit events" description="Audit events will appear as users view, edit, export or archive this asset." />}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>QR verification</CardTitle>
              <CardDescription>Scannable QR includes asset code, ID, institution, category and verification URL.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Supabase Storage document placeholders.</CardDescription>
            </CardHeader>
            <CardContent>
              {raw?.documents?.length ? raw.documents.map((document) => (
                <div key={document.id} className="flex items-center gap-2 rounded-md border border-neutral-200 p-2 text-sm dark:border-neutral-800">
                  <FileText className="h-4 w-4" />
                  {document.name}
                </div>
              )) : <EmptyState title="No documents" description="Upload procurement, warranty, inspection and disposal documents from the asset form." />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Asset photo storage placeholders.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState title="No photos" description="Photos uploaded to Supabase Storage will appear here." />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
      <div className="text-xs font-semibold uppercase text-neutral-500">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function Timeline({
  title,
  icon: Icon,
  rows,
  empty,
}: {
  title: string;
  icon: typeof ShieldCheck;
  rows: { label: string; detail: string; date: string }[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length ? rows.map((row) => (
          <div key={`${row.label}-${row.date}`} className="flex gap-3 border-l-2 border-[#c8a640] pl-3">
            <Icon className="mt-1 h-4 w-4 text-emerald-800" />
            <div>
              <div className="font-semibold">{row.label}</div>
              <div className="text-sm text-neutral-500">{row.detail}</div>
              <div className="text-xs text-neutral-400">{row.date}</div>
            </div>
          </div>
        )) : <EmptyState title={empty} description="This section will populate as workflow activity is recorded." />}
      </CardContent>
    </Card>
  );
}
