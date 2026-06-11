import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppRail } from "@/components/app-rail";
import { AppTopbar } from "@/components/app-topbar";
import { AUTH_COOKIE, accountById } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const uid = (await cookies()).get(AUTH_COOKIE)?.value;
  const user = accountById(uid);
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh bg-[#0e1b34]">
      <AppRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar user={user} />
        <main className="dark flex flex-1 flex-col gap-5 rounded-tl-[1.75rem] bg-background p-4 text-foreground md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
