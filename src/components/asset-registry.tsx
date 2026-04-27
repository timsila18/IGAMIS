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
import { Archive, Download, Edit, Eye, FileSpreadsheet, Plus, QrCode, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { type Asset } from "@/data/demo";
import { formatKes } from "@/data/demo";
import { type SessionUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

function statusTone(status: Asset["status"]) {
  if (status === "ACTIVE") return "green";
  if (status === "DUE_DISPOSAL" || status === "MISSING") return "red";
  if (status === "UNDER_MAINTENANCE" || status === "IDLE") return "gold";
  return "neutral";
}

function canEdit(user: SessionUser) {
  return ["NATIONAL_TREASURY_SUPER_ADMIN", "MINISTRY_ADMIN", "DEPARTMENT_ASSET_OFFICER"].includes(user.role);
}

function canArchive(user: SessionUser) {
  return ["NATIONAL_TREASURY_SUPER_ADMIN", "MINISTRY_ADMIN"].includes(user.role);
}

export function AssetRegistry({ assets, user }: { assets: Asset[]; user: SessionUser }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [showColumns, setShowColumns] = useState(false);

  const columns = useMemo<ColumnDef<Asset>[]>(() => [
    {
      accessorKey: "assetCode",
      header: "Asset code",
      cell: ({ row }) => (
        <div>
          <Link href={`/assets/${row.original.id}`} className="font-semibold text-emerald-800 dark:text-emerald-300">{row.original.assetCode}</Link>
          <div className="text-xs text-neutral-500">{row.original.name}</div>
        </div>
      ),
    },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "institution", header: "Institution" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "assignedUser", header: "Assigned user" },
    {
      accessorKey: "purchaseCost",
      header: "Purchase cost",
      cell: ({ row }) => <span className="font-semibold">{formatKes(row.original.purchaseCost)}</span>,
    },
    {
      accessorKey: "currentValue",
      header: "Current value",
      cell: ({ row }) => <span className="font-semibold">{formatKes(row.original.currentValue ?? row.original.purchaseCost)}</span>,
    },
    { accessorKey: "condition", header: "Condition" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge tone={statusTone(row.original.status)}>{row.original.status.replaceAll("_", " ")}</Badge>,
    },
    {
      id: "qr",
      header: "QR",
      cell: () => <div className="grid h-9 w-9 place-items-center rounded-md border border-neutral-200 dark:border-neutral-800"><QrCode className="h-4 w-4" /></div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Link href={`/assets/${row.original.id}`}><Button variant="ghost" size="icon" aria-label="View asset"><Eye className="h-4 w-4" /></Button></Link>
          {canEdit(user) ? <Link href={`/assets/${row.original.id}/edit`}><Button variant="ghost" size="icon" aria-label="Edit asset"><Edit className="h-4 w-4" /></Button></Link> : null}
          {canArchive(user) ? <Button variant="ghost" size="icon" aria-label="Archive asset" onClick={() => archive(row.original.id)}><Archive className="h-4 w-4" /></Button> : null}
        </div>
      ),
    },
  ], [user]);

  const table = useReactTable({
    data: assets,
    columns,
    state: { globalFilter, columnVisibility },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  async function archive(id: string) {
    const response = await fetch(`/api/assets/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = await response.json();
      toast.error(payload.error ?? "Unable to archive asset.");
      return;
    }
    toast.success("Asset archived.");
    window.location.reload();
  }

  async function exportCsv() {
    await fetch("/api/assets?export=csv");
    const rows = table.getFilteredRowModel().rows.map((row) => row.original);
    const headers = ["assetCode", "name", "category", "institution", "department", "location", "assignedUser", "purchaseCost", "currentValue", "condition", "status"];
    const csv = [headers.join(","), ...rows.map((asset) => headers.map((key) => JSON.stringify(String(asset[key as keyof Asset] ?? ""))).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "igamis-asset-register.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Asset export logged and downloaded.");
  }

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Asset Master Registry</CardTitle>
          <CardDescription>Search, filter, sort, export, view, add, edit and archive assets according to your role.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit(user) ? <Link href="/assets/new"><Button size="sm"><Plus className="h-4 w-4" /> Add asset</Button></Link> : null}
          <Button variant="secondary" size="sm" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="secondary" size="sm" onClick={exportCsv}><FileSpreadsheet className="h-4 w-4" /> Excel-ready</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowColumns((value) => !value)}><SlidersHorizontal className="h-4 w-4" /> Columns</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} className="pl-10" placeholder="Search asset code, name, institution, user, category..." />
        </div>
        {showColumns ? (
          <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
            {table.getAllLeafColumns().filter((column) => column.id !== "actions").map((column) => (
              <label key={column.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
                {column.id}
              </label>
            ))}
          </div>
        ) : null}
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
              <div className="text-sm text-neutral-500">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button>
                <Button variant="secondary" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button>
              </div>
            </div>
          </>
        ) : <EmptyState title="No assets found" description="Adjust your search or filters, or register a new asset if your role allows it." />}
      </CardContent>
    </Card>
  );
}
