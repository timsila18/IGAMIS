"use client";

import { useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { type SessionUser } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ProfileMenu({
  user,
  logoutAction,
}: {
  user: SessionUser;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        className="flex items-center gap-3 border-l border-neutral-200 pl-4 text-left dark:border-neutral-800"
        onClick={() => setOpen((value) => !value)}
      >
        <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-950 text-sm font-black text-[#d9bd59]">
          {initials(user.name)}
        </div>
        <div className="max-w-48">
          <div className="truncate text-sm font-semibold">{user.name}</div>
          <div className="truncate text-xs text-neutral-500">{user.institution}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-neutral-500" />
      </button>
      {open ? (
        <div className="absolute right-0 mt-3 w-72 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-950">
          <div className="rounded-md px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold"><UserRound className="h-4 w-4" /> {user.name}</div>
            <div className="mt-1 text-xs text-neutral-500">{user.email}</div>
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" className="w-full justify-start">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
