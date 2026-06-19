import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  await prisma.booking.update({
    where: { id: 'cmqkpznu20002qomswscnkvme' },
    data: { statutPaiement: 'confirme', confirmee: true }
  })
  console.log('Booking confirmed')
}
main().catch(console.error).finally(() => prisma.$disconnect())
