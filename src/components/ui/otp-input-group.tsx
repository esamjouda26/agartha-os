"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface OTPInputGroupProps {
  length?: number;
  onComplete?: (code: string) => void;
  className?: string;
}

export function OTPInputGroup({ length = 6, onComplete, className }: OTPInputGroupProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(length).fill(null));

  useEffect(() => {
    // Focus first input on mount if not in design/sandbox mode
    // (Omitted autoFocus strictly here so sandbox doesn't steal focus on load)
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newValues = [...values];
    
    // Handle pasting multiple digits
    if (value.length > 1) {
      const pastedDigits = value.slice(0, length - index).split("");
      for (let i = 0; i < pastedDigits.length; i++) {
        newValues[index + i] = pastedDigits[i];
      }
      setValues(newValues);
      
      const nextIndex = Math.min(index + pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      
      if (newValues.every(v => v !== "") && onComplete) {
        onComplete(newValues.join(""));
      }
      return;
    }

    newValues[index] = value;
    setValues(newValues);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newValues.every(v => v !== "") && onComplete) {
      onComplete(newValues.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      {values.map((v, i) => (
        <Input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={length}
          value={v}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-14 h-16 text-center text-2xl font-bold bg-white text-yellow-700 dark:bg-black/60 dark:text-[#d4af37] border-gray-300 dark:border-white/20 focus:border-[#d4af37] shadow-inner font-orbitron"
          style={{ fontFamily: "var(--font-orbitron, Orbitron, sans-serif)" }}
        />
      ))}
    </div>
  );
}
