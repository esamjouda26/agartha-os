"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ScanLine, X } from "lucide-react";

export interface SearchableItem {
  id: string;
  name: string;
  category: string;
  barcode?: string | null;
  price?: number;
  inStock?: boolean;
  image_url?: string | null;
  // Payload for generic usage
  raw?: any;
}

interface ItemSearchSelectProps {
  items: SearchableItem[];
  onSelect: (item: SearchableItem) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ItemSearchSelect({ items, onSelect, placeholder = "Search items...", disabled = false }: ItemSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter and Group
  const groupedItems = useMemo(() => {
    if (!items) return {};
    const filtered = items.filter(
      (item) => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        (item.barcode && item.barcode.includes(query))
    );

    const groups: Record<string, SearchableItem[]> = {};
    filtered.forEach((item) => {
      const cat = item.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [items, query]);

  function handleSelect(item: SearchableItem) {
    onSelect(item);
    setQuery("");
    setIsOpen(false);
  }

  // Formatting category strings safely
  const formatCatName = (str: string) => str.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            className="w-full bg-black/40 border border-white/10 p-3 pl-10 pr-10 rounded-xl text-white outline-none focus:border-[#d4af37] disabled:opacity-50" 
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={disabled}
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button 
          title="Scan Barcode"
          type="button"
          disabled={disabled}
          onClick={() => {
            // Placeholder: Call native bridge or scanner API
            alert("Camera scanner invoked: Hardware bridge required for production.");
          }}
          className="bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] p-3 rounded-xl flex items-center justify-center active:scale-95 transition disabled:opacity-50"
        >
          <ScanLine className="w-6 h-6" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 max-h-[350px] overflow-y-auto bg-space border border-[#d4af37]/30 rounded-xl shadow-2xl">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">No items found.</div>
          ) : (
            Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category} className="mb-2">
                <div className="sticky top-0 bg-space/90 backdrop-blur-md px-4 py-2 text-[10px] font-bold tracking-widest text-[#d4af37] uppercase border-y border-white/5">
                  {formatCatName(category)}
                </div>
                <ul className="py-1">
                  {catItems.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-3 transition flex justify-between items-center ${item.inStock !== false ? 'hover:bg-white/5 cursor-pointer' : 'opacity-50 cursor-not-allowed bg-black/40'}`}
                        onClick={() => {
                          if (item.inStock !== false) handleSelect(item);
                        }}
                        disabled={item.inStock === false}
                      >
                        <div>
                          <p className={`text-sm font-medium ${item.inStock !== false ? 'text-white' : 'text-gray-500 line-through'}`}>{item.name}</p>
                          {item.inStock === false && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-0.5">Out of Stock</p>}
                          {item.barcode && item.inStock !== false && <p className="text-[10px] text-gray-500 font-mono mt-0.5">BC: {item.barcode}</p>}
                        </div>
                        {item.price !== undefined && (
                          <span className={`font-mono text-sm ${item.inStock !== false ? 'text-[#d4af37]' : 'text-gray-600 line-through'}`}>${Number(item.price).toFixed(2)}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
