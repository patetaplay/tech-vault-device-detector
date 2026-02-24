import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "CREATE_PRODUCT") {
    const data = productSchema.parse(body);
    const created = await prisma.product.create({ data });
    return NextResponse.json(created);
  }

  return NextResponse.json({ message: "Ação inválida" }, { status: 400 });
}
