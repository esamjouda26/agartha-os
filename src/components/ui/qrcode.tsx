import { cn } from "@/lib/utils";
import { QrCode as QrCodeIcon } from "lucide-react";

export interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCode({ value, size = 120, className }: QrCodeProps) {
  // A mock QR code renderer. Since we cannot install a full QR package per instructions,
  // we will render a stylized placeholder that mimics a QR code pattern or just uses the lucide icon.
  return (
    <div
      className={cn(
        "bg-white p-3 rounded-lg flex items-center justify-center relative",
        className
      )}
      style={{ width: size, height: size }}
      title={value}
    >
      <div className="absolute inset-2 border-4 border-black border-dashed opacity-20"></div>
      <QrCodeIcon className="text-black w-1/2 h-1/2 opacity-80" />
    </div>
  );
}
