"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { fleetVehicleSchema, fuelTypes, type FleetVehicleFormValues, type FleetVehicleInput } from "@/lib/fleet-validation";
import { conditionValues, depreciationValues, statusValues } from "@/lib/asset-validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";

type Lookups = {
  institutions: { id: string; name: string; code: string }[];
  departments: { id: string; name: string; institutionId: string }[];
  locations: { id: string; name: string; institutionId: string }[];
  users: { id: string; fullName: string; email: string; payrollNo?: string | null; institutionId?: string | null }[];
};

const defaults: FleetVehicleFormValues = {
  name: "",
  description: "",
  institutionId: "",
  departmentId: "",
  locationId: "",
  location: "",
  acquisitionDate: new Date().toISOString().slice(0, 10),
  purchaseCost: 0,
  supplier: "",
  usefulLifeYears: 8,
  depreciationMethod: "STRAIGHT_LINE",
  condition: "GOOD",
  status: "ACTIVE",
  assignedUserId: "",
  registrationNumber: "",
  ntsaRegistrationStatus: "PENDING_VERIFICATION",
  make: "",
  model: "",
  bodyType: "SUV",
  yearOfManufacture: new Date().getFullYear(),
  engineNumber: "",
  chassisNumber: "",
  fuelType: "Diesel",
  tankCapacityLitres: 80,
  mileageKm: 0,
  driverAssigned: "",
  driverPayrollNo: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  insuranceStartDate: "",
  insuranceExpiry: "",
  lastServiceDate: "",
  nextServiceDate: "",
  nextServiceMileage: undefined,
  gpsTrackerId: "",
  fuelCardNumber: "",
  remarks: "",
};

