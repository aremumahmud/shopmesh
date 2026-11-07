// CLI entry for AIR seeding: `node dist/src/airSeed.js --scale N`.
// Shares seedData() with the /__air/seed route so both paths are identical.
import { PrismaClient } from '@prisma/client';
import { seedData } from './air';

async function main() {
  const idx = process.argv.indexOf('--scale');
  const scale = idx >= 0 ? Number(process.argv[idx + 1]) || 1 : 1;
  const prisma = new PrismaClient();
  try {
    const counts = await seedData(prisma, scale);
    console.log(`gateway: seeded ${JSON.stringify(counts)} at scale ${scale}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
