import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.charge.count();
  if (existing > 0) {
    console.log(`payments: already has ${existing} charges, skipping seed`);
    return;
  }

  await prisma.charge.create({
    data: { amountCents: 3998, stripeRef: 'seed_pi_demo', status: 'succeeded' },
  });
  console.log('payments: seeded 1 sample charge');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
