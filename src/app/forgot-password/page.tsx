import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-form-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { forgotPasswordAction } from "@/app/forgot-password/actions";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 p-6 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Send a Supabase Auth password reset link to a registered government email.</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm action={forgotPasswordAction} />
          <Link href="/login" className="mt-4 block text-sm font-semibold text-emerald-800">Back to login</Link>
        </CardContent>
      </Card>
    </main>
  );
}
