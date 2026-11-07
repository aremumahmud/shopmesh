import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

function trackingCode(): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `SM-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'shipping' });
});

app.post('/shipments', async (req, res) => {
  const { carrier } = req.body as { carrier?: string };

  const shipment = await prisma.shipment.create({
    data: {
      carrier: carrier ?? 'ups',
      trackingCode: trackingCode(),
      status: 'label_created',
    },
  });
  res.status(201).json(shipment);
});

app.get('/shipments/:id', async (req, res) => {
  const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
  if (!shipment) return res.status(404).json({ error: 'not found' });
  res.json(shipment);
});

const port = Number(process.env.PORT) || 3003;
app.listen(port, () => console.log(`shipping listening on ${port}`));
