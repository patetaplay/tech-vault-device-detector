import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [ordersByStatus, lowStock, recentOrders, cashAgg] = await Promise.all([
    prisma.serviceOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.product.findMany({ where: { quantity: { lte: 5 } }, take: 10 }),
    prisma.serviceOrder.findMany({ include: { client: true }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.cashEntry.aggregate({ _sum: { amount: true } })
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm">Status de OS</p><p className="font-semibold">{ordersByStatus.length} grupos</p></Card>
        <Card><p className="text-sm">Baixo estoque</p><p className="font-semibold">{lowStock.length} itens</p></Card>
        <Card><p className="text-sm">Faturamento total</p><p className="font-semibold">R$ {Number(cashAgg._sum.amount ?? 0).toFixed(2)}</p></Card>
      </div>
      <Card>
        <h2 className="mb-2 font-semibold">OS recentes</h2>
        <ul className="space-y-1 text-sm">
          {recentOrders.map((os) => (<li key={os.id}>#{os.number} - {os.client.name} - {os.status}</li>))}
        </ul>
      </Card>
    </div>
  );
}
