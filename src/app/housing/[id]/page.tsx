import Link from "next/link";
import { notFound } from "next/navigation";
import { Home, MapPin, User, Wrench } from "lucide-react";
import { HousingOperationalPanel } from "@/components/housing-operational-panel";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatKes } from "@/data/demo";
import { requireUser } from "@/lib/auth";
import { getHousingProperty } from "@/lib/housing-repository";

export default async function HousingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const result = await getHousingProperty(id, user);
  if (!result) notFound();
  const { property, qrSvg } = result;
  return (
    <PageFrame>
      <PageTitle eyebrow="Housing & premises" title={property.name} description="Property profile, QR verification, occupancy, allocation, maintenance, inspections, documents and audit history." />
      <div className="mb-5 flex flex-wrap gap-2">{["NATIONAL_TREASURY_SUPER_ADMIN", "MINISTRY_ADMIN", "HOUSING_OFFICER"].includes(user.role) ? <Link href={`/housing/${property.id}/edit`}><Button>Edit property</Button></Link> : null}<Link href="/housing"><Button variant="secondary">Back to housing</Button></Link></div>
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Card><CardHeader><CardTitle>Property profile</CardTitle><CardDescription>{property.assetCode}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid h-48 place-items-center rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" dangerouslySetInnerHTML={{ __html: qrSvg }} /><Line icon={<Home className="h-4 w-4" />} label="Type" value={property.unitType} /><Line icon={<MapPin className="h-4 w-4" />} label="Location" value={`${property.physicalAddress}, ${property.town}, ${property.county}`} /><Line icon={<User className="h-4 w-4" />} label="Occupant" value={property.occupantName} /><Line icon={<Wrench className="h-4 w-4" />} label="Lifecycle" value={property.lifecycleRecommendation} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Map placeholder</CardTitle></CardHeader><CardContent><div className="grid h-40 place-items-center rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700">{property.gpsCoordinates ?? "GIS coordinates pending"}</div></CardContent></Card>
        </div>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4"><Metric label="Estimated value" value={formatKes(property.estimatedMarketValue)} /><Metric label="Rooms" value={String(property.rooms)} /><Metric label="Rent deduction" value={formatKes(property.rentDeduction)} /><Metric label="Occupancy" value={property.occupancyStatus.replaceAll("_", " ")} /></div>
          <Card><CardHeader><CardTitle>Ownership and condition</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3"><Info label="Institution" value={property.institution} /><Info label="Department" value={property.department} /><Info label="Condition" value={property.condition} /><Info label="Construction" value={property.constructionType} /><Info label="Utilities" value={property.utilitiesAvailable.join(", ") || "Not recorded"} /><Info label="Status" value={property.status} /></CardContent></Card>
          <HousingOperationalPanel mode="maintenance" properties={[property]} />
          <History title="Allocation history" rows={property.allocations.map((item) => [item.allocationDate, item.employeeName, `${item.status} - ${formatKes(item.monthlyRentDeduction)}`])} empty="No allocation history captured." />
          <History title="Inspection history" rows={property.inspections.map((item) => [item.inspectionDate, item.inspectorName, `${item.conditionRating} - ${item.recommendation}`])} empty="No inspection history captured." />
          <History title="Audit timeline" rows={property.auditLogs.map((item) => [item.date, item.action, item.actor])} empty="No audit logs captured." />
          <History title="Photos and documents" rows={property.documents.map((item) => [item.createdAt, item.name, item.type])} empty="No documents uploaded." />
        </div>
      </div>
    </PageFrame>
  );
}

function Line({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 text-sm">{icon}<div><div className="font-semibold">{label}</div><div className="text-neutral-500">{value}</div></div></div>;
}
function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs text-neutral-500">{label}</div><div className="mt-2 text-lg font-black">{value}</div></CardContent></Card>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"><div className="text-xs text-neutral-500">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}
function History({ title, rows, empty }: { title: string; rows: string[][]; empty: string }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{rows.length ? <Table><THead><TR><TH>Date</TH><TH>Reference</TH><TH>Details</TH></TR></THead><TBody>{rows.map((row) => <TR key={row.join("-")}><TD>{row[0]}</TD><TD>{row[1]}</TD><TD>{row[2]}</TD></TR>)}</TBody></Table> : <EmptyState title={title} description={empty} />}</CardContent></Card>;
}
