"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Archive, Download, Edit, Eye, FileSpreadsheet, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { formatKes } from "@/data/demo";
import { type SessionUser } from "@/lib/auth";
import { type FleetVehicle } from "@/lib/fleet-repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

function canEdit(user: SessionUser) {
  return ["NATIONAL_TREASURY_SUPER_ADMIN", "FLEET_OFFICER"].includes(user.role);
}

function toneForStatus(status: string) {
  if (status === "ACTIVE") return "green";
  if (status === "UNDER_MAINTENANCE" || status === "IDLE") return "gold";
  if (status === "DUE_DISPOSAL" || status === "DISPOSED" || status === "MISSING") return "red";
  return "neutral";
}

function toneForService(status: FleetVehicle["serviceStatus"]) {
  if (status === "Current") return "green";
  if (status === "Due soon") return "gold";
  return "red";
}

export function FleetRegistry({ vehicles, user }: { vehicles: FleetVehicle[]; user: SessionUser }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const columns = useMemo<ColumnDef<FleetVehicle>[]>(() => [
    {
      accessorKey: "assetCode",
      header: "Asset code",
      cell: ({ row }) => (
        <div>
          <Link href={`/fleet/${row.original.id}`} className="font-semibold text-emerald-800 dark:text-emerald-300">{row.original.assetCode}</Link>
          <div className="text-xs text-neutral-500">{row.original.registrationNumber}</div>
        </div>
      ),
    },
    { accessorKey: "registrationNumber", header: "Registration" },
    { accessorKey: "make", header: "Make" },
    { accessorKey: "model", header: "Model" },
    { accessorKey: "yearOfManufacture", header: "Year" },
    { accessorKey: "institution", header: "Institution" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "assignedDriver", header: "Driver" },
    { accessorKey: "currentMileage", header: "Mileage", cell: ({ row }) => `${row.original.currentMileage.toLocaleString("en-KE")} km` },
    { accessorKey: "fuelType", header: "Fuel" },
    { accessorKey: "insuranceExpiry", header: "Insurance expiry" },
    { accessorKey: "serviceStatus", header: "Service", cell: ({ row }) => <Badge tone={toneForService(row.original.serviceStatus)}>{row.original.serviceStatus}</Badge> },
    { accessorKey: "condition", header: "Condition" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge tone={toneForStatus(row.original.status)}>{row.original.status.replaceAll("_", " ")}</Badge> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Link href={`/fleet/${row.original.id}`}><Button variant="ghost" size="icon" aria-label="View vehicle"><Eye className="h-4 w-4" /></Button></Link>
          {canEdit(user) ? <Link href={`/fleet/${row.original.id}/edit`}><Button variant="ghost" size="icon" aria-label="Edit vehicle"><Edit className="h-4 w-4" /></Button></Link> : null}
          {canEdit(user) ? <Button variant="ghost" size="icon" aria-label="Archive vehicle" onClick={() => archiveVehicle(row.original.id)}><Archive className="h-4 w-4" /></Button> : null}
        </div>
      ),
    },
  ], [user]);

  const table = useReactTable({
    data: vehicles,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  async function archiveVehicle(id: string) {
    const response = await fetch(`/api/fleet/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? "Unable to archive vehicle.");
      return;
    }
    toast.success("Vehicle archived.");
    window.location.reload();
  }

  async function exportCsv(kind = "fleet-register") {
    await fetch(`/api/fleet?export=${kind}`);
    const rows = table.getFilteredRowModel().rows.map((row) => row.original);
    const headers = ["assetCode", "registrationNumber", "make", "model", "yearOfManufacture", "institution", "department", "assignedDriver", "currentMileage", "fuelType", "insuranceExpiry", "serviceStatus", "condition", "status", "disposalRecommendation"];
    const csv = [headers.join(","), ...rows.map((vehicle) => headers.map((key) => JSON.stringify(String(vehicle[key as keyof FleetVehicle] ?? ""))).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `igamis-${kind}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Fleet export logged and downloaded.");
  }

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Vehicle Registry</CardTitle>
          <CardDescription>Integrated fleet records linked to the IGAMIS Asset Master Registry.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit(user) ? <Link href="/fleet/new"><Button size="sm"><Plus className="h-4 w-4" /> Add vehicle</Button></Link> : null}
          <Button variant="secondary" size="sm" onClick={() => exportCsv()}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="secondary" size="sm" onClick={() => exportCsv("fleet-register-excel-ready")}><FileSpreadsheet className="h-4 w-4" /> Excel-ready</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} className="pl-10" placeholder="Search registration, driver, institution, make, model..." />
        </div>
        {table.getRowModel().rows.length ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  {table.getHeaderGroups().map((group) => (
                    <TR key={group.id}>
                      {group.headers.map((header) => (
                        <TH key={header.id}>
                          <button type="button" onClick={header.column.getToggleSortingHandler()} className="text-left">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </button>
                        </TH>
                      ))}
                    </TR>
                  ))}
                </THead>
                <TBody>
                  {table.getRowModel().rows.map((row) => (
                    <TR key={row.id}>
                      {row.getVisibleCells().map((cell) => <TD key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TD>)}
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-neutral-500">Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}</div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button>
                <Button variant="secondary" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button>
              </div>
            </div>
          </>
        ) : <EmptyState title="No vehicles found" description="No fleet vehicles match your current role scope or search." />}
        {vehicles.length ? (
          <div className="mt-4 rounded-lg border border-[#c8a640]/30 bg-[#c8a640]/10 p-4 text-sm">
            Fleet value under management: <span className="font-semibold">{formatKes(vehicles.reduce((sum, item) => sum + item.currentValue, 0))}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
