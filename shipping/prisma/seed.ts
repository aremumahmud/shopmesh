import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.shipment.count();
  if (existing > 0) {
    console.log(`shipping: already has ${existing} shipments, skipping seed`);
    return;
  }

  await prisma.shipment.create({
    data: { carrier: 'ups', trackingCode: 'SM-SEED-0001', status: 'label_created' },
  });
  console.log('shipping: seeded 1 sample shipment');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
