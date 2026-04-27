import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getFleetOperationalData, logFleetExport } from "@/lib/fleet-repository";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const url = new URL(request.url);
  const data = await getFleetOperationalData(user);
  const report = url.searchParams.get("report") ?? "fleet-register";
  const payload = {
    "fleet-register": data.vehicles,
    "fuel-consumption": data.fuelLogs,
    "service-cost": data.serviceRecords,
    "insurance-expiry": data.insuranceRecords,
    accidents: data.accidentLogs,
    disposal: data.vehicles.filter((vehicle) => vehicle.disposalRecommendation !== "Not due"),
  }[report] ?? data.vehicles;
  await logFleetExport(user, report, payload.length);
  return NextResponse.json({ data: payload });
}
