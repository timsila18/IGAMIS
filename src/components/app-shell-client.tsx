"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  Bell,
  Building2,
  Car,
  ChevronLeft,
  ClipboardCheck,
  Database,
  Gavel,
  Home,
  Laptop,
  Menu,
  Package,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { roles, type RoleKey } from "@/data/demo";
import { type SessionUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileMenu } from "@/components/profile-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3, permission: "dashboard:view" },
  { href: "/dashboard/national", label: "National Treasury", icon: ShieldCheck, permission: "dashboard:national" },
  { href: "/dashboard/institution", label: "Institution Dashboard", icon: Building2, permission: "dashboard:view" },
  { href: "/dashboard/my-assets", label: "My Assets", icon: Home, permission: "self:view" },
  { href: "/assets", label: "Asset Registry", icon: Database, permission: "assets:view" },
  { href: "/fleet", label: "Fleet", icon: Car, permission: "fleet:view" },
  { href: "/housing", label: "Housing & Premises", icon: Building2, permission: "housing:view" },
  { href: "/furniture", label: "Furniture & Equipment", icon: Home, permission: "assets:view" },
  { href: "/ict", label: "ICT Assets", icon: Laptop, permission: "ict:view" },
  { href: "/stores", label: "Stores", icon: Package, permission: "stores:view" },
  { href: "/quartermaster", label: "Quartermaster", icon: ShieldCheck, permission: "stores:view" },
  { href: "/maintenance", label: "Maintenance", icon: Wrench, permission: "maintenance:create" },
  { href: "/transfers", label: "Transfers", icon: Archive, permission: "transfers:create" },
  { href: "/disposals", label: "Disposals", icon: Gavel, permission: "disposals:view" },
  { href: "/audit", label: "Audit", icon: ClipboardCheck, permission: "audit:view" },
  { href: "/reports", label: "Reports", icon: ShieldCheck, permission: "reports:view" },
];

function isAllowed(user: SessionUser, permission: string) {
  return user.permissions.includes("*") || user.permissions.includes(permission) || user.permissions.some((item) => item.endsWith(":*") && permission.startsWith(item.slice(0, -1)));
}

export function AppShellClient({
  children,
  user,
  logoutAction,
}: {
  children: React.ReactNode;
  user: SessionUser;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNav = useMemo(() => nav.filter((item) => isAllowed(user, item.permission)), [user]);
  const width = collapsed ? "lg:w-20" : "lg:w-72";

  const sidebar = (
    <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-neutral-200 bg-white transition dark:border-neutral-900 dark:bg-neutral-950 ${width}`}>
      <div className="flex h-20 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-900">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#c8a640]/50 bg-emerald-950 text-[#d9bd59]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="text-lg font-black tracking-normal">IGAMIS</div>
              <div className="truncate text-xs font-medium text-neutral-500">The National Treasury</div>
            </div>
          ) : null}
        </Link>
        <Button type="button" variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={() => setCollapsed((value) => !value)} aria-label="Collapse sidebar">
          <ChevronLeft className={`h-4 w-4 transition ${collapsed ? "rotate-180" : ""}`} />
        </Button>
      </div>
      <nav className="space-y-1 p-3">
        {visibleNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-emerald-950 text-white"
                  : "text-neutral-700 hover:bg-emerald-950 hover:text-white dark:text-neutral-300"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
      {!collapsed ? (
        <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 p-4 dark:border-neutral-900">
          <div className="rounded-lg bg-neutral-950 p-4 text-white">
            <div className="text-xs uppercase text-[#d9bd59]">Security posture</div>
            <div className="mt-1 text-sm font-semibold">MFA-ready RBAC active</div>
            <div className="mt-2 h-1.5 rounded-full bg-white/15">
              <div className="h-1.5 w-4/5 rounded-full bg-[#d9bd59]" />
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950 dark:bg-black dark:text-neutral-50">
      <div className="hidden lg:block">{sidebar}</div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          {sidebar}
        </div>
      ) : null}

      <div className={collapsed ? "lg:pl-20" : "lg:pl-72"}>
        <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur dark:border-neutral-900 dark:bg-black/80 sm:px-6">
          <Button variant="secondary" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <ShieldCheck className="h-5 w-5 text-emerald-800" />
            <span className="font-black">IGAMIS</span>
          </Link>
          <div className="relative hidden flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              className="h-10 w-full max-w-xl rounded-md border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-sm outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/20 dark:border-neutral-800 dark:bg-neutral-950"
              placeholder="Search assets, registration numbers, payroll numbers, locations..."
            />
          </div>
          <div className="hidden gap-2 xl:flex">
            <Badge tone="gold">{roles[user.role as RoleKey]?.name ?? user.role}</Badge>
            <Badge tone="green">{user.institution}</Badge>
          </div>
          <ThemeToggle />
          <Button variant="secondary" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <ProfileMenu user={user} logoutAction={logoutAction} />
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
