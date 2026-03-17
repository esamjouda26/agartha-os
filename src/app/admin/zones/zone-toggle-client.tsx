"use client";

import { useState, useTransition } from "react";
import { toggleZoneActiveAction } from "./actions";

export default function ZoneToggleClient({
  zoneId,
  isActive,
  zoneName,
}: {
  zoneId: string;
  isActive: boolean;
  zoneName: string;
}) {
  const [optimisticActive, setOptimisticActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !optimisticActive;
    setOptimisticActive(next);
    startTransition(async () => {
      const result = await toggleZoneActiveAction(zoneId, next);
      if (!result.success) {
        // Revert on failure
        setOptimisticActive(!next);
        alert(`Failed to update zone "${zoneName}": ${result.error}`);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={optimisticActive ? `Deactivate ${zoneName}` : `Activate ${zoneName}`}
      className={`relative inline-flex w-10 h-5 rounded-full border transition-colors focus:outline-none disabled:opacity-50
        ${optimisticActive
          ? "bg-[#d4af37] border-[rgba(212,175,55,0.6)]"
          : "bg-[#020408] border-white/10"
        }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
          ${optimisticActive ? "translate-x-5 left-0" : "translate-x-0 left-0.5"}`}
      />
    </button>
  );
}
