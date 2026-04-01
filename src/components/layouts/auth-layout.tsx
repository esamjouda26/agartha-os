import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] dark:from-yellow-900/20 dark:via-black dark:to-black text-gray-900 dark:text-white relative h-full transition-colors">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 dark:opacity-20 pointer-events-none"></div>

      <div className="z-10 w-full max-w-md bg-white/70 backdrop-blur-xl border border-gray-200 p-8 pt-10 rounded-2xl shadow-xl relative overflow-hidden dark:bg-black/60 dark:border-white/10 dark:shadow-2xl">
        {/* Decorative corner glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500 dark:bg-[#d4af37] opacity-[0.1] dark:opacity-[0.15] blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col items-center mb-8 space-y-2 text-center">
          <div className="h-16 w-16 bg-gray-50 border border-gray-200 flex items-center justify-center rounded-2xl mb-4 shadow-inner ring-1 ring-yellow-500/10 dark:bg-black/50 dark:border-white/10 dark:ring-[#d4af37]/30">
            <Layers className="h-8 w-8 text-yellow-700 dark:text-[#d4af37]" />
          </div>
          <h1 className="text-2xl font-cinzel font-bold tracking-wider uppercase text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-xs uppercase text-gray-500 tracking-widest font-bold">{subtitle}</p>}
        </div>

        {children}

        <div className="mt-8 text-center border-t border-gray-200 dark:border-white/10 pt-6">
          <p className="text-[10px] text-gray-500 dark:text-gray-600 uppercase tracking-widest">
            Protected by AgarthaOS Security
          </p>
        </div>
      </div>
    </div>
  );
}
