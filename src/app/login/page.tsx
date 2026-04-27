import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { loginFormAction } from "@/lib/auth";
import { demoUsers, roles } from "@/data/demo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative flex flex-col justify-between overflow-hidden border-r border-white/10 p-6 sm:p-10">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_10%,#0f7a4f_0,transparent_28%),linear-gradient(135deg,#02140d,#050505_55%,#1d1704)]" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg border border-[#d9bd59]/50 bg-black">
              <ShieldCheck className="h-7 w-7 text-[#d9bd59]" />
            </div>
            <div>
              <div className="text-2xl font-black">IGAMIS</div>
              <div className="text-sm text-white/60">Managed by The National Treasury</div>
            </div>
          </div>
          <div className="relative max-w-3xl py-16">
            <Badge tone="gold">Government of Kenya</Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-normal sm:text-6xl">
              Integrated Government Asset Management Information System
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              A secure national platform to register, track, audit, maintain, transfer, depreciate and dispose public assets across MDAs, state corporations and future county governments.
            </p>
          </div>
          <div className="relative grid gap-3 text-sm text-white/70 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">RBAC and MFA-ready access</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Prisma and PostgreSQL system of record</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">Supabase Auth and secure storage hooks</div>
          </div>
        </section>
        <section className="flex items-center justify-center bg-neutral-50 p-6 text-neutral-950 dark:bg-black dark:text-white">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Secure sign in</CardTitle>
              <CardDescription>Email/password access with Supabase Auth integration and seeded demo fallback.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={loginFormAction} className="space-y-4">
                <Input name="email" type="email" defaultValue="treasury.admin@igamis.go.ke" required />
                <Input name="password" type="password" defaultValue="IGAMIS@2026" required />
                <Button className="w-full">Sign in to IGAMIS</Button>
              </form>
              <Link href="/forgot-password" className="mt-3 block text-sm font-semibold text-emerald-800">
                Forgot password?
              </Link>
              <div className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="mb-3 text-sm font-semibold">Demo accounts</div>
                <div className="space-y-2">
                  {demoUsers.map((user) => (
                    <div key={user.email} className="text-xs">
                      <div className="font-semibold">{user.email}</div>
                      <div className="text-neutral-500">{roles[user.role].name} - password `IGAMIS@2026`</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
