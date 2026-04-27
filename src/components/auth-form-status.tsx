"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm({
  action,
}: {
  action: (state: unknown, formData: FormData) => Promise<{ ok: boolean; message: string }>;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: "" });

  return (
    <form action={formAction} className="space-y-4">
      <Input name="email" type="email" placeholder="name@agency.go.ke" required />
      <Button className="w-full" disabled={pending}>{pending ? "Sending..." : "Send reset link"}</Button>
      {state.message ? <p className="text-sm text-neutral-600 dark:text-neutral-300">{state.message}</p> : null}
    </form>
  );
}

export function ResetPasswordForm({
  action,
}: {
  action: (state: unknown, formData: FormData) => Promise<{ ok: boolean; message: string }>;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: "" });

  return (
    <form action={formAction} className="space-y-4">
      <Input name="password" type="password" placeholder="New password" minLength={8} required />
      <Button className="w-full" disabled={pending}>{pending ? "Updating..." : "Reset password"}</Button>
      {state.message ? <p className="text-sm text-neutral-600 dark:text-neutral-300">{state.message}</p> : null}
    </form>
  );
}
