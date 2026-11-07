// AIR benchmark harness support — shipping.
//
// Everything here is INERT unless AIR_BENCHMARK_MODE=1. When disabled, the
// /__air/* routes are never registered, so they return 404. When enabled,
// every request must carry X-AIR-Benchmark-Token === AIR_BENCHMARK_TOKEN or it
// is rejected with 401. These routes are used by AIR for setup only and are
// never load-tested.

import type { Express, Request, Response, NextFunction } from 'express';
import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const BASE_ROWS = 1000;
const CHUNK = 5000;

let seeded = true;

async function createManyChunked(
  model: { createMany: (args: { data: any[] }) => Promise<unknown> },
  rows: any[],
): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await model.createMany({ data: rows.slice(i, i + CHUNK) });
  }
}

// Seeds ~1000 Shipment rows per scale unit. Deterministic and self-contained
// so AIR gets exact row counts in its isolated database.
export async function seedData(prisma: PrismaClient, scale: number) {
  const total = BASE_ROWS * Math.max(1, scale);

  await prisma.shipment.deleteMany();

  const shipments = Array.from({ length: total }, (_, i) => ({
    id: randomUUID(),
    carrier: 'ups',
    trackingCode: `AIR-TRACK-${i}`,
    status: 'label_created',
  }));
  await createManyChunked(prisma.shipment, shipments);

  return { Shipment: await prisma.shipment.count() };
}

export function registerAirRoutes(app: Express, prisma: PrismaClient): void {
  if (process.env.AIR_BENCHMARK_MODE !== '1') return;

  const guard = (req: Request, res: Response, next: NextFunction) => {
    const token = process.env.AIR_BENCHMARK_TOKEN;
    const provided = req.header('X-AIR-Benchmark-Token');
    if (!token || provided !== token) {
      return res.status(401).json({ error: 'invalid or missing benchmark token' });
    }
    next();
  };

  app.post('/__air/seed', guard, async (req, res) => {
    const scale = Math.max(1, Number(req.query.scale) || 1);
    seeded = false;
    try {
      const counts = await seedData(prisma, scale);
      seeded = true;
      res.json({ ok: true, scale, counts });
    } catch (err) {
      seeded = true;
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/__air/users', guard, (_req, res) => {
    res.json({ users: [], note: 'auth strategy is none; no login required' });
  });

  app.get('/__air/ready', guard, (_req, res) => {
    res.status(seeded ? 200 : 503).json({ ready: seeded });
  });
}
