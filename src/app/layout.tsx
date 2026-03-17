import type { Metadata } from "next";
import { Inter, Cinzel, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgarthaOS — Operational Platform",
  description:
    "Globally unified operational platform for Agartha World. Manage the complete guest lifecycle, inventory, F&B operations, maintenance, and staff administration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${cinzel.variable} ${orbitron.variable} font-inter antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
