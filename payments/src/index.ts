import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'payments' });
});

app.post('/charge', async (req, res) => {
  const { amountCents, stripeRef } = req.body as {
    amountCents: number;
    stripeRef?: string | null;
  };
  if (typeof amountCents !== 'number') {
    return res.status(400).json({ error: 'amountCents (number) is required' });
  }

  const charge = await prisma.charge.create({
    data: {
      amountCents,
      stripeRef: stripeRef ?? null,
      status: 'succeeded',
    },
  });
  res.status(201).json(charge);
});

app.get('/charges/:id', async (req, res) => {
  const charge = await prisma.charge.findUnique({ where: { id: req.params.id } });
  if (!charge) return res.status(404).json({ error: 'not found' });
  res.json(charge);
});

const port = Number(process.env.PORT) || 3002;
app.listen(port, () => console.log(`payments listening on ${port}`));
