"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { type HousingProperty, type HousingProject } from "@/lib/housing-repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const reports = [["property-register", "Property register"], ["occupancy", "Occupancy report"], ["vacant", "Vacant units"], ["maintenance", "Maintenance cost"], ["allocations", "Allocation history"], ["projects", "Construction progress"], ["condition", "Condition assessment"]] as const;

export function HousingReports({ properties, projects }: { properties: HousingProperty[]; projects: HousingProject[] }) {
  const [report, setReport] = useState<(typeof reports)[number][0]>("property-register");
  const [institution, setInstitution] = useState("");
  const [county, setCounty] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const institutions = Array.from(new Set(properties.map((item) => item.institution))).sort();
  const counties = Array.from(new Set(properties.map((item) => item.county))).sort();
  const scoped = properties.filter((item) => (!institution || item.institution === institution) && (!county || item.county === county));
  const dateFilter = (date?: string) => (!from || (date ?? "") >= from) && (!to || (date ?? "") <= to);
  const rows = report === "occupancy" ? scoped.filter((item) => item.occupancyStatus === "OCCUPIED").map(baseRow)
    : report === "vacant" ? scoped.filter((item) => item.occupancyStatus === "VACANT").map(baseRow)
      : report === "maintenance" ? scoped.flatMap((property) => property.maintenanceRequests.filter((item) => dateFilter(item.dateSubmitted)).map((item) => ({ Property: property.unitCode, Type: item.requestType, Priority: item.priority, Cost: item.actualCost || item.estimatedCost, Status: item.status })))
        : report === "allocations" ? scoped.flatMap((property) => property.allocations.filter((item) => dateFilter(item.allocationDate)).map((item) => ({ Property: property.unitCode, Employee: item.employeeName, Payroll: item.payrollNo, Date: item.allocationDate, Rent: item.monthlyRentDeduction, Status: item.status })))
          : report === "projects" ? projects.filter((item) => (!institution || item.institution === institution) && (!county || item.county === county)).map((item) => ({ Code: item.projectCode, Project: item.projectName, Contractor: item.contractor, Budget: item.budgetApproved, Spent: item.amountSpent, Progress: `${item.completionPercentage}%`, Status: item.status }))
            : report === "condition" ? scoped.filter((item) => ["Poor", "Critical"].includes(item.condition)).map((item) => ({ Property: item.unitCode, Name: item.name, Condition: item.condition, Recommendation: item.lifecycleRecommendation, Value: item.estimatedMarketValue }))
              : scoped.map(baseRow);
  const headers = Object.keys(rows[0] ?? { Message: "No records" });

  async function exportCsv() {
    await fetch(`/api/housing/reports?report=${report}`);
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(String((row as Record<string, unknown>)[header] ?? ""))).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `igamis-housing-${report}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Housing report export logged and downloaded.");
  }

  return <Card><CardHeader className="gap-4 md:flex-row md:items-center md:justify-between"><div><CardTitle>Housing reports</CardTitle><CardDescription>Property, occupancy, maintenance, allocation, construction and condition reports.</CardDescription></div><div className="flex gap-2"><Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button><Button variant="secondary" onClick={exportCsv}><FileSpreadsheet className="h-4 w-4" /> Excel-ready</Button></div></CardHeader><CardContent><div className="mb-4 grid gap-3 md:grid-cols-5"><label className="space-y-1.5 text-sm font-semibold">Report<Select value={report} onChange={(event) => setReport(event.target.value as typeof report)}>{reports.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label><label className="space-y-1.5 text-sm font-semibold">Institution<Select value={institution} onChange={(event) => setInstitution(event.target.value)}><option value="">All</option>{institutions.map((item) => <option key={item}>{item}</option>)}</Select></label><label className="space-y-1.5 text-sm font-semibold">County<Select value={county} onChange={(event) => setCounty(event.target.value)}><option value="">All</option>{counties.map((item) => <option key={item}>{item}</option>)}</Select></label><label className="space-y-1.5 text-sm font-semibold">From<Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label className="space-y-1.5 text-sm font-semibold">To<Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></div><div className="mb-4 rounded-lg border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700">PDF export placeholder</div><div className="overflow-x-auto"><Table><THead><TR>{headers.map((header) => <TH key={header}>{header}</TH>)}</TR></THead><TBody>{rows.length ? rows.map((row, index) => <TR key={index}>{headers.map((header) => <TD key={header}>{String((row as Record<string, unknown>)[header] ?? "")}</TD>)}</TR>) : <TR><TD>No records found</TD></TR>}</TBody></Table></div></CardContent></Card>;
}

function baseRow(item: HousingProperty) {
  return { AssetCode: item.assetCode, Property: item.name, Type: item.unitType, Institution: item.institution, County: item.county, Town: item.town, Occupancy: item.occupancyStatus, Occupant: item.occupantName, Condition: item.condition, Value: item.estimatedMarketValue };
}
