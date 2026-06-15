import Link from "next/link";
import { notFound } from "next/navigation";
import { Car, Fuel, MapPin, Radar, ShieldCheck, Wrench } from "lucide-react";
import { FleetOperationalPanel } from "@/components/fleet-operational-panel";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatKes } from "@/data/demo";
import { requireUser } from "@/lib/auth";
import { getFleetVehicle } from "@/lib/fleet-repository";

export default async function FleetVehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const result = await getFleetVehicle(id, user);
  if (!result) notFound();
  const { vehicle, qrSvg } = result;

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Fleet management"
        title={`${vehicle.registrationNumber} - ${vehicle.make} ${vehicle.model}`}
        description="Vehicle profile, QR verification, insurance, service, fuel, accidents, maintenance, movement and audit history."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {["NATIONAL_TREASURY_SUPER_ADMIN", "FLEET_OFFICER"].includes(user.role) ? <Link href={`/fleet/${vehicle.id}/edit`}><Button>Edit vehicle</Button></Link> : null}
        <Link href="/fleet"><Button variant="secondary">Back to fleet</Button></Link>
      </div>
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle profile</CardTitle>
              <CardDescription>{vehicle.assetCode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid h-48 place-items-center rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <ProfileLine icon={<Car className="h-4 w-4" />} label="Registration" value={vehicle.registrationNumber} />
              <ProfileLine icon={<ShieldCheck className="h-4 w-4" />} label="NTSA status" value={vehicle.ntsaRegistrationStatus} />
              <ProfileLine icon={<MapPin className="h-4 w-4" />} label="Location" value={vehicle.location} />
              <ProfileLine icon={<Fuel className="h-4 w-4" />} label="Fuel" value={`${vehicle.fuelType}, ${vehicle.tankCapacityLitres}L tank`} />
              <ProfileLine icon={<Wrench className="h-4 w-4" />} label="Service" value={vehicle.serviceStatus} />
              <ProfileLine icon={<Radar className="h-4 w-4" />} label="GPS tracker" value={vehicle.gpsTrackerId ?? "Not linked"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Disposal readiness</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Badge tone={vehicle.disposalRecommendation === "Not due" ? "green" : vehicle.disposalRecommendation === "Monitor" ? "gold" : "red"}>{vehicle.disposalRecommendation}</Badge>
              <div className="text-sm text-neutral-500">Logic considers vehicle age, mileage, condition, repeated repairs, accident costs and current estimated value.</div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="Current mileage" value={`${vehicle.currentMileage.toLocaleString("en-KE")} km`} />
            <Metric label="Current value" value={formatKes(vehicle.currentValue)} />
            <Metric label="Insurance expiry" value={vehicle.insuranceExpiry} />
            <Metric label="Next service" value={vehicle.nextServiceDate ?? "Not set"} />
          </div>
          <Card>
            <CardHeader><CardTitle>Institution and assignment</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Info label="Institution" value={vehicle.institution} />
              <Info label="Department" value={vehicle.department} />
              <Info label="Assigned driver" value={vehicle.assignedDriver} />
              <Info label="Driver payroll number" value={vehicle.driverPayrollNo ?? "Not recorded"} />
              <Info label="Insurance provider" value={vehicle.insuranceProvider ?? "Not recorded"} />
              <Info label="Insurance policy" value={vehicle.insurancePolicyNumber ?? "Not recorded"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>NTSA integration placeholder</CardTitle>
              <CardDescription>Ready for future NTSA verification without hardcoded API keys.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Info label="Owner institution" value={vehicle.institution} />
              <Info label="Engine number" value={vehicle.engineNumber ?? "Recorded"} />
              <Info label="Chassis number" value={vehicle.chassisNumber ?? "Recorded"} />
              <Info label="Vehicle class" value={vehicle.bodyType} />
              <Info label="Inspection status" value={vehicle.ntsaRegistrationStatus} />
              <Info label="Year" value={String(vehicle.yearOfManufacture)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>GPS tracking placeholder</CardTitle>
              <CardDescription>Future telematics fields for tracker ID, location, sync date and mileage sync status.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <Info label="Tracker ID" value={vehicle.gpsTrackerId ?? "Not linked"} />
              <Info label="Last known location" value={vehicle.gpsLastKnownLocation ?? "Awaiting integration"} />
              <Info label="Last sync date" value={vehicle.gpsLastSyncAt ?? "Never synced"} />
              <Info label="Mileage sync status" value={vehicle.gpsMileageSyncStatus ?? "Manual odometer"} />
            </CardContent>
          </Card>
          <FleetOperationalPanel mode="fuel" vehicles={[vehicle]} compact />
          <History title="Movement history" empty="No movement history captured yet." rows={vehicle.movements.map((item) => [item.date, item.reason, `${item.from} to ${item.to}`])} />
          <History title="Maintenance history" empty="No maintenance history captured yet." rows={vehicle.maintenanceHistory.map((item) => [item.createdAt, item.requestNo, `${item.status} - ${formatKes(item.cost)}`])} />
          <History title="Audit timeline" empty="No audit entries captured yet." rows={vehicle.auditLogs.map((item) => [item.date, item.action, `${item.module} by ${item.actor}`])} />
          <History title="Documents and photos" empty="No documents or photos uploaded yet." rows={vehicle.documents.map((item) => [item.createdAt, item.name, item.type])} />
        </div>
      </div>
    </PageFrame>
  );
}

function ProfileLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 text-sm">{icon}<div><div className="font-semibold">{label}</div><div className="text-neutral-500">{value}</div></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs text-neutral-500">{label}</div><div className="mt-2 text-lg font-black">{value}</div></CardContent></Card>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"><div className="text-xs text-neutral-500">{label}</div><div className="mt-1 text-sm font-semibold">{value}</div></div>;
}

function History({ title, empty, rows }: { title: string; empty: string; rows: string[][] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length ? (
          <Table>
            <THead><TR><TH>Date</TH><TH>Reference</TH><TH>Details</TH></TR></THead>
            <TBody>{rows.map((row) => <TR key={row.join("-")}><TD>{row[0]}</TD><TD>{row[1]}</TD><TD>{row[2]}</TD></TR>)}</TBody>
          </Table>
        ) : <EmptyState title={title} description={empty} />}
      </CardContent>
    </Card>
  );
}
