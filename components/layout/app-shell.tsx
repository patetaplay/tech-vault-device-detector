import Link from "next/link";
import { ReactNode } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clientes" },
  { href: "/service-orders", label: "Ordens de Serviço" },
  { href: "/inventory", label: "Estoque" },
  { href: "/cash", label: "Caixa" }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-white p-4">
        <h1 className="mb-4 text-lg font-bold">AlexTec (Software & Hardware)</h1>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded px-2 py-1 hover:bg-slate-100">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
