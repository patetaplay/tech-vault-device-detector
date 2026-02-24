"use client";

import { CashEntry, ServiceOrder } from "@prisma/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CashView({ entries, orders }: { entries: CashEntry[]; orders: ServiceOrder[] }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);

  const save = async () => {
    await fetch("/api/cash-entries", { method: "POST", body: JSON.stringify({ type: "ENTRADA", description, amount }) });
    window.location.reload();
  };

  const totals = entries.reduce((acc, item) => {
    if (item.type === "ENTRADA") acc.in += Number(item.amount);
    else acc.out += Number(item.amount);
    return acc;
  }, { in: 0, out: 0 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Caixa</h1>
      <div className="grid gap-2 md:grid-cols-3">
        <Input placeholder="Descrição" onChange={(e) => setDescription(e.target.value)} />
        <Input type="number" placeholder="Valor" onChange={(e) => setAmount(Number(e.target.value))} />
        <Button onClick={save}>Lançar</Button>
      </div>
      <div className="rounded border bg-white p-4 text-sm">
        <p>Entradas: R$ {totals.in.toFixed(2)}</p>
        <p>Saídas: R$ {totals.out.toFixed(2)}</p>
        <p>Saldo: R$ {(totals.in - totals.out).toFixed(2)}</p>
      </div>
      <p className="text-xs text-slate-500">OS prontas para vincular: {orders.length}</p>
    </div>
  );
}
