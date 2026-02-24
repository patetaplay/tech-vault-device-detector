import { prisma } from "@/lib/prisma";
import { ServiceOrdersView } from "./view";

export default async function ServiceOrdersPage() {
  const [orders, clients, technicians] = await Promise.all([
    prisma.serviceOrder.findMany({ include: { client: true }, orderBy: { createdAt: "desc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } })
  ]);

  return <ServiceOrdersView initialOrders={orders} clients={clients} technicians={technicians} />;
}
