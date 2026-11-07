import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.order.count();
  if (existing > 0) {
    console.log(`orders: already has ${existing} orders, skipping seed`);
    return;
  }

  await prisma.order.create({
    data: {
      customerEmail: 'seed@shopmesh.dev',
      totalCents: 3998,
      status: 'confirmed',
      items: {
        create: [
          { sku: 'TEE-001', name: 'Classic Tee', quantity: 2, priceCents: 1999 },
        ],
      },
    },
  });
  console.log('orders: seeded 1 sample order');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
