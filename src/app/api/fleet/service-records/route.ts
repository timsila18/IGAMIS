import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addServiceRecord, getFleetOperationalData } from "@/lib/fleet-repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET() {
  const user = await getSessionUser();
  const data = await getFleetOperationalData(user);
  return NextResponse.json({ data: data.serviceRecords });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const record = await addServiceRecord(body, user);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
