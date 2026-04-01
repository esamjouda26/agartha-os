"use client";

import { useState, useRef, useEffect } from "react";
import { SearchInput } from "../ui/search-input";
import { Package, ScanBarcode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface Item {
  id: string;
  name: string;
  barcode: string;
  stock: number;
}

interface ItemGroup {
  category: string;
  items: Item[];
}

const mockGroups: ItemGroup[] = [
  {
    category: "Food & Beverage",
    items: [
      { id: "1", name: "Premium Coffee Beans", barcode: "8901234567", stock: 120 },
      { id: "3", name: "Sparkling Water Case", barcode: "4455667788", stock: 45 },
    ]
  },
  {
    category: "Retail / Apparel",
    items: [
      { id: "2", name: "Crew Uniform Polo Medium", barcode: "1234567890", stock: 15 },
    ]
  },
  {
    category: "Hardware / Devices",
    items: [
      { id: "4", name: "Handheld Scanner Z3", barcode: "1122334455", stock: 8 },
      { id: "5", name: "Printer Label Roll", barcode: "9988776655", stock: 200 },
    ]
  }
];

export function ItemSearchSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const flattenedItems = mockGroups.flatMap(g => 
    g.items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.barcode.includes(search)
    ).map(item => ({ ...item, category: g.category }))
  );

  useEffect(() => {
    setActiveIndex(-1); // reset active index on search
  }, [search, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < flattenedItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flattenedItems.length) {
        handleSelect(flattenedItems[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: Item) => {
    setSearch(item.name);
    setIsOpen(false);
  };

  // Group the filtered items back into categories for rendering
  const filteredGroups = mockGroups.map(g => ({
    category: g.category,
    items: g.items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.barcode.includes(search)
    )
  })).filter(g => g.items.length > 0);

  let mappedIndex = -1; // to keep track of absolute index across groups

  return (
    <div className="relative w-full max-w-sm" ref={containerRef} onKeyDown={handleKeyDown}>
      <div className="flex gap-2">
        <div className="flex-1" onClick={() => setIsOpen(true)}>
          <SearchInput 
            placeholder="Search item or scan barcode..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="gold" size="icon">
          <ScanBarcode className="h-5 w-5" />
        </Button>
      </div>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className={cn(
            "absolute z-50 mt-1 w-full rounded-md shadow-xl overflow-hidden origin-top transition-all duration-200",
            "bg-white border border-gray-200",
            "dark:bg-[#0d0d0d] dark:border-white/10 dark:shadow-2xl"
          )}
        >
          {filteredGroups.length > 0 ? (
            <div className="max-h-60 overflow-y-auto block relative">
              {filteredGroups.map(group => (
                <div key={group.category} className="pb-1">
                  <div className="sticky top-0 z-10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 bg-gray-100 border-y border-gray-200 dark:border-white/5 dark:bg-[#0d0d0d]">
                    {group.category}
                  </div>
                  {group.items.map(item => {
                    mappedIndex++;
                    const isActive = activeIndex === mappedIndex;
                    return (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex items-center p-3 cursor-pointer transition-colors border-b border-transparent last:border-0",
                          isActive ? "bg-gray-100 dark:bg-white/10" : "hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setActiveIndex(mappedIndex)}
                      >
                        <Package className={cn(
                          "h-8 w-8 p-1.5 rounded mr-3",
                          "bg-gray-100 text-gray-400 dark:bg-white/5"
                        )} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-0.5">{item.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{item.barcode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-yellow-700 dark:text-[#d4af37]">{item.stock} left</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-500 flex flex-col items-center">
              <Package className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p>No items found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
