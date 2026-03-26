"use client";

import { usePathname } from "next/navigation";

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return <div className="p-4 md:p-6 w-full max-w-[1700px] mx-auto transition-all">{children}</div>;
}
