"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppRail() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-svh w-16 shrink-0 flex-col items-center gap-2 bg-[#b51d2b] py-4 sm:w-20">
      <Link
        href="/"
        title="Santa Cruz Sanggunian"
        className="flex size-10 items-center justify-center rounded-xl bg-white p-1 shadow-sm"
      >
        <Image
          src="/santa-cruz-seal.png"
          alt="Santa Cruz Sanggunian"
          width={34}
          height={34}
        />
      </Link>

      <nav className="flex w-full flex-1 flex-col items-stretch gap-1 px-1.5 pt-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2.5 text-center text-[10px] leading-none font-medium transition-colors",
                active
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
