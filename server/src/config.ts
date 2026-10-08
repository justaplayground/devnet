function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgresql://devnet:devnet@localhost:5432/devnet',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
  cookieName: process.env.SESSION_COOKIE_NAME ?? 'devnet_session',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  corsOrigin: process.env.CORS_ORIGIN ?? true,
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@devnet.local',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'AdminPassword123!',
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 7),
  feedCacheTtlSeconds: Number(process.env.FEED_CACHE_TTL_SECONDS ?? 30),
  statsCacheTtlSeconds: Number(process.env.STATS_CACHE_TTL_SECONDS ?? 60),
};

export function assertProductionSecrets(): void {
  if (process.env.NODE_ENV === 'production') {
    required('DATABASE_URL');
    required('REDIS_URL');
    required('JWT_SECRET');
  }
}
