import { AssetRegistry } from "@/components/asset-registry";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { listAssets } from "@/lib/repository";

export default async function AssetsPage() {
  const user = await requireUser();
  const assets = await listAssets(user);

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Asset master registry"
        title="Universal asset register"
        description="Register and manage vehicles, buildings, housing, furniture, ICT equipment, machinery, uniforms, land, stores and other public assets."
      />
      <AssetRegistry assets={assets} user={user} />
    </PageFrame>
  );
}
