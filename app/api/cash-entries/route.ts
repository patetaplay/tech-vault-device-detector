import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cashEntrySchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const data = cashEntrySchema.parse(body);
  const created = await prisma.cashEntry.create({ data });
  return NextResponse.json(created);
}
