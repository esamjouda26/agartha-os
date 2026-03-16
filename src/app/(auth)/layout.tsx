import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Login — AgarthaOS",
  description: "Unified staff authentication portal for Agartha World operations.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
