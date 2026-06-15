import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { archiveFleetVehicle, getFleetVehicle, updateFleetVehicle } from "@/lib/fleet-repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await params;
  const vehicle = await getFleetVehicle(id, user);
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
  return NextResponse.json({ data: vehicle });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const body = await request.json();
    const vehicle = await updateFleetVehicle(id, body, user);
    return NextResponse.json({ data: vehicle });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const vehicle = await archiveFleetVehicle(id, user);
    return NextResponse.json({ data: vehicle });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
