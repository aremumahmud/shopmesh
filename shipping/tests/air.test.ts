import request from 'supertest';
import type { Express } from 'express';

const TOKEN = 'test-token';

function loadApp(mode: string | undefined): Express {
  jest.resetModules();
  if (mode === undefined) delete process.env.AIR_BENCHMARK_MODE;
  else process.env.AIR_BENCHMARK_MODE = mode;
  process.env.AIR_BENCHMARK_TOKEN = TOKEN;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../src/index').app;
}

describe('AIR support routes — guard', () => {
  it('(a) returns 404 when AIR_BENCHMARK_MODE is not set', async () => {
    const app = loadApp(undefined);
    await request(app).post('/__air/seed?scale=1').expect(404);
    await request(app).get('/__air/ready').expect(404);
    await request(app).post('/__air/users').expect(404);
  });

  it('(b) returns 401 when the benchmark token is missing/wrong', async () => {
    const app = loadApp('1');
    await request(app).post('/__air/seed?scale=1').expect(401);
    await request(app)
      .post('/__air/seed?scale=1')
      .set('X-AIR-Benchmark-Token', 'wrong')
      .expect(401);
  });
});

// (c) needs a live database. Runs only when DATABASE_URL is configured
// (as it is in AIR's isolated environment).
const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('AIR seed — row counts', () => {
  it('(c) seeding at scale 1 creates ~1000 Shipment rows', async () => {
    const app = loadApp('1');
    const res = await request(app)
      .post('/__air/seed?scale=1')
      .set('X-AIR-Benchmark-Token', TOKEN)
      .expect(200);
    expect(res.body.counts.Shipment).toBe(1000);

    await request(app).get('/__air/ready').set('X-AIR-Benchmark-Token', TOKEN).expect(200);
  });
});
