import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createFleetVehicle, listFleetVehicles, logFleetExport } from "@/lib/fleet-repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const url = new URL(request.url);
  const vehicles = await listFleetVehicles(user);
  if (url.searchParams.get("export")) {
    await logFleetExport(user, url.searchParams.get("export") ?? "fleet-register", vehicles.length);
  }
  return NextResponse.json({ data: vehicles });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const vehicle = await createFleetVehicle(body, user);
    return NextResponse.json({ data: vehicle }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
