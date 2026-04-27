import { type NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/forgot-password", "/reset-password", "/auth/callback", "/unauthorized"];

const routePermissions: Record<string, string> = {
  "/dashboard": "dashboard:view",
  "/dashboard/national": "dashboard:national",
  "/dashboard/institution": "dashboard:view",
  "/dashboard/my-assets": "self:view",
  "/assets": "assets:view",
  "/fleet": "fleet:view",
  "/housing": "housing:view",
  "/furniture": "assets:view",
  "/ict": "ict:view",
  "/stores": "stores:view",
  "/quartermaster": "stores:view",
  "/maintenance": "maintenance:create",
  "/transfers": "transfers:create",
  "/disposals": "disposals:view",
  "/audit": "audit:view",
  "/reports": "reports:view",
};

function decodeSession(value?: string) {
  if (!value) return null;
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as { permissions?: string[] };
  } catch {
    return null;
  }
}

function hasPermission(permissions: string[], permission: string) {
  return permissions.includes("*") || permissions.includes(permission) || permissions.some((item) => item.endsWith(":*") && permission.startsWith(item.slice(0, -1)));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const session = decodeSession(request.cookies.get("igamis_session")?.value);
  const hasSupabaseCookie = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));

  if (!session && !hasSupabaseCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const route = Object.keys(routePermissions)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (session && route && !hasPermission(session.permissions ?? [], routePermissions[route])) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
