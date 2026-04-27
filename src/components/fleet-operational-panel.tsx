"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { type FleetVehicle } from "@/lib/fleet-repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

type Mode = "fuel" | "service" | "insurance" | "accident";

const endpoints = {
  fuel: "/api/fleet/fuel-logs",
  service: "/api/fleet/service-records",
  insurance: "/api/fleet/insurance",
  accident: "/api/fleet/accidents",
};

export function FleetOperationalPanel({ mode, vehicles, compact = false }: { mode: Mode; vehicles: FleetVehicle[]; compact?: boolean }) {
  const [saving, setSaving] = useState(false);
  let rows: Record<string, unknown>[] = [];
  if (mode === "fuel") rows = vehicles.flatMap((vehicle) => vehicle.fuelLogs.map((item) => ({ ...item, vehicleId: vehicle.id, registrationNumber: vehicle.registrationNumber })));
  if (mode === "service") rows = vehicles.flatMap((vehicle) => vehicle.serviceRecords.map((item) => ({ ...item, vehicleId: vehicle.id, registrationNumber: vehicle.registrationNumber })));
  if (mode === "insurance") rows = vehicles.flatMap((vehicle) => vehicle.insuranceRecords.map((item) => ({ ...item, vehicleId: vehicle.id, registrationNumber: vehicle.registrationNumber })));
  if (mode === "accident") rows = vehicles.flatMap((vehicle) => vehicle.accidentLogs.map((item) => ({ ...item, vehicleId: vehicle.id, registrationNumber: vehicle.registrationNumber })));

  async function submit(formData: FormData) {
    setSaving(true);
    const body = Object.fromEntries(formData.entries());
    if (mode === "fuel") {
      body.totalCost = String(Number(body.litres ?? 0) * Number(body.costPerLitre ?? 0));
    }
    const response = await fetch(endpoints[mode], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error ?? "Unable to save fleet record.");
      return;
    }
    toast.success("Fleet record saved.");
    window.location.reload();
  }

  return (
    <div className={compact ? "space-y-4" : "grid gap-5 xl:grid-cols-[420px_1fr]"}>
      <Card>
        <CardHeader>
          <CardTitle>{titles[mode]}</CardTitle>
          <CardDescription>{descriptions[mode]}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submit} className="grid gap-3">
            <label className="space-y-1.5 text-sm font-semibold">
              Vehicle
              <Select name="fleetAssetId" required>
                <option value="">Select vehicle</option>
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber} - {vehicle.make} {vehicle.model}</option>)}
              </Select>
            </label>
            {mode === "fuel" ? <FuelFields /> : null}
            {mode === "service" ? <ServiceFields /> : null}
            {mode === "insurance" ? <InsuranceFields /> : null}
            {mode === "accident" ? <AccidentFields /> : null}
            <Button disabled={saving}><Plus className="h-4 w-4" /> {saving ? "Saving..." : `Add ${buttonLabels[mode]}`}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{historyTitles[mode]}</CardTitle>
          <CardDescription>Recent records in your authorized fleet scope.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length ? <RecordsTable mode={mode} rows={rows.slice(0, compact ? 5 : 20)} /> : <EmptyState title="No records found" description={`No ${buttonLabels[mode].toLowerCase()} records have been captured for this scope.`} />}
        </CardContent>
      </Card>
    </div>
  );
}

function FuelFields() {
  return (
    <>
      <Input name="date" type="date" required />
      <Input name="odometerReadingKm" type="number" placeholder="Odometer reading" required />
      <Input name="litres" type="number" step="0.01" placeholder="Litres fueled" required />
      <Input name="costPerLitre" type="number" step="0.01" placeholder="Fuel cost per litre" required />
      <Input name="fuelStation" placeholder="Fuel station" required />
      <Input name="fuelCardReference" placeholder="Fuel card/reference number" />
      <Textarea name="remarks" placeholder="Remarks" />
    </>
  );
}

