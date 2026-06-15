import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAsset, listAssets, logAssetExport } from "@/lib/repository";
import { formatDatabaseError } from "@/lib/db-errors";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const url = new URL(request.url);
  const assets = await listAssets(user);

  if (url.searchParams.get("export") === "csv") {
    await logAssetExport(user, assets.length);
  }

  return NextResponse.json({ data: assets });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const asset = await createAsset(body, user);
    return NextResponse.json({ data: asset }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: formatDatabaseError(error) }, { status: 400 });
  }
}
