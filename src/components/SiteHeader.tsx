import Link from "next/link";

export function SiteHeader({ admin = false }: { admin?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[rgba(10,17,32,0.72)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue to-cyan font-display text-sm font-extrabold text-white">
            G
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            GWS<span className="text-cyan">Connect</span>
          </span>
          <span className="ml-1 hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:inline">
            Instant Quote
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {admin ? (
            <Link href="/" className="text-muted hover:text-text">
              ← Storefront
            </Link>
          ) : (
            <Link href="/admin" className="text-muted hover:text-text">
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
