"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { assetInputSchema, conditionValues, depreciationValues, statusValues, type AssetInput } from "@/lib/asset-validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";

type Lookups = {
  categories: { id: string; name: string; code: string }[];
  institutions: { id: string; name: string; code: string }[];
  departments: { id: string; name: string; institutionId: string }[];
  locations: { id: string; name: string; institutionId: string }[];
  users: { id: string; fullName: string; email: string; institutionId?: string | null }[];
};

type AssetFormValues = z.input<typeof assetInputSchema>;

const defaults: AssetFormValues = {
  name: "",
  description: "",
  categoryId: "",
  institutionId: "",
  departmentId: "",
  locationId: "",
  location: "",
  acquisitionDate: new Date().toISOString().slice(0, 10),
  purchaseCost: 0,
  supplier: "",
  usefulLifeYears: 5,
  depreciationMethod: "STRAIGHT_LINE",
  condition: "GOOD",
  status: "ACTIVE",
  assignedUserId: "",
  serialNumber: "",
  assetTagNumber: "",
  warrantyExpiry: "",
};

export function AssetForm({
  mode,
  assetId,
  lookups,
  initialValues,
}: {
  mode: "create" | "edit";
  assetId?: string;
  lookups: Lookups;
  initialValues?: Partial<AssetFormValues> | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const form = useForm<AssetFormValues, unknown, AssetInput>({
    resolver: zodResolver(assetInputSchema),
    defaultValues: { ...defaults, ...initialValues },
  });
  const institutionId = form.watch("institutionId");
  const visibleDepartments = useMemo(
    () => lookups.departments.filter((item) => !institutionId || item.institutionId === institutionId),
    [institutionId, lookups.departments],
  );
  const visibleLocations = useMemo(
    () => lookups.locations.filter((item) => !institutionId || item.institutionId === institutionId),
    [institutionId, lookups.locations],
  );
  const visibleUsers = useMemo(
    () => lookups.users.filter((item) => !institutionId || !item.institutionId || item.institutionId === institutionId),
    [institutionId, lookups.users],
  );

  async function onSubmit(values: AssetInput) {
    setSaving(true);
    const response = await fetch(mode === "create" ? "/api/assets" : `/api/assets/${assetId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Unable to save asset.");
      return;
    }

    toast.success(mode === "create" ? "Asset registered." : "Asset updated.");
    router.push(mode === "create" ? "/assets" : `/assets/${assetId}`);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Add asset" : "Edit asset"}</CardTitle>
          <CardDescription>All fields are validated before writing to the Prisma-backed registry.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Asset name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Asset category" error={form.formState.errors.categoryId?.message}>
            <Select {...form.register("categoryId")}>
              <option value="">Select category</option>
              {lookups.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label="Institution" error={form.formState.errors.institutionId?.message}>
            <Select {...form.register("institutionId")}>
              <option value="">Select institution</option>
              {lookups.institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label="Department">
            <Select {...form.register("departmentId")}>
              <option value="">Unassigned</option>
              {visibleDepartments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label="Location reference">
            <Select {...form.register("locationId")}>
              <option value="">Manual location only</option>
              {visibleLocations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label="Physical location" error={form.formState.errors.location?.message}>
            <Input {...form.register("location")} />
          </Field>
          <Field label="Acquisition date" error={form.formState.errors.acquisitionDate?.message}>
            <Input type="date" {...form.register("acquisitionDate")} />
          </Field>
          <Field label="Purchase cost" error={form.formState.errors.purchaseCost?.message}>
            <Input type="number" min={0} {...form.register("purchaseCost")} />
          </Field>
          <Field label="Supplier">
            <Input {...form.register("supplier")} />
          </Field>
          <Field label="Useful life years" error={form.formState.errors.usefulLifeYears?.message}>
            <Input type="number" min={1} {...form.register("usefulLifeYears")} />
          </Field>
          <Field label="Depreciation method">
            <Select {...form.register("depreciationMethod")}>
              {depreciationValues.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </Select>
          </Field>
          <Field label="Condition">
            <Select {...form.register("condition")}>
              {conditionValues.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select {...form.register("status")}>
              {statusValues.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </Select>
          </Field>
          <Field label="Assigned user">
            <Select {...form.register("assignedUserId")}>
              <option value="">Unassigned</option>
              {visibleUsers.map((item) => <option key={item.id} value={item.id}>{item.fullName} ({item.email})</option>)}
            </Select>
          </Field>
          <Field label="Serial number">
            <Input {...form.register("serialNumber")} />
          </Field>
          <Field label="Asset tag number">
            <Input {...form.register("assetTagNumber")} />
          </Field>
          <Field label="Warranty expiry date">
            <Input type="date" {...form.register("warrantyExpiry")} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Asset description" error={form.formState.errors.description?.message}>
              <Textarea {...form.register("description")} />
            </Field>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Uploads</CardTitle>
            <CardDescription>Supabase Storage placeholders for documents and photos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
              <Upload className="mb-2 h-5 w-5" />
              Upload documents placeholder
            </div>
            <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
              <Upload className="mb-2 h-5 w-5" />
              Upload photos placeholder
            </div>
          </CardContent>
        </Card>
        <Button className="w-full" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : mode === "create" ? "Register asset" : "Save changes"}
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
