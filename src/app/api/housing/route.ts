import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createHousingProperty, listHousingProperties, logHousingExport } from "@/lib/housing-repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const url = new URL(request.url);
  const properties = await listHousingProperties(user);
  if (url.searchParams.get("export")) await logHousingExport(user, url.searchParams.get("export") ?? "property-register", properties.length);
  return NextResponse.json({ data: properties });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const property = await createHousingProperty(body, user);
    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
