"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Filter } from "lucide-react";
import { toast } from "sonner";
import { type FleetVehicle } from "@/lib/fleet-repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const reportOptions = [
  ["fleet-register", "Fleet register report"],
  ["fuel-consumption", "Fuel consumption report"],
  ["service-cost", "Service cost report"],
  ["insurance-expiry", "Insurance expiry report"],
  ["accidents", "Accident report"],
  ["disposal", "Disposal recommendation report"],
] as const;

export function FleetReports({ vehicles }: { vehicles: FleetVehicle[] }) {
  const [report, setReport] = useState<(typeof reportOptions)[number][0]>("fleet-register");
  const [institution, setInstitution] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const institutions = Array.from(new Set(vehicles.map((item) => item.institution))).sort();
  const scoped = vehicles.filter((vehicle) => !institution || vehicle.institution === institution);
  const dateFilter = (date?: string) => (!from || (date ?? "") >= from) && (!to || (date ?? "") <= to);
  const rows = report === "fuel-consumption"
    ? scoped.flatMap((vehicle) => vehicle.fuelLogs.filter((item) => dateFilter(item.date)).map((item) => ({ Vehicle: vehicle.registrationNumber, Date: item.date, Litres: item.litres, Cost: item.totalCost, Flag: item.abnormalFlag ? "Flagged" : "Normal" })))
    : report === "service-cost"
      ? scoped.flatMap((vehicle) => vehicle.serviceRecords.filter((item) => dateFilter(item.serviceDate)).map((item) => ({ Vehicle: vehicle.registrationNumber, Date: item.serviceDate, Vendor: item.vendor, Type: item.serviceType, Cost: item.totalCost })))
      : report === "insurance-expiry"
        ? scoped.flatMap((vehicle) => vehicle.insuranceRecords.filter((item) => dateFilter(item.expiryDate)).map((item) => ({ Vehicle: vehicle.registrationNumber, Provider: item.provider, Policy: item.policyNumber, Expiry: item.expiryDate, Premium: item.premiumAmount, Status: item.renewalStatus })))
        : report === "accidents"
          ? scoped.flatMap((vehicle) => vehicle.accidentLogs.filter((item) => dateFilter(item.accidentDate)).map((item) => ({ Vehicle: vehicle.registrationNumber, Date: item.accidentDate, Location: item.location, Driver: item.driver, Cost: item.actualRepairCost, Status: item.status })))
          : report === "disposal"
            ? scoped.filter((vehicle) => vehicle.disposalRecommendation !== "Not due").map((vehicle) => ({ Vehicle: vehicle.registrationNumber, Institution: vehicle.institution, Mileage: vehicle.currentMileage, Condition: vehicle.condition, Recommendation: vehicle.disposalRecommendation }))
            : scoped.map((vehicle) => ({ AssetCode: vehicle.assetCode, Registration: vehicle.registrationNumber, Make: vehicle.make, Model: vehicle.model, Institution: vehicle.institution, Driver: vehicle.assignedDriver, Mileage: vehicle.currentMileage, Status: vehicle.status }));
  const headers = Object.keys(rows[0] ?? { Message: "No records" });

  async function exportCsv() {
    await fetch(`/api/fleet/reports?report=${report}`);
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(String((row as Record<string, unknown>)[header] ?? ""))).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `igamis-${report}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Fleet report export logged and downloaded.");
  }

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Fleet reports</CardTitle>
          <CardDescription>Date and institution filtered operational reports with CSV and Excel-ready export.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="secondary" onClick={exportCsv}><FileSpreadsheet className="h-4 w-4" /> Excel-ready</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <label className="space-y-1.5 text-sm font-semibold"><Filter className="inline h-4 w-4" /> Report<Select value={report} onChange={(event) => setReport(event.target.value as typeof report)}>{reportOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
          <label className="space-y-1.5 text-sm font-semibold">Institution<Select value={institution} onChange={(event) => setInstitution(event.target.value)}><option value="">All institutions</option>{institutions.map((item) => <option key={item}>{item}</option>)}</Select></label>
          <label className="space-y-1.5 text-sm font-semibold">From<Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
          <label className="space-y-1.5 text-sm font-semibold">To<Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        </div>
        <div className="mb-4 rounded-lg border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700">PDF export placeholder</div>
        <div className="overflow-x-auto">
          <Table>
            <THead><TR>{headers.map((header) => <TH key={header}>{header}</TH>)}</TR></THead>
            <TBody>
              {rows.length ? rows.map((row, index) => <TR key={index}>{headers.map((header) => <TD key={header}>{String((row as Record<string, unknown>)[header] ?? "")}</TD>)}</TR>) : <TR><TD>No records found</TD></TR>}
            </TBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
