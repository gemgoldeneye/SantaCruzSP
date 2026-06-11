"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";

import { AUTH_COOKIE, roleBadge, type DemoAccount } from "@/lib/auth";
import { activeNavItem } from "@/lib/navigation";

function initials(name: string) {
  const parts = name
    .replace(/^Hon\.\s*/i, "")
    .trim()
    .split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AppTopbar({ user }: { user: DemoAccount }) {
  const pathname = usePathname();
  const title = pathname.startsWith("/documents")
    ? "Document"
    : activeNavItem(pathname).title;

  const signOut = () => {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
    window.location.href = "/login";
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 bg-[#0e1b34] px-4 text-white sm:px-6">
      <h1 className="min-w-0 truncate font-heading text-lg font-semibold sm:text-2xl">
        {title}
      </h1>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Link
          href="/search"
          title="Search the e-library"
          className="hidden rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:block"
        >
          <Search className="size-4" />
        </Link>
        <button
          type="button"
          title="Notifications"
          className="hidden rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:block"
        >
          <Bell className="size-4" />
        </button>
        <div className="ml-1 hidden text-right leading-tight sm:block">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-white/60">{roleBadge(user.role)}</div>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
          {initials(user.name)}
        </div>
        <button
          type="button"
          onClick={signOut}
          title="Sign out"
          className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  );
}
