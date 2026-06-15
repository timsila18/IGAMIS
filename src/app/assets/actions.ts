"use server";

import { revalidatePath } from "next/cache";
import { createAssetFromForm } from "@/lib/repository";

export async function createAssetAction(_: unknown, formData: FormData) {
  await createAssetFromForm(formData);
  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return { ok: true, message: "Asset registered and QR code reserved." };
}
