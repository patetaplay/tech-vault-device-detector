"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Client, ServiceOrder, ServiceOrderStatus, User } from "@prisma/client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildWhatsAppLink } from "@/lib/utils";
import { serviceOrderSchema } from "@/lib/validations";

type FormData = typeof serviceOrderSchema._type;

export function ServiceOrdersView({ initialOrders, clients, technicians }: { initialOrders: (ServiceOrder & { client: Client })[]; clients: Client[]; technicians: User[] }) {
  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(serviceOrderSchema), defaultValues: { status: ServiceOrderStatus.RECEBIDO, laborCost: 0, partsCost: 0, discount: 0, warrantyDays: 90 } });

  const onSubmit = async (data: FormData) => {
    await fetch("/api/service-orders", { method: "POST", body: JSON.stringify(data) });
    reset();
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
      <form className="grid gap-2 md:grid-cols-4" onSubmit={handleSubmit(onSubmit)}>
        <select className="rounded border p-2" {...register("clientId")}>{clients.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select>
        <Input placeholder="Marca" {...register("brand")} />
        <Input placeholder="Modelo" {...register("model")} />
        <Input placeholder="Defeito" {...register("reportedIssue")} />
        <select className="rounded border p-2" {...register("technicianId")}>{technicians.map((t) => <option value={t.id} key={t.id}>{t.name}</option>)}</select>
        <Button className="md:col-span-4" type="submit">Criar OS</Button>
      </form>
      <div className="space-y-2">
        {initialOrders.map((os) => {
          const message = `Olá ${os.client.name}, sua OS #${os.number} está em ${os.status}.`;
          return (
            <div className="rounded border bg-white p-3" key={os.id}>
              <p className="font-medium">#{os.number} - {os.client.name} ({os.brand} {os.model})</p>
              <p className="text-sm">Status: {os.status}</p>
              <a className="text-sm text-blue-600" href={buildWhatsAppLink(os.client.phone, message)} target="_blank">Enviar WhatsApp</a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
