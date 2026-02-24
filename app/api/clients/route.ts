import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const data = clientSchema.parse(body);
  const created = await prisma.client.create({ data });
  return NextResponse.json(created);
}
