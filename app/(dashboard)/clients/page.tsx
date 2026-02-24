import { prisma } from "@/lib/prisma";
import { ClientsView } from "./view";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  return <ClientsView initialClients={clients} />;
}
