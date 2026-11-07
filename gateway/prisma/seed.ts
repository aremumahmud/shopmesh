import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  { name: 'Classic Tee', sku: 'TEE-001', priceCents: 1999 },
  { name: 'Hoodie', sku: 'HOOD-001', priceCents: 4999 },
  { name: 'Cap', sku: 'CAP-001', priceCents: 1499 },
];

async function main() {
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, priceCents: p.priceCents },
      create: p,
    });
  }
  console.log(`gateway: seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
