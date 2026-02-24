"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, formState } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const result = await signIn("credentials", { ...data, redirect: false });
    if (!result?.error) router.push("/dashboard");
  };

  return (
    <div className="mx-auto mt-24 max-w-md rounded border bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold">Login AlexTec</h1>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <Input placeholder="Email" {...register("email")} />
        <Input type="password" placeholder="Senha" {...register("password")} />
        <Button type="submit" disabled={formState.isSubmitting}>Entrar</Button>
      </form>
    </div>
  );
}
