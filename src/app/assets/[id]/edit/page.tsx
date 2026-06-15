import { notFound } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { PageFrame, PageTitle } from "@/components/page-frame";
import { requireUser } from "@/lib/auth";
import { getAssetFormValues, getAssetLookups } from "@/lib/repository";

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [lookups, initialValues] = await Promise.all([getAssetLookups(user), getAssetFormValues(id, user)]);
  if (!initialValues) notFound();

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Asset master registry"
        title="Edit asset"
        description="Update asset custody, value, condition, location, lifecycle and assignment details with audit logging."
      />
      <AssetForm mode="edit" assetId={id} lookups={lookups} initialValues={initialValues} />
    </PageFrame>
  );
}
