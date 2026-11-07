# shopmesh

A small Node 22 + TypeScript microservices system. Four independent Express +
Prisma (Postgres) services, one shared Postgres and one Redis, wired together
over HTTP in a clean DAG.

## Topology

```
          ┌─────────┐
          │ gateway │  (public edge, host port 3000)
          └────┬────┘
               │ ORDERS_URL
          ┌────▼────┐
          │ orders  │
          └──┬───┬──┴──────────────┐
 PAYMENTS_URL│   │SHIPPING_URL      │ STRIPE_URL
        ┌────▼─┐ └─▼──────┐   ┌─────▼──────────────┐
        │ pay- │ │shipping│   │ external processor │
        │ ments│ └────────┘   │ (Stripe)           │
        └──────┘              └────────────────────┘
```

Nothing calls back into `gateway`. Every outbound base URL comes from an env
var and every cross-service call goes through that service's
`src/httpClient.ts`, which reads the named `*_URL` variable.

| Service   | Host → container | Prisma models        | Internal calls                         |
|-----------|------------------|----------------------|----------------------------------------|
| gateway   | 3000 → 3000      | Product              | orders (`ORDERS_URL`)                  |
| orders    | — → 3001         | Order, OrderItem     | payments, shipping, Stripe (`*_URL`)   |
| payments  | — → 3002         | Charge               | none                                   |
| shipping  | — → 3003         | Shipment             | none                                   |

## Run

```bash
docker compose up --build
```

Postgres creates one database per service on first boot. Each service runs
`prisma migrate deploy`, seeds, then starts. `gateway` becomes healthy last and
is reachable on `http://localhost:3000`.

## Endpoints

Gateway (public):

```bash
curl localhost:3000/health
curl localhost:3000/products
curl -X POST localhost:3000/checkout -H 'content-type: application/json' \
  -d '{"customerEmail":"a@b.com","items":[{"sku":"TEE-001","name":"Tee","quantity":2,"priceCents":1999}]}'
curl localhost:3000/orders/<id>
```

Internal services expose `POST /charge`+`GET /charges/:id` (payments),
`POST /shipments`+`GET /shipments/:id` (shipping), and
`POST /orders`+`GET /orders/:id`+`GET /orders` (orders).
# shopmesh
