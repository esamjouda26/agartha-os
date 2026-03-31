"use client";

/**
 * CrewModal — a portal-style bottom-sheet that respects the sidebar on desktop.
 *
 * On mobile: full-width bottom sheet (the classic pattern).
 * On desktop (md+): the backdrop starts at left-72 (288px = w-72 sidebar),
 *   so the sheet never bleeds into the sidebar column.
 *
 * Usage:
 *   <CrewModal open={showModal} onClose={() => setShowModal(false)} title="New Request">
 *     {content}
 *   </CrewModal>
 */

import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Override max content height (default 80vh) */
  maxHeight?: string;
};

export default function CrewModal({ open, onClose, title, children, maxHeight = "80vh" }: Props) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — starts after sidebar on desktop */}
      <div
        className="fixed inset-0 md:left-72 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end"
        onClick={onClose}
      >
        {/* Sheet — stop propagation so clicking inside doesn't close */}
        <div
          className="bg-[#0a0a0a] border-t border-white/10 rounded-t-3xl flex flex-col w-full"
          style={{ maxHeight }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle + header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 flex-shrink-0">
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-10 h-1 bg-white/20 rounded-full" />
            <h3 className="text-base font-cinzel text-[#d4af37] font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white transition rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
