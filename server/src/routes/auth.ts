import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createSession, destroySession } from '../auth.js';
import { pool } from '../db.js';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/signup', async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { email, password, username } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
        [email.toLowerCase(), passwordHash],
      );
      const userId = userResult.rows[0].id as string;
      await client.query(
        `INSERT INTO profiles (user_id, username, display_name)
         VALUES ($1, $2, $3)`,
        [userId, username, username],
      );
      await client.query('COMMIT');

      await createSession(userId, reply);
      return reply.code(201).send({
        user: {
          id: userId,
          email: userResult.rows[0].email,
          username,
          displayName: username,
          isAdmin: false,
          isModerator: false,
        },
      });
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      const pgErr = err as { code?: string };
      if (pgErr.code === '23505') {
        return reply.code(409).send({ error: 'Email or username already exists' });
      }
      throw err;
    } finally {
      client.release();
    }
  });

  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.password_hash, p.username, p.display_name, p.is_admin, p.is_moderator
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase()],
    );

    if (rows.length === 0) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const row = rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    await createSession(row.id, reply);
    return {
      user: {
        id: row.id,
        email: row.email,
        username: row.username,
        displayName: row.display_name,
        isAdmin: row.is_admin,
        isModerator: row.is_moderator,
      },
    };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    await destroySession(request, reply);
    return { ok: true };
  });

  app.get('/api/auth/me', async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }
    return { user: request.user };
  });
}
