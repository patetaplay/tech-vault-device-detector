import { ServiceOrderStatus } from "@prisma/client";
import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email().optional().or(z.literal("")),
  document: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

export const serviceOrderSchema = z.object({
  clientId: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  serial: z.string().optional(),
  reportedIssue: z.string().min(3),
  diagnosis: z.string().optional(),
  executedServices: z.string().optional(),
  usedParts: z.string().optional(),
  laborCost: z.coerce.number().nonnegative(),
  partsCost: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative(),
  paymentMethod: z.string().optional(),
  warrantyDays: z.coerce.number().int().nonnegative(),
  technicianId: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(ServiceOrderStatus)
});

export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  quantity: z.coerce.number().int().nonnegative(),
  minQuantity: z.coerce.number().int().nonnegative(),
  costPrice: z.coerce.number().nonnegative(),
  salePrice: z.coerce.number().nonnegative()
});

export const cashEntrySchema = z.object({
  type: z.enum(["ENTRADA", "SAIDA"]),
  description: z.string().min(3),
  amount: z.coerce.number().positive(),
  serviceOrderId: z.string().optional()
});
