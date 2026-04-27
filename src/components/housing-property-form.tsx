"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { conditionValues, depreciationValues, statusValues } from "@/lib/asset-validation";
import { housingPropertySchema, occupancyStatuses, propertyTypes, type HousingPropertyFormValues, type HousingPropertyInput } from "@/lib/housing-validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";

type Lookups = {
  institutions: { id: string; name: string; code: string }[];
  departments: { id: string; name: string; institutionId: string }[];
  locations: { id: string; name: string; institutionId: string }[];
};

const defaults: HousingPropertyFormValues = {
  name: "",
  description: "",
  institutionId: "",
  departmentId: "",
  locationId: "",
  acquisitionDate: new Date().toISOString().slice(0, 10),
  purchaseCost: 0,
  usefulLifeYears: 40,
  depreciationMethod: "STRAIGHT_LINE",
  condition: "GOOD",
  status: "ACTIVE",
  unitType: "Staff Quarters",
  county: "Nairobi",
  subCounty: "",
  town: "Nairobi",
  ward: "",
  physicalAddress: "",
  gpsCoordinates: "",
  bedrooms: 0,
  bathrooms: 0,
  rooms: 1,
  plotSize: "",
  floorSize: "",
  constructionType: "Permanent Structure",
  yearBuilt: undefined,
  occupancyCapacity: 1,
  utilitiesAvailable: "Water, Electricity",
  monthlyRentValue: 0,
  estimatedMarketValue: 0,
  occupancyStatus: "VACANT",
  occupantName: "",
  occupantPayrollNo: "",
  rentDeduction: 0,
  remarks: "",
};

export function HousingPropertyForm({ mode, propertyId, lookups, initialValues }: { mode: "create" | "edit"; propertyId?: string; lookups: Lookups; initialValues?: Partial<HousingPropertyFormValues> | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const form = useForm<HousingPropertyFormValues, unknown, HousingPropertyInput>({ resolver: zodResolver(housingPropertySchema), defaultValues: { ...defaults, ...initialValues } });
  const institutionId = form.watch("institutionId");
  const visibleDepartments = useMemo(() => lookups.departments.filter((item) => !institutionId || item.institutionId === institutionId), [institutionId, lookups.departments]);
  const visibleLocations = useMemo(() => lookups.locations.filter((item) => !institutionId || item.institutionId === institutionId), [institutionId, lookups.locations]);

  async function onSubmit(values: HousingPropertyInput) {
    setSaving(true);
    const response = await fetch(mode === "create" ? "/api/housing" : `/api/housing/${propertyId}`, { method: mode === "create" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(payload.error ?? "Unable to save property.");
    toast.success(mode === "create" ? "Property registered." : "Property updated.");
    router.push(mode === "create" ? "/housing" : `/housing/${propertyId}`);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader><CardTitle>{mode === "create" ? "Register property" : "Edit property"}</CardTitle><CardDescription>Creates or updates the Asset Registry record and housing/premises profile.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Section title="General asset fields" />
          <Field label="Asset name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
          <Field label="Institution"><Select {...form.register("institutionId")}><option value="">Select institution</option>{lookups.institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Department"><Select {...form.register("departmentId")}><option value="">Unassigned</option>{visibleDepartments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Location reference"><Select {...form.register("locationId")}><option value="">Manual address</option>{visibleLocations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
          <Field label="Acquisition date"><Input type="date" {...form.register("acquisitionDate")} /></Field>
          <Field label="Purchase cost"><Input type="number" {...form.register("purchaseCost")} /></Field>
          <Field label="Useful life years"><Input type="number" {...form.register("usefulLifeYears")} /></Field>
          <Field label="Depreciation method"><Select {...form.register("depreciationMethod")}>{depreciationValues.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</Select></Field>
          <Field label="Condition"><Select {...form.register("condition")}>{conditionValues.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
          <Field label="Status"><Select {...form.register("status")}>{statusValues.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</Select></Field>
          <div className="md:col-span-2"><Field label="Description"><Textarea {...form.register("description")} /></Field></div>
          <Section title="Housing-specific fields" />
          <Field label="Property type"><Select {...form.register("unitType")}>{propertyTypes.map((item) => <option key={item} value={item}>{item}</option>)}</Select></Field>
          <Field label="County"><Input {...form.register("county")} /></Field>
          <Field label="Sub-county"><Input {...form.register("subCounty")} /></Field>
          <Field label="Town"><Input {...form.register("town")} /></Field>
          <Field label="Ward"><Input {...form.register("ward")} /></Field>
          <Field label="Physical address"><Input {...form.register("physicalAddress")} /></Field>
          <Field label="GPS coordinates placeholder"><Input {...form.register("gpsCoordinates")} /></Field>
          <Field label="Bedrooms"><Input type="number" {...form.register("bedrooms")} /></Field>
          <Field label="Bathrooms"><Input type="number" {...form.register("bathrooms")} /></Field>
          <Field label="Number of rooms"><Input type="number" {...form.register("rooms")} /></Field>
          <Field label="Plot size"><Input {...form.register("plotSize")} /></Field>
          <Field label="Floor size"><Input {...form.register("floorSize")} /></Field>
          <Field label="Construction type"><Input {...form.register("constructionType")} /></Field>
          <Field label="Year built"><Input type="number" {...form.register("yearBuilt")} /></Field>
          <Field label="Occupancy capacity"><Input type="number" {...form.register("occupancyCapacity")} /></Field>
          <Field label="Utilities available"><Input {...form.register("utilitiesAvailable")} /></Field>
          <Field label="Monthly rent value"><Input type="number" {...form.register("monthlyRentValue")} /></Field>
          <Field label="Estimated market value"><Input type="number" {...form.register("estimatedMarketValue")} /></Field>
          <Field label="Occupancy status"><Select {...form.register("occupancyStatus")}>{occupancyStatuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</Select></Field>
          <Field label="Current occupant"><Input {...form.register("occupantName")} /></Field>
          <Field label="Occupant payroll number"><Input {...form.register("occupantPayrollNo")} /></Field>
          <Field label="Monthly rent deduction"><Input type="number" {...form.register("rentDeduction")} /></Field>
          <div className="md:col-span-2"><Field label="Remarks"><Textarea {...form.register("remarks")} /></Field></div>
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card><CardHeader><CardTitle className="text-sm">Photos and documents</CardTitle><CardDescription>Supabase Storage placeholders for title, allocation, inspection and photos.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700"><Upload className="mb-2 h-5 w-5" /> Document upload placeholder</div><div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700"><Upload className="mb-2 h-5 w-5" /> Photo upload placeholder</div></CardContent></Card>
        <Button className="w-full" disabled={saving}><Save className="h-4 w-4" /> {saving ? "Saving..." : mode === "create" ? "Register property" : "Save property"}</Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="space-y-1.5"><span className="text-sm font-semibold">{label}</span>{children}{error ? <span className="block text-xs font-semibold text-red-700">{error}</span> : null}</label>;
}

function Section({ title }: { title: string }) {
  return <div className="md:col-span-2 border-b border-neutral-200 pb-2 pt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8a721e] dark:border-neutral-800">{title}</div>;
}
