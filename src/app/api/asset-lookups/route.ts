import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAssetLookups } from "@/lib/repository";

export async function GET() {
  const user = await getSessionUser();
  const lookups = await getAssetLookups(user);
  return NextResponse.json({ data: lookups });
}
