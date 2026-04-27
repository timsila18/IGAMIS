import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth-form-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPasswordAction } from "@/app/reset-password/actions";

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 p-6 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Complete the reset after opening a Supabase Auth recovery link.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm action={resetPasswordAction} />
          <Link href="/login" className="mt-4 block text-sm font-semibold text-emerald-800">Back to login</Link>
        </CardContent>
      </Card>
    </main>
  );
}
