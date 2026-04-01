import { ToastProvider } from "@/components/shared/toast-provider";

export const metadata = {
  title: "AgarthaOS Sandbox",
  description: "Atomic Design Component Library Sandbox",
};

export default function SandboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-black text-white font-inter">
        {children}
      </div>
    </ToastProvider>
  );
}
