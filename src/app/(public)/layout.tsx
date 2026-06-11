import Image from "next/image";
import Link from "next/link";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image
              src="/santa-cruz-seal.png"
              alt="Seal of the Municipality of Santa Cruz"
              width={36}
              height={36}
              className="rounded-sm"
            />
            <div className="leading-tight">
              <div className="font-heading text-sm font-semibold">
                Santa Cruz Sanggunian Portal
              </div>
              <div className="text-xs text-muted-foreground">
                Sangguniang Bayan ng Santa Cruz
              </div>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            Staff sign-in
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Santa Cruz Sanggunian · Municipality of Santa Cruz, Zambales · Demo with sample data
      </footer>
    </div>
  );
}
