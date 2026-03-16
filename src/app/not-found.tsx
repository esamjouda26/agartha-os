import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="glass rounded-xl p-12 text-center max-w-md">
        <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground text-sm mb-8">
          The route you requested does not exist in AgarthaOS.
          If you believe this is an error, contact your system administrator.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium transition-all hover:opacity-90 hover:scale-[1.02]"
          >
            Return Home
          </Link>
          <Link
            href="/guest/booking"
            className="inline-block rounded-lg border border-border px-6 py-3 text-muted-foreground font-medium transition-all hover:bg-muted hover:text-foreground"
          >
            Guest Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
