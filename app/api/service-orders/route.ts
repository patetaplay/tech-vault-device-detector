import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateOrderTotal } from "@/lib/utils";
import { serviceOrderSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const data = serviceOrderSchema.parse(body);
  const total = calculateOrderTotal(data.laborCost, data.partsCost, data.discount);
  const created = await prisma.serviceOrder.create({
    data: {
      ...data,
      total,
      statusHistory: { create: [{ toStatus: data.status }] }
    }
  });

  return NextResponse.json(created);
}