function ServiceFields() {
  return (
    <>
      <Input name="serviceDate" type="date" required />
      <Input name="serviceType" placeholder="Service type" required />
      <Input name="vendor" placeholder="Garage/vendor" required />
      <Input name="odometerReadingKm" type="number" placeholder="Odometer reading" required />
      <Textarea name="workDone" placeholder="Work done" required />
      <Input name="partsReplaced" placeholder="Parts replaced" />
      <Input name="labourCost" type="number" step="0.01" placeholder="Labour cost" required />
      <Input name="partsCost" type="number" step="0.01" placeholder="Parts cost" required />
      <Input name="nextServiceDate" type="date" />
      <Input name="nextServiceMileage" type="number" placeholder="Next service mileage" />
      <Textarea name="remarks" placeholder="Remarks" />
    </>
  );
}

function InsuranceFields() {
  return (
    <>
      <Input name="provider" placeholder="Insurance provider" required />
      <Input name="policyNumber" placeholder="Policy number" required />
      <Input name="coverType" placeholder="Cover type" required />
      <Input name="startDate" type="date" required />
      <Input name="expiryDate" type="date" required />
      <Input name="premiumAmount" type="number" step="0.01" placeholder="Premium amount" required />
      <Select name="renewalStatus" defaultValue="ACTIVE"><option>ACTIVE</option><option>DUE_RENEWAL</option><option>RENEWED</option><option>LAPSED</option></Select>
      <div className="rounded-lg border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700">Policy document upload placeholder</div>
    </>
  );
}

function AccidentFields() {
  return (
    <>
      <Input name="accidentDate" type="date" required />
      <Input name="location" placeholder="Accident location" required />
      <Input name="driver" placeholder="Driver" required />
      <Textarea name="description" placeholder="Description" required />
      <Input name="policeAbstractNumber" placeholder="Police abstract number" />
      <Input name="insuranceClaimNumber" placeholder="Insurance claim number" />
      <Input name="repairEstimate" type="number" step="0.01" placeholder="Repair estimate" required />
      <Input name="actualRepairCost" type="number" step="0.01" placeholder="Actual repair cost" required />
      <Select name="status" defaultValue="OPEN"><option>OPEN</option><option>CLAIM_SUBMITTED</option><option>UNDER_REPAIR</option><option>CLOSED</option></Select>
      <div className="rounded-lg border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700">Photos and documents upload placeholder</div>
    </>
  );
}

function RecordsTable({ mode, rows }: { mode: Mode; rows: Record<string, unknown>[] }) {
  const headers = mode === "fuel"
    ? ["registrationNumber", "date", "odometerReadingKm", "litres", "totalCost", "abnormalFlag"]
    : mode === "service"
      ? ["registrationNumber", "serviceDate", "serviceType", "vendor", "totalCost", "nextServiceDate"]
      : mode === "insurance"
        ? ["registrationNumber", "provider", "policyNumber", "expiryDate", "premiumAmount", "renewalStatus"]
        : ["registrationNumber", "accidentDate", "location", "driver", "actualRepairCost", "status"];
  return (
    <div className="overflow-x-auto">
      <Table>
        <THead><TR>{headers.map((header) => <TH key={header}>{header.replaceAll(/([A-Z])/g, " $1")}</TH>)}</TR></THead>
        <TBody>
          {rows.map((row) => (
            <TR key={String(row.id)}>
              {headers.map((header) => (
                <TD key={header}>
                  {header === "abnormalFlag" ? <Badge tone={row[header] ? "red" : "green"}>{row[header] ? "Flagged" : "Normal"}</Badge> : String(row[header] ?? "")}
                </TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

const titles = {
  fuel: "Add fuel log",
  service: "Add service record",
  insurance: "Add insurance record",
  accident: "Add accident log",
};

const descriptions = {
  fuel: "Capture odometer, litres, station and cost. Total cost and abnormal consumption are calculated on save.",
  service: "Capture garage, work done, costs, next due date and next service mileage.",
  insurance: "Capture policy details, renewal status and expiry alert data.",
  accident: "Capture police, claim and repair cost details for audit history.",
};

const buttonLabels = {
  fuel: "fuel log",
  service: "service record",
  insurance: "insurance record",
  accident: "accident log",
};

const historyTitles = {
  fuel: "Fuel history",
  service: "Service history",
  insurance: "Insurance history",
  accident: "Accident history",
};
