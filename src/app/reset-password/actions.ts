"use server";

import { z } from "zod";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase";

const schema = z.object({
  password: z.string().min(8),
});

export async function resetPasswordAction(_: unknown, formData: FormData) {
  const parsed = schema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { ok: false, message: "Password must be at least 8 characters." };

  if (!hasSupabaseConfig()) {
    return { ok: true, message: "Password reset structure is ready. Configure Supabase to activate delivery." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "Password updated. You can sign in with your new password." };
}
