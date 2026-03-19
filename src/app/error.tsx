"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#0a0a0f] text-[#f0f0f5] font-sans antialiased">
          <div className="rounded-xl border border-[#2a2a3a] bg-[#12121a]/60 backdrop-blur-xl p-12 text-center max-w-md">
            <h1
              className="text-4xl font-bold mb-4"
              style={{
                background: "linear-gradient(135deg, #6c5ce7, #00cec9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Something Went Wrong
            </h1>
            <p className="text-[#8b8b9e] text-sm mb-6">
              An unexpected error occurred. Our team has been notified.
              Please try again or return to the home page.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={reset}
                className="rounded-lg bg-[#6c5ce7] px-6 py-3 text-white font-medium transition-all hover:opacity-90"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="rounded-lg border border-[#2a2a3a] px-6 py-3 text-[#8b8b9e] font-medium transition-all hover:bg-[#1a1a2a] hover:text-white"
              >
                Return Home
              </Link>
            </div>
          </div>
    </div>
  );
}
