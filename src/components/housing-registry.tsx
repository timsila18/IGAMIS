"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Archive, Download, Edit, Eye, FileSpreadsheet, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { formatKes } from "@/data/demo";
import { type SessionUser } from "@/lib/auth";
import { type HousingProperty } from "@/lib/housing-repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

function canEdit(user: SessionUser) {
  return ["NATIONAL_TREASURY_SUPER_ADMIN", "MINISTRY_ADMIN", "HOUSING_OFFICER"].includes(user.role);
}

function statusTone(status: string) {
  if (status === "OCCUPIED" || status === "ACTIVE") return "green";
  if (status === "VACANT" || status === "RESERVED") return "gold";
  if (status === "UNDER_MAINTENANCE" || status === "Critical" || status === "Poor") return "red";
  return "neutral";
}

export function HousingRegistry({ properties, user }: { properties: HousingProperty[]; user: SessionUser }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const columns = useMemo<ColumnDef<HousingProperty>[]>(() => [
    { accessorKey: "assetCode", header: "Asset code", cell: ({ row }) => <div><Link href={`/housing/${row.original.id}`} className="font-semibold text-emerald-800 dark:text-emerald-300">{row.original.assetCode}</Link><div className="text-xs text-neutral-500">{row.original.name}</div></div> },
    { accessorKey: "unitType", header: "Property type" },
    { accessorKey: "institution", header: "Institution" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "county", header: "County" },
    { accessorKey: "town", header: "Town" },
    { accessorKey: "occupancyStatus", header: "Occupancy", cell: ({ row }) => <Badge tone={statusTone(row.original.occupancyStatus)}>{row.original.occupancyStatus.replaceAll("_", " ")}</Badge> },
    { accessorKey: "occupantName", header: "Occupant" },
    { accessorKey: "rooms", header: "Rooms" },
    { accessorKey: "condition", header: "Condition", cell: ({ row }) => <Badge tone={statusTone(row.original.condition)}>{row.original.condition}</Badge> },
    { accessorKey: "estimatedMarketValue", header: "Estimated value", cell: ({ row }) => formatKes(row.original.estimatedMarketValue) },
    { accessorKey: "status", header: "Status" },
    { id: "actions", header: "Actions", cell: ({ row }) => <div className="flex gap-1"><Link href={`/housing/${row.original.id}`}><Button variant="ghost" size="icon" aria-label="View property"><Eye className="h-4 w-4" /></Button></Link>{canEdit(user) ? <Link href={`/housing/${row.original.id}/edit`}><Button variant="ghost" size="icon" aria-label="Edit property"><Edit className="h-4 w-4" /></Button></Link> : null}{canEdit(user) ? <Button variant="ghost" size="icon" aria-label="Archive property" onClick={() => archiveProperty(row.original.id)}><Archive className="h-4 w-4" /></Button> : null}</div> },
  ], [user]);
  const table = useReactTable({ data: properties, columns, state: { globalFilter }, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 8 } } });

  async function archiveProperty(id: string) {
    const response = await fetch(`/api/housing/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.error ?? "Unable to archive property.");
    toast.success("Property archived.");
    window.location.reload();
  }

  async function exportCsv(kind = "property-register") {
    await fetch(`/api/housing?export=${kind}`);
    const rows = table.getFilteredRowModel().rows.map((row) => row.original);
    const headers = ["assetCode", "name", "unitType", "institution", "department", "county", "town", "occupancyStatus", "occupantName", "rooms", "condition", "estimatedMarketValue", "status"];
    const csv = [headers.join(","), ...rows.map((property) => headers.map((key) => JSON.stringify(String(property[key as keyof HousingProperty] ?? ""))).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `igamis-${kind}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Housing export logged and downloaded.");
  }

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div><CardTitle>Property Registry</CardTitle><CardDescription>Government housing, offices, warehouses, camps, residences and land parcels.</CardDescription></div>
        <div className="flex flex-wrap gap-2">{canEdit(user) ? <Link href="/housing/new"><Button size="sm"><Plus className="h-4 w-4" /> Add property</Button></Link> : null}<Button variant="secondary" size="sm" onClick={() => exportCsv()}><Download className="h-4 w-4" /> CSV</Button><Button variant="secondary" size="sm" onClick={() => exportCsv("property-register-excel-ready")}><FileSpreadsheet className="h-4 w-4" /> Excel-ready</Button></div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} className="pl-10" placeholder="Search property, county, town, occupant, institution..." /></div>
        {table.getRowModel().rows.length ? <><div className="overflow-x-auto"><Table><THead>{table.getHeaderGroups().map((group) => <TR key={group.id}>{group.headers.map((header) => <TH key={header.id}><button type="button" onClick={header.column.getToggleSortingHandler()} className="text-left">{flexRender(header.column.columnDef.header, header.getContext())}</button></TH>)}</TR>)}</THead><TBody>{table.getRowModel().rows.map((row) => <TR key={row.id}>{row.getVisibleCells().map((cell) => <TD key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TD>)}</TR>)}</TBody></Table></div><div className="mt-4 flex items-center justify-between gap-3"><div className="text-sm text-neutral-500">Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}</div><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button><Button variant="secondary" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button></div></div></> : <EmptyState title="No properties found" description="No housing or premises records match your current scope." />}
      </CardContent>
    </Card>
  );
}
