import type { Metadata } from "next";

import { LoginPanel } from "@/components/login-panel";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center p-4 py-10">
      {/* scenic backdrop (sky → horizon → land), evoking Santa Cruz's coast and capitol grounds */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-sky-600 via-sky-300 to-emerald-100" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(125%_120%_at_50%_0%,rgba(255,255,255,0.65),transparent_55%)]" />
      <LoginPanel />
    </div>
  );
}
