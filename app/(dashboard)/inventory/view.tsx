"use client";

import { Product, ServiceOrder } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InventoryView({ products, orders }: { products: Product[]; orders: ServiceOrder[] }) {
  const [form, setForm] = useState({ name: "", sku: "", quantity: 0, minQuantity: 0, costPrice: 0, salePrice: 0 });

  const createProduct = async () => {
    await fetch("/api/inventory-movements", { method: "POST", body: JSON.stringify({ action: "CREATE_PRODUCT", ...form }) });
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Estoque</h1>
      <div className="grid gap-2 md:grid-cols-3">
        <Input placeholder="Produto" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="SKU" onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <Button onClick={createProduct}>Salvar peça</Button>
      </div>
      <ul className="rounded border bg-white p-4 text-sm">
        {products.map((p) => <li key={p.id}>{p.name} ({p.quantity}) {p.quantity <= p.minQuantity ? "⚠️ baixo" : ""}</li>)}
      </ul>
      <p className="text-xs text-slate-500">Movimentações vinculáveis a OS (total carregadas: {orders.length})</p>
    </div>
  );
}
