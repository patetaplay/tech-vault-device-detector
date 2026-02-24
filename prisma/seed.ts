import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@alextec.local" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@alextec.local",
      password,
      role: Role.ADMIN
    }
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
