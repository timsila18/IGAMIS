import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addFuelLog, getFleetOperationalData } from "@/lib/fleet-repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET() {
  const user = await getSessionUser();
  const data = await getFleetOperationalData(user);
  return NextResponse.json({ data: data.fuelLogs });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const log = await addFuelLog(body, user);
    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
