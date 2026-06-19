import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, nom: true, actif: true } });
  for (const u of users) console.log(`${u.role.padEnd(15)} ${u.email.padEnd(35)} ${u.actif ? '✓' : '✗'} ${u.nom}`);
}
main().finally(() => prisma.$disconnect());
