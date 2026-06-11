"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { activeNavItem } from "@/lib/navigation";
import { AUTH_COOKIE, roleBadge, type DemoAccount } from "@/lib/auth";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AppHeader({ user }: { user: DemoAccount }) {
  const pathname = usePathname();
  const current = activeNavItem(pathname);
  const isHome = current.href === "/";

  const signOut = () => {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator
        orientation="vertical"
        className="mr-1 shrink-0 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="hidden sm:block">
            <BreadcrumbLink render={<Link href="/" />}>Santa Cruz Sanggunian</BreadcrumbLink>
          </BreadcrumbItem>
          {!isHome && <BreadcrumbSeparator className="hidden sm:block" />}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{current.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div className="hidden text-right leading-tight sm:block">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.roleLabel}</div>
        </div>
        <Badge
          variant={user.role === "presiding_officer" ? "default" : "secondary"}
          className="hidden md:inline-flex"
        >
          {roleBadge(user.role)}
        </Badge>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
