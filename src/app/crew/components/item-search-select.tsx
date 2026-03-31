"use client";

import { useState, useRef } from "react";
import { Search, Scan, ChevronDown, X } from "lucide-react";

export type SearchableItem = {
  id: string;
  name: string;
  price?: number | null;
  category?: string | null;
  raw?: Record<string, unknown>;
};

type Props = {
  items: SearchableItem[];
  onSelect: (item: SearchableItem) => void;
  placeholder?: string;
  disabled?: boolean;
  groupByField?: keyof SearchableItem;
  categoryLabels?: Record<string, string>;
};

export default function ItemSearchSelect({
  items,
  onSelect,
  placeholder = "Search items...",
  disabled = false,
  groupByField = "category",
  categoryLabels = {},
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  // Group results
  const grouped = new Map<string, SearchableItem[]>();
  filtered.forEach((item) => {
    const key = (item[groupByField] as string) ?? "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  });

  function handleSelect(item: SearchableItem) {
    onSelect(item);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-9 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:border-[#d4af37] focus:outline-none transition disabled:opacity-50"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {/* Barcode scan — hidden file input triggered by button */}
        <button
          type="button"
          onClick={() => barcodeRef.current?.click()}
          disabled={disabled}
          className="min-w-[44px] min-h-[44px] px-3 rounded-xl bg-black/40 border border-white/10 hover:border-[#d4af37]/50 transition-colors flex items-center justify-center disabled:opacity-50"
          title="Scan barcode"
        >
          <Scan className="text-gray-400" size={20} />
        </button>
        <input
          ref={barcodeRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={() => {
            // Production: decode barcode from image, match to items
            // For now: just opens camera — staff reads barcode manually
          }}
        />
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute z-40 top-full mt-1 w-full bg-[#0d0d0d] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {Array.from(grouped.entries()).map(([cat, catItems]) => (
            <div key={cat}>
              <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-gray-500 font-bold border-b border-white/5 sticky top-0 bg-[#0d0d0d]">
                {categoryLabels[cat] ?? cat.replace(/_/g, " ")}
              </div>
              {catItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={() => handleSelect(item)}
                  className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors min-h-[44px]"
                >
                  <span className="text-sm text-white">{item.name}</span>
                  {item.price != null && (
                    <span className="text-xs text-[#d4af37] font-mono ml-4 shrink-0">
                      RM {item.price.toFixed(2)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {open && (
        <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
