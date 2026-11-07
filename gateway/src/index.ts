import express from 'express';
import { PrismaClient } from '@prisma/client';
import { httpClient } from './httpClient';
import { registerAirRoutes } from './air';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

// gateway -> orders
const orders = httpClient('ORDERS_URL');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

app.get('/products', async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  res.json(products);
});

app.post('/checkout', async (req, res) => {
  try {
    const order = await orders.post('/orders', req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

app.get('/orders/:id', async (req, res) => {
  try {
    const order = await orders.get(`/orders/${req.params.id}`);
    res.json(order);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// AIR benchmark support routes — inert unless AIR_BENCHMARK_MODE=1.
registerAirRoutes(app, prisma);

const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`gateway listening on ${port}`));
}

export { app };
