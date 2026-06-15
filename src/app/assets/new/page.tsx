import { AssetForm } from "@/components/asset-form";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { getAssetLookups } from "@/lib/repository";

export default async function NewAssetPage() {
  const user = await requireUser();
  const lookups = await getAssetLookups(user);

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Asset master registry"
        title="Register new asset"
        description="Create a persistent asset record with generated IGAMIS code, QR payload, assignment, lifecycle and audit history."
      />
      <AssetForm mode="create" lookups={lookups} />
    </PageFrame>
  );
}
