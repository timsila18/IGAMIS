import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { archiveAsset, getAssetById, updateAsset } from "@/lib/repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await params;
  const result = await getAssetById(id, user);
  if (!result) return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  return NextResponse.json({ data: result.asset, qrSvg: result.qrSvg });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const body = await request.json();
    const asset = await updateAsset(id, body, user);
    return NextResponse.json({ data: asset });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    await archiveAsset(id, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