export function FleetVehicleForm({
  mode,
  fleetId,
  lookups,
  initialValues,
}: {
  mode: "create" | "edit";
  fleetId?: string;
  lookups: Lookups;
  initialValues?: Partial<FleetVehicleFormValues> | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const form = useForm<FleetVehicleFormValues, unknown, FleetVehicleInput>({
    resolver: zodResolver(fleetVehicleSchema),
    defaultValues: { ...defaults, ...initialValues },
  });
  const institutionId = form.watch("institutionId");
  const visibleDepartments = useMemo(() => lookups.departments.filter((item) => !institutionId || item.institutionId === institutionId), [institutionId, lookups.departments]);
  const visibleLocations = useMemo(() => lookups.locations.filter((item) => !institutionId || item.institutionId === institutionId), [institutionId, lookups.locations]);
  const visibleUsers = useMemo(() => lookups.users.filter((item) => !institutionId || !item.institutionId || item.institutionId === institutionId), [institutionId, lookups.users]);

  async function onSubmit(values: FleetVehicleInput) {
    setSaving(true);
    const response = await fetch(mode === "create" ? "/api/fleet" : `/api/fleet/${fleetId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error ?? "Unable to save vehicle.");
      return;
    }
    toast.success(mode === "create" ? "Vehicle registered." : "Vehicle updated.");
    router.push(mode === "create" ? "/fleet" : `/fleet/${fleetId}`);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Register fleet vehicle" : "Edit fleet vehicle"}</CardTitle>
          <CardDescription>Creates or updates both the Asset Master Registry record and the fleet-specific vehicle profile.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Section title="General asset fields" />
          <Field label="Asset name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
          <Field label="Institution" error={form.formState.errors.institutionId?.message}>
            <Select {...form.register("institutionId")}>
              <option value="">Select institution</option>
              {lookups.institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label="Department"><Select {...form.register("departmentId")}><option value="">Unassigned</option>{visibleDepartments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Location reference"><Select {...form.register("locationId")}><option value="">Manual location</option>{visibleLocations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Physical location" error={form.formState.errors.location?.message}><Input {...form.register("location")} /></Field>
          <Field label="Acquisition date"><Input type="date" {...form.register("acquisitionDate")} /></Field>
          <Field label="Purchase cost"><Input type="number" min={0} {...form.register("purchaseCost")} /></Field>
          <Field label="Supplier"><Input {...form.register("supplier")} /></Field>
          <Field label="Useful life years"><Input type="number" min={1} {...form.register("usefulLifeYears")} /></Field>
          <Field label="Depreciation method"><Select {...form.register("depreciationMethod")}>{depreciationValues.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</Select></Field>
          <Field label="Condition"><Select {...form.register("condition")}>{conditionValues.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
          <Field label="Status"><Select {...form.register("status")}>{statusValues.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</Select></Field>
          <Field label="Assigned user"><Select {...form.register("assignedUserId")}><option value="">Unassigned</option>{visibleUsers.map((item) => <option key={item.id} value={item.id}>{item.fullName} ({item.email})</option>)}</Select></Field>
          <div className="md:col-span-2"><Field label="Asset description" error={form.formState.errors.description?.message}><Textarea {...form.register("description")} /></Field></div>

          <Section title="Fleet-specific fields" />
          <Field label="Registration number" error={form.formState.errors.registrationNumber?.message}><Input {...form.register("registrationNumber")} /></Field>
          <Field label="NTSA registration status"><Input {...form.register("ntsaRegistrationStatus")} /></Field>
          <Field label="Vehicle make"><Input {...form.register("make")} /></Field>
          <Field label="Vehicle model"><Input {...form.register("model")} /></Field>
          <Field label="Body type"><Input {...form.register("bodyType")} /></Field>
          <Field label="Year of manufacture"><Input type="number" {...form.register("yearOfManufacture")} /></Field>
          <Field label="Engine number"><Input {...form.register("engineNumber")} /></Field>
          <Field label="Chassis number"><Input {...form.register("chassisNumber")} /></Field>
          <Field label="Fuel type"><Select {...form.register("fuelType")}>{fuelTypes.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
          <Field label="Tank capacity litres"><Input type="number" step="0.01" {...form.register("tankCapacityLitres")} /></Field>
          <Field label="Current mileage"><Input type="number" {...form.register("mileageKm")} /></Field>
          <Field label="Assigned driver"><Input {...form.register("driverAssigned")} /></Field>
          <Field label="Driver payroll number"><Input {...form.register("driverPayrollNo")} /></Field>
          <Field label="Insurance provider"><Input {...form.register("insuranceProvider")} /></Field>
          <Field label="Insurance policy number"><Input {...form.register("insurancePolicyNumber")} /></Field>
          <Field label="Insurance start date"><Input type="date" {...form.register("insuranceStartDate")} /></Field>
          <Field label="Insurance expiry date" error={form.formState.errors.insuranceExpiry?.message}><Input type="date" {...form.register("insuranceExpiry")} /></Field>
          <Field label="Last service date"><Input type="date" {...form.register("lastServiceDate")} /></Field>
          <Field label="Next service due date"><Input type="date" {...form.register("nextServiceDate")} /></Field>
          <Field label="Next service mileage"><Input type="number" {...form.register("nextServiceMileage")} /></Field>
          <Field label="GPS tracker ID placeholder"><Input {...form.register("gpsTrackerId")} /></Field>
          <Field label="Fuel card number placeholder"><Input {...form.register("fuelCardNumber")} /></Field>
          <div className="md:col-span-2"><Field label="Remarks"><Textarea {...form.register("remarks")} /></Field></div>
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Documents and photos</CardTitle>
            <CardDescription>Supabase Storage placeholders for logbooks, insurance documents, inspection reports and vehicle photos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700"><Upload className="mb-2 h-5 w-5" /> Vehicle document upload placeholder</div>
            <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700"><Upload className="mb-2 h-5 w-5" /> Vehicle photo upload placeholder</div>
          </CardContent>
        </Card>
        <Button className="w-full" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : mode === "create" ? "Register vehicle" : "Save vehicle"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {error ? <span className="block text-xs font-semibold text-red-700">{error}</span> : null}
    </label>
  );
}

function Section({ title }: { title: string }) {
  return <div className="md:col-span-2 border-b border-neutral-200 pb-2 pt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8a721e] dark:border-neutral-800">{title}</div>;
}
