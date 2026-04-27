import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getHousingOperationalData, logHousingExport } from "@/lib/housing-repository";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const report = new URL(request.url).searchParams.get("report") ?? "property-register";
  const data = await getHousingOperationalData(user);
  const payload = {
    "property-register": data.properties,
    occupancy: data.properties.filter((item) => item.occupancyStatus === "OCCUPIED"),
    vacant: data.properties.filter((item) => item.occupancyStatus === "VACANT"),
    maintenance: data.maintenance,
    allocations: data.allocations,
    projects: data.projects,
    condition: data.properties.filter((item) => ["Poor", "Critical"].includes(item.condition)),
  }[report] ?? data.properties;
  await logHousingExport(user, report, payload.length);
  return NextResponse.json({ data: payload });
}
