import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl place-items-center px-6 py-24 text-center">
        <div>
          <div className="font-display text-5xl font-extrabold">404</div>
          <p className="mt-2 text-muted">
            That deal or page could not be found.
          </p>
          <Link href="/" className="btn-ghost mt-6 inline-block">
            ← Back to storefront
          </Link>
        </div>
      </main>
    </div>
  );
}
