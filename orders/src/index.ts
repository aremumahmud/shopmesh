import express from 'express';
import { PrismaClient } from '@prisma/client';
import { httpClient } from './httpClient';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

// orders -> payments
const payments = httpClient('PAYMENTS_URL');
// orders -> shipping
const shipping = httpClient('SHIPPING_URL');
// orders -> external payment processor (Stripe)
const stripe = httpClient('STRIPE_URL');

interface IncomingItem {
  sku: string;
  name: string;
  quantity: number;
  priceCents: number;
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'orders' });
});

app.post('/orders', async (req, res) => {
  try {
    const { customerEmail, items } = req.body as {
      customerEmail: string;
      items: IncomingItem[];
    };

    if (!customerEmail || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'customerEmail and items[] are required' });
    }

    const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

    // orders -> external payment processor (Stripe). Best-effort in local dev:
    // if the external processor is unreachable we still record the order.
    let stripeRef: string | null = null;
    try {
      const intent = await stripe.post('/v1/payment_intents', {
        amount: totalCents,
        currency: 'usd',
      });
      stripeRef = (intent as { id?: string }).id ?? null;
    } catch {
      stripeRef = null;
    }

    // orders -> payments
    const charge = await payments.post<{ id: string }>('/charge', {
      amountCents: totalCents,
      stripeRef,
    });

    // orders -> shipping
    const shipment = await shipping.post<{ id: string }>('/shipments', { items });

    const order = await prisma.order.create({
      data: {
        customerEmail,
        totalCents,
        chargeId: charge.id,
        shipmentId: shipment.id,
        status: 'confirmed',
        items: {
          create: items.map((i) => ({
            sku: i.sku,
            name: i.name,
            quantity: i.quantity,
            priceCents: i.priceCents,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

app.get('/orders/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ error: 'not found' });
  res.json(order);
});

app.get('/orders', async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  // cross-service N+1
  const enriched = [];
  for (const order of orders) {
    let charge = null;
    if (order.chargeId) {
      try {
        charge = await payments.get(`/charges/${order.chargeId}`);
      } catch {
        charge = null;
      }
    }
    enriched.push({ ...order, charge });
  }

  res.json(enriched);
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => console.log(`orders listening on ${port}`));
