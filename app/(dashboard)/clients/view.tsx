"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Client } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientSchema } from "@/lib/validations";

type FormData = typeof clientSchema._type;

export function ClientsView({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState(initialClients);
  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(clientSchema) });

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/clients", { method: "POST", body: JSON.stringify(data) });
    const json = await res.json();
    setClients((prev) => [json, ...prev]);
    reset();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <form className="grid gap-2 md:grid-cols-3" onSubmit={handleSubmit(onSubmit)}>
        <Input placeholder="Nome" {...register("name")} />
        <Input placeholder="WhatsApp" {...register("phone")} />
        <Input placeholder="Email" {...register("email")} />
        <Button className="md:col-span-3" type="submit">Cadastrar cliente</Button>
      </form>
      <ul className="rounded border bg-white p-4 text-sm">
        {clients.map((c) => <li key={c.id}>{c.name} - {c.phone}</li>)}
      </ul>
    </div>
  );
}
