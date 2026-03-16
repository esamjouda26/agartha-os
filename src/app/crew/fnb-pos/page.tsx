"use client";

import { useState, useEffect, useOptimistic, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchMenuItemsAction,
  completePosOrderAction,
  type PosOrderItem,
} from "../actions";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  status: string;
  unit_price: number;
  linked_product_id: string | null;
}

interface CartItem extends PosOrderItem {
  name: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  hot_food: "Hot Food",
  cold_food: "Cold Food",
  beverage: "Beverages",
  snack: "Snacks",
  dessert: "Desserts",
};

export default function FnbPosPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [orderResult, setOrderResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // L-2: Optimistic cart state — immediately reflects checkout
  const [optimisticCart, setOptimisticCart] = useOptimistic(
    cart,
    (_current: CartItem[], _action: "clear") => []
  );

  useEffect(() => {
    fetchMenuItemsAction().then(setMenuItems);
  }, []);

  const categories = ["all", ...Array.from(new Set(menuItems.map((i) => i.category)))];
  const filteredItems = activeCategory === "all" ? menuItems : menuItems.filter((i) => i.category === activeCategory);

  const cartTotal = optimisticCart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, unitPrice: item.unit_price }];
    });
  }

  function removeFromCart(menuItemId: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((c) =>
          c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
        );
      }
      return prev.filter((c) => c.menuItemId !== menuItemId);
    });
  }

  function handleCheckout() {
    if (cart.length === 0) return;
    setOrderResult(null);

    const currentCart = [...cart];
    startTransition(async () => {
      // L-2: Optimistically clear cart before server round-trip
      setOptimisticCart("clear");
      const result = await completePosOrderAction(currentCart);

      if (result.success) {
        setCart([]);
        setOrderResult({ success: true, message: `Order completed — $${result.data?.total_amount?.toFixed(2)}` });
        setTimeout(() => setOrderResult(null), 4000);
      } else {
        // Rollback: restore cart on failure
        setCart(currentCart);
        setOrderResult({ success: false, message: result.error ?? "Order failed" });
      }
    });
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-80px)]">
      {/* Menu Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">F&B Point of Sale</h1>
          <p className="text-muted-foreground text-sm mt-1">Tap items to add to order</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat] ?? cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
          {filteredItems.map((item) => {
            const inCart = cart.find((c) => c.menuItemId === item.id);
            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className={`p-4 rounded-lg border text-left transition-all hover:-translate-y-0.5 active:scale-[0.98] ${
                  inCart
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold text-foreground leading-tight">{item.name}</span>
                  {inCart && (
                    <Badge variant="default" className="ml-2 text-[10px]">{inCart.quantity}</Badge>
                  )}
                </div>
                <Badge variant="outline" className="mb-2">{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
                <p className="text-lg font-bold text-primary">${Number(item.unit_price).toFixed(2)}</p>
              </button>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-12">No items available in this category.</p>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0">
        <Card className="h-full flex flex-col">
          <CardContent className="p-4 flex flex-col h-full">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 border-b border-border pb-2">Current Order</h2>

            {optimisticCart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm text-center">Cart empty.<br />Tap items to begin.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {optimisticCart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm font-bold text-foreground">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                        <div className="flex gap-1">
                          <button onClick={() => removeFromCart(item.menuItemId)} className="w-6 h-6 rounded bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition flex items-center justify-center">−</button>
                          <button onClick={() => addToCart({ id: item.menuItemId, name: item.name, unit_price: item.unitPrice } as MenuItem)} className="w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition flex items-center justify-center">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total ({optimisticCart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="text-2xl font-bold text-foreground">${cartTotal.toFixed(2)}</span>
                  </div>

                  <Button variant="default" size="lg" className="w-full" disabled={isPending || optimisticCart.length === 0} onClick={handleCheckout}>
                    {isPending ? "Processing..." : "Complete Order"}
                  </Button>

                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setCart([])}>
                    Clear Cart
                  </Button>
                </div>
              </>
            )}

            {/* Order Result Toast */}
            {orderResult && (
              <div className={`mt-3 p-3 rounded-lg text-sm font-bold text-center ${
                orderResult.success
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-destructive/10 text-destructive border border-destructive/30"
              }`}>
                {orderResult.message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
