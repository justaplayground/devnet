import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { assertProductionSecrets, config } from './config.js';
import { loadUserFromRequest } from './auth.js';
import { migrate, pool, seedAdmin } from './db.js';
import { redis } from './redis.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { postsRoutes } from './routes/posts.js';
import './types.js';

async function main(): Promise<void> {
  assertProductionSecrets();

  await redis.connect();
  await migrate();
  await seedAdmin();

  const app = Fastify({ logger: true });

  await app.register(cookie);
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  app.addHook('preHandler', async (request) => {
    request.user = await loadUserFromRequest(request);
  });

  app.get('/api/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  await app.register(authRoutes);
  await app.register(postsRoutes);
  await app.register(adminRoutes);

  const shutdown = async () => {
    await app.close();
    await pool.end();
    redis.disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: config.port, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
