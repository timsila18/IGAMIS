"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { maintenanceTypes } from "@/lib/housing-validation";
import { type HousingProperty, type HousingProject } from "@/lib/housing-repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatKes } from "@/data/demo";

type Mode = "allocations" | "maintenance" | "projects";

export function HousingOperationalPanel({ mode, properties, projects = [] }: { mode: Mode; properties: HousingProperty[]; projects?: HousingProject[] }) {
  const [saving, setSaving] = useState(false);
  const rows = mode === "allocations" ? properties.flatMap((property) => property.allocations.map((item) => ({ ...item, propertyCode: property.unitCode }))) : mode === "maintenance" ? properties.flatMap((property) => property.maintenanceRequests.map((item) => ({ ...item, propertyCode: property.unitCode }))) : projects;

  async function submit(formData: FormData) {
    setSaving(true);
    const endpoint = mode === "allocations" ? "/api/housing/allocations" : mode === "maintenance" ? "/api/housing/maintenance" : "/api/housing/projects";
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData.entries())) });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error ?? "Unable to save housing workflow record.");
      return;
    }
    toast.success("Housing workflow record saved.");
    window.location.reload();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader><CardTitle>{titles[mode]}</CardTitle><CardDescription>{descriptions[mode]}</CardDescription></CardHeader>
        <CardContent>
          <form action={submit} className="grid gap-3">
            {mode !== "projects" ? <label className="space-y-1.5 text-sm font-semibold">Property<Select name="housingUnitId" required><option value="">Select property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.unitCode} - {property.name}</option>)}</Select></label> : null}
            {mode === "allocations" ? <AllocationFields /> : null}
            {mode === "maintenance" ? <MaintenanceFields /> : null}
            {mode === "projects" ? <ProjectFields properties={properties} /> : null}
            <Button disabled={saving}><Plus className="h-4 w-4" /> {saving ? "Saving..." : buttons[mode]}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{history[mode]}</CardTitle><CardDescription>Recent records in your authorized housing scope.</CardDescription></CardHeader>
        <CardContent>{rows.length ? <RecordsTable mode={mode} rows={rows as Record<string, unknown>[]} /> : <EmptyState title="No records found" description="No workflow records have been captured for this view." />}</CardContent>
      </Card>
    </div>
  );
}

function AllocationFields() {
  return <><Input name="employeeName" placeholder="Employee name" required /><Input name="payrollNo" placeholder="Payroll number" required /><Input name="institution" placeholder="Employee institution" required /><Input name="allocationDate" type="date" required /><Input name="expectedVacationDate" type="date" /><Input name="monthlyRentDeduction" type="number" placeholder="Monthly rent deduction" required /><Input name="familySize" type="number" placeholder="Family size" defaultValue={1} required /><Select name="status" defaultValue="APPROVED"><option>APPROVED</option><option>PENDING_APPROVAL</option><option>TRANSFER_REQUESTED</option><option>VACATED</option></Select><div className="rounded-lg border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700">Approval workflow and rent deduction export placeholder</div></>;
}

function MaintenanceFields() {
  return <><Input name="occupant" placeholder="Occupant" required /><Select name="requestType">{maintenanceTypes.map((item) => <option key={item}>{item}</option>)}</Select><Textarea name="description" placeholder="Description" required /><Select name="priority" defaultValue="MEDIUM"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></Select><Input name="technicianVendor" placeholder="Assigned technician/vendor" /><Input name="estimatedCost" type="number" placeholder="Estimated cost" defaultValue={0} required /><Input name="actualCost" type="number" placeholder="Actual cost" defaultValue={0} required /><Select name="status" defaultValue="SUBMITTED"><option>SUBMITTED</option><option>ASSIGNED</option><option>IN_PROGRESS</option><option>COMPLETED</option></Select><Input name="completionDate" type="date" /><div className="rounded-lg border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700">Before/after photos placeholder</div></>;
}

function ProjectFields({ properties }: { properties: HousingProperty[] }) {
  const institutions = Array.from(new Map(properties.map((item) => [item.institutionCode, { id: item.institutionCode, name: item.institution }])).values());
  return <><Input name="projectName" placeholder="Project name" required /><Input name="projectType" placeholder="Project type" defaultValue="Affordable housing project" required /><Select name="institutionId" required><option value="">Select institution</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input name="contractor" placeholder="Contractor" required /><Input name="county" placeholder="County" required /><Input name="town" placeholder="Town" required /><Input name="startDate" type="date" required /><Input name="expectedCompletion" type="date" required /><Input name="budgetApproved" type="number" placeholder="Budget approved" required /><Input name="amountSpent" type="number" placeholder="Amount spent" required /><Input name="completionPercentage" type="number" placeholder="Completion %" min={0} max={100} required /><Select name="status" defaultValue="ACTIVE"><option>ACTIVE</option><option>DELAYED</option><option>COMPLETED</option><option>ON_HOLD</option></Select><Textarea name="inspectionNotes" placeholder="Inspection notes" /><div className="rounded-lg border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700">Site photos placeholder</div></>;
}

function RecordsTable({ mode, rows }: { mode: Mode; rows: Record<string, unknown>[] }) {
  const headers = mode === "allocations" ? ["propertyCode", "employeeName", "payrollNo", "allocationDate", "monthlyRentDeduction", "status"] : mode === "maintenance" ? ["propertyCode", "requestNo", "requestType", "priority", "estimatedCost", "status"] : ["projectCode", "projectName", "contractor", "budgetApproved", "amountSpent", "completionPercentage", "status"];
  return <div className="overflow-x-auto"><Table><THead><TR>{headers.map((header) => <TH key={header}>{header}</TH>)}</TR></THead><TBody>{rows.map((row) => <TR key={String(row.id)}>{headers.map((header) => <TD key={header}>{header.toLowerCase().includes("cost") || header.toLowerCase().includes("budget") || header.toLowerCase().includes("spent") || header.toLowerCase().includes("deduction") ? formatKes(Number(row[header] ?? 0)) : String(row[header] ?? "")}</TD>)}</TR>)}</TBody></Table></div>;
}

const titles = { allocations: "Allocate housing unit", maintenance: "Submit maintenance request", projects: "Add construction project" };
const descriptions = { allocations: "Allocate, transfer or vacate staff quarters with approval-ready records.", maintenance: "Capture property maintenance requests, costs, vendors and completion status.", projects: "Track affordable housing projects, new offices, renovations and staff-quarter developments." };
const buttons = { allocations: "Save allocation", maintenance: "Save maintenance request", projects: "Save project" };
const history = { allocations: "Allocation history", maintenance: "Maintenance requests", projects: "Construction projects" };
