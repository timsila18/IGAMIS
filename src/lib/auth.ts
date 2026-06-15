import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { demoUsers, roles, type DemoUser, type RoleKey } from "@/data/demo";
import { getPrisma, hasDatabaseUrl } from "@/lib/prisma";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase";

export type SessionUser = Omit<DemoUser, "password"> & {
  permissions: string[];
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const cookieName = "igamis_session";

export function can(role: RoleKey, permission: string) {
  const granted = roles[role]?.permissions ?? [];
  return granted.includes("*") || granted.includes(permission) || granted.some((item) => item.endsWith(":*") && permission.startsWith(item.slice(0, -1)));
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const encoded = cookieStore.get(cookieName)?.value;

  if (encoded) {
    try {
      const user = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionUser;
      return user;
    } catch {
      cookieStore.delete(cookieName);
    }
  }

  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) {
      if (hasDatabaseUrl()) {
        const prisma = getPrisma();
        const dbUser = await prisma.user.findUnique({
          where: { email: data.user.email },
          include: {
            institution: true,
            primaryRole: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        });

        if (dbUser) {
          return {
            email: dbUser.email,
            name: dbUser.fullName,
            role: dbUser.primaryRole.key as RoleKey,
            institution: dbUser.institution?.name ?? "Government of Kenya",
            permissions: dbUser.primaryRole.key === "NATIONAL_TREASURY_SUPER_ADMIN"
              ? ["*"]
              : dbUser.primaryRole.permissions.map((item) => item.permission.key),
          };
        }
      }

      const matched = demoUsers.find((user) => user.email === data.user.email);
      const fallback = matched ?? demoUsers[0];
      return {
        email: data.user.email,
        name: data.user.user_metadata?.name ?? fallback.name,
        role: fallback.role,
        institution: fallback.institution,
        permissions: roles[fallback.role].permissions,
      };
    }
  }

  return null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function loginAction(_: unknown, formData: FormData) {
  "use server";

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Enter a valid government email and password." };
  }

  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (!error) redirect("/dashboard");
  }

  const demoUser = demoUsers.find(
    (user) => user.email.toLowerCase() === parsed.data.email.toLowerCase() && user.password === parsed.data.password,
  );

  if (!demoUser) {
    return { ok: false, message: "Invalid credentials. Use one of the seeded demo accounts." };
  }

  const session: SessionUser = {
    email: demoUser.email,
    name: demoUser.name,
    role: demoUser.role,
    institution: demoUser.institution,
    permissions: roles[demoUser.role].permissions,
  };

  const cookieStore = await cookies();
  cookieStore.set(cookieName, Buffer.from(JSON.stringify(session)).toString("base64url"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/dashboard");
}

export async function loginFormAction(formData: FormData) {
  "use server";
  await loginAction(null, formData);
}

export async function logoutAction() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);

  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
