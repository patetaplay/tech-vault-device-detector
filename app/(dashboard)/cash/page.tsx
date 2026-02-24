import { prisma } from "@/lib/prisma";
import { CashView } from "./view";

export default async function CashPage() {
  const [entries, orders] = await Promise.all([
    prisma.cashEntry.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.serviceOrder.findMany({ where: { status: "PRONTO" }, orderBy: { createdAt: "desc" }, take: 20 })
  ]);

  return <CashView entries={entries} orders={orders} />;
}
