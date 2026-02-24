import { prisma } from "@/lib/prisma";
import { InventoryView } from "./view";

export default async function InventoryPage() {
  const [products, orders] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.serviceOrder.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
  ]);

  return <InventoryView products={products} orders={orders} />;
}
