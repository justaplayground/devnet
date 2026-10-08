import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../auth.js';
import { config } from '../config.js';
import { pool } from '../db.js';
import { cacheDel, cacheGet, cacheKeys, cacheSet } from '../redis.js';

const roleSchema = z.object({
  role: z.enum(['admin', 'moderator']),
  value: z.boolean(),
});

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/admin/users', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) return;

    const { rows } = await pool.query(
      `SELECT
         p.id, p.user_id, p.username, p.display_name, p.is_admin, p.is_moderator,
         p.post_count, p.created_at, u.email
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT 50`,
    );

    return { users: rows };
  });

  app.get('/api/admin/posts', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) return;

    const { rows } = await pool.query(
      `SELECT
         p.id, p.title, p.status, p.created_at, p.like_count, p.comment_count,
         pr.username AS author_username,
         pr.display_name AS author_display_name
       FROM posts p
       JOIN profiles pr ON pr.user_id = p.author_id
       ORDER BY p.created_at DESC
       LIMIT 50`,
    );

    return {
      posts: rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        created_at: row.created_at,
        like_count: row.like_count,
        comment_count: row.comment_count,
        author: {
          username: row.author_username,
          display_name: row.author_display_name,
        },
      })),
    };
  });

  app.get('/api/admin/stats', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) return;

    const cached = await cacheGet<{
      totalUsers: number;
      totalPosts: number;
      totalComments: number;
      todayPosts: number;
    }>(cacheKeys.adminStats);
    if (cached) return { stats: cached };

    const [users, posts, comments, today] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM profiles'),
      pool.query('SELECT COUNT(*)::int AS count FROM posts'),
      pool.query('SELECT COUNT(*)::int AS count FROM comments'),
      pool.query(`SELECT COUNT(*)::int AS count FROM posts WHERE created_at >= CURRENT_DATE`),
    ]);

    const stats = {
      totalUsers: users.rows[0].count,
      totalPosts: posts.rows[0].count,
      totalComments: comments.rows[0].count,
      todayPosts: today.rows[0].count,
    };

    await cacheSet(cacheKeys.adminStats, stats, config.statsCacheTtlSeconds);
    return { stats };
  });

  app.patch('/api/admin/users/:userId/role', async (request, reply) => {
    const actor = await requireAdmin(request, reply);
    if (!actor) return;

    const { userId } = request.params as { userId: string };
    const parsed = roleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { role, value } = parsed.data;
    const column = role === 'admin' ? 'is_admin' : 'is_moderator';

    const { rows } = await pool.query(
      `UPDATE profiles SET ${column} = $1, updated_at = now()
       WHERE user_id = $2
       RETURNING id, user_id, username, display_name, is_admin, is_moderator, post_count, created_at`,
      [value, userId],
    );

    if (rows.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    await cacheDel(cacheKeys.adminStats);
    return { user: rows[0] };
  });
}
