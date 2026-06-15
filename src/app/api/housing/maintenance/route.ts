import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addHousingMaintenance, getHousingOperationalData } from "@/lib/housing-repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET() {
  const user = await getSessionUser();
  const data = await getHousingOperationalData(user);
  return NextResponse.json({ data: data.maintenance });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const maintenance = await addHousingMaintenance(await request.json(), user);
    return NextResponse.json({ data: maintenance }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
