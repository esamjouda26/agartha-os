"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DomainAuditTable from "@/components/DomainAuditTable";
import { fetchProductsAction, updateProductAction } from "../actions";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  reorder_point: number;
  is_active: boolean;
  product_stock_levels: Array<{ current_qty: number; location_id: string }>;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchProductsAction({ page, pageSize, search });
    setProducts(result.data as unknown as Product[]);
    setTotal(result.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  async function handleSave(id: string) {
    await updateProductAction(id, editValues);
    setEditingId(null);
    setEditValues({});
    load();
  }

  const totalStock = (p: Product) => p.product_stock_levels?.reduce((s, l) => s + Number(l.current_qty), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground text-sm mt-1">ERP product catalog with stock levels</p>
        </div>
        <Badge variant="outline">{total} products</Badge>
      </div>

      <Input placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">No products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Name", "SKU", "Category", "Unit", "Stock", "Reorder Pt", "Status", ""].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const stock = totalStock(p);
                    const isLow = stock <= p.reorder_point;
                    const isEditing = editingId === p.id;
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {isEditing ? <Input value={(editValues.name as string) ?? p.name} onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))} className="h-8" /> : p.name}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{p.sku ?? "—"}</td>
                        <td className="py-3 px-4"><Badge variant="outline">{p.category ?? "—"}</Badge></td>
                        <td className="py-3 px-4 text-muted-foreground">{p.unit}</td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${isLow ? "text-destructive" : "text-emerald-400"}`}>{stock}</span>
                          {isLow && <span className="text-[10px] text-destructive ml-1">LOW</span>}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {isEditing ? <Input type="number" value={(editValues.reorder_point as number) ?? p.reorder_point} onChange={(e) => setEditValues((v) => ({ ...v, reorder_point: Number(e.target.value) }))} className="h-8 w-20" /> : p.reorder_point}
                        </td>
                        <td className="py-3 px-4"><Badge variant={p.is_active ? "success" : "destructive"}>{p.is_active ? "Active" : "Inactive"}</Badge></td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="default" onClick={() => handleSave(p.id)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditValues({}); }}>✕</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(p.id); setEditValues({}); }}>Edit</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <DomainAuditTable entityTypes={["product", "purchase_order", "inventory_transfer"]} title="Inventory Audit Trail" />
    </div>
  );
}
