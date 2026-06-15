import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { archiveHousingProperty, getHousingProperty, updateHousingProperty } from "@/lib/housing-repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await params;
  const property = await getHousingProperty(id, user);
  if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 });
  return NextResponse.json({ data: property });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const property = await updateHousingProperty(id, await request.json(), user);
    return NextResponse.json({ data: property });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const property = await archiveHousingProperty(id, user);
    return NextResponse.json({ data: property });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
