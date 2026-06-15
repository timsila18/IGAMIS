import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addHousingAllocation, getHousingOperationalData } from "@/lib/housing-repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET() {
  const user = await getSessionUser();
  const data = await getHousingOperationalData(user);
  return NextResponse.json({ data: data.allocations });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const allocation = await addHousingAllocation(await request.json(), user);
    return NextResponse.json({ data: allocation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
