import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'autoecole@demo.gn' } });
  if (existing) {
    console.log('✓ Account already exists:', existing.email, existing.role);
    return;
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('AutoEcole@2026', salt);
  const user = await prisma.user.create({
    data: {
      email: 'autoecole@demo.gn',
      passwordHash,
      nom: 'Auto-Ecole',
      prenom: 'Conakry',
      dateNaissance: '1980-01-01',
      numeroIdentite: 'AE-CONAKRY-001',
      telephone: '622000999',
      ville: 'Conakry',
      region: 'Conakry',
      categoriePermis: 'B',
      role: 'auto-ecole',
      numeroUnique: 'GN-AE-2026-000001',
    },
  });
  console.log('✓ Created auto-ecole account:', user.email, user.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
