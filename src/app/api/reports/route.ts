import { NextResponse } from "next/server";
import { getNationalMetrics, listAssets } from "@/lib/repository";

export async function GET() {
  const [assets, metrics] = await Promise.all([listAssets(), getNationalMetrics()]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    reports: {
      nationalSummary: metrics,
      assetRegisterByMinistry: assets,
      disposalCandidates: assets.filter((asset) => asset.status === "DUE_DISPOSAL"),
      missingAssets: assets.filter((asset) => asset.status === "MISSING"),
      ictReplacement: assets.filter((asset) => asset.category === "ICT Equipment"),
    },
  });
}
