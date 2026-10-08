import { randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { SignJWT, jwtVerify } from 'jose';
import { config } from './config.js';
import { pool } from './db.js';
import { cacheKeys, redis } from './redis.js';
import type { AuthUser } from './types.js';

const secret = () => new TextEncoder().encode(config.jwtSecret);

interface SessionPayload {
  sub: string;
  sid: string;
}

export async function createSession(userId: string, reply: FastifyReply): Promise<void> {
  const sid = randomUUID();
  const token = await new SignJWT({ sid })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${config.accessTokenTtlSeconds}s`)
    .sign(secret());

  await redis.set(cacheKeys.session(sid), userId, 'EX', config.accessTokenTtlSeconds);

  reply.setCookie(config.cookieName, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: config.accessTokenTtlSeconds,
  });
}

export async function destroySession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = request.cookies[config.cookieName];
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      const sid = (payload as unknown as SessionPayload).sid;
      if (sid) await redis.del(cacheKeys.session(sid));
    } catch {
      // ignore invalid token on logout
    }
  }
  reply.clearCookie(config.cookieName, { path: '/' });
}

export async function loadUserFromRequest(request: FastifyRequest): Promise<AuthUser | null> {
  const token = request.cookies[config.cookieName];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    const { sub, sid } = payload as unknown as SessionPayload;
    if (!sub || !sid) return null;

    const stored = await redis.get(cacheKeys.session(sid));
    if (!stored || stored !== sub) return null;

    const { rows } = await pool.query(
      `SELECT u.id, u.email, p.username, p.display_name, p.is_admin, p.is_moderator
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [sub],
    );
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      displayName: row.display_name,
      isAdmin: row.is_admin,
      isModerator: row.is_moderator,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  if (!request.user) {
    reply.code(401).send({ error: 'Authentication required' });
    return null;
  }
  return request.user;
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
  const user = await requireAuth(request, reply);
  if (!user) return null;
  if (!user.isAdmin && !user.isModerator) {
    reply.code(403).send({ error: 'Admin or moderator access required' });
    return null;
  }
  return user;
}
