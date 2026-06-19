// Fix lessons with type='scenario' to type='interactive'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const updated = await prisma.lesson.updateMany({
    where: { type: 'scenario' },
    data: { type: 'interactive' },
  });
  console.log(`✅ Updated ${updated.count} lessons from 'scenario' → 'interactive'`);
  await prisma.$disconnect();
})();
