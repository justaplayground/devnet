import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { config } from '../config.js';
import { pool } from '../db.js';
import { cacheDel, cacheGet, cacheKeys, cacheSet } from '../redis.js';

const createPostSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(z.string().min(1).max(50)).max(10).default([]),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .slice(0, 120);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || 'post';
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const { rows } = await pool.query('SELECT 1 FROM posts WHERE slug = $1', [candidate]);
    if (rows.length === 0) return candidate;
    attempt += 1;
  }
}

export async function postsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/posts', async () => {
    const cached = await cacheGet<unknown[]>(cacheKeys.feedLatest);
    if (cached) return { posts: cached };

    const { rows } = await pool.query(
      `SELECT
         p.id, p.title, p.slug, p.content, p.excerpt, p.cover_image_url,
         p.status, p.view_count, p.like_count, p.comment_count, p.bookmark_count,
         p.published_at, p.created_at, p.updated_at, p.author_id,
         pr.username AS author_username,
         pr.display_name AS author_display_name,
         pr.avatar_url AS author_avatar_url,
         COALESCE(
           json_agg(
             json_build_object('name', t.name, 'color', t.color)
           ) FILTER (WHERE t.id IS NOT NULL),
           '[]'
         ) AS tags
       FROM posts p
       JOIN profiles pr ON pr.user_id = p.author_id
       LEFT JOIN post_tags pt ON pt.post_id = p.id
       LEFT JOIN tags t ON t.id = pt.tag_id
       WHERE p.status = 'published'
       GROUP BY p.id, pr.username, pr.display_name, pr.avatar_url
       ORDER BY p.created_at DESC
       LIMIT 10`,
    );

    const posts = rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      content: row.content,
      excerpt: row.excerpt,
      cover_image_url: row.cover_image_url,
      status: row.status,
      view_count: row.view_count,
      like_count: row.like_count,
      comment_count: row.comment_count,
      bookmark_count: row.bookmark_count,
      published_at: row.published_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author_id: row.author_id,
      author: {
        username: row.author_username,
        display_name: row.author_display_name,
        avatar_url: row.author_avatar_url,
      },
      tags: row.tags,
    }));

    await cacheSet(cacheKeys.feedLatest, posts, config.feedCacheTtlSeconds);
    return { posts };
  });

  app.post('/api/posts', async (request, reply) => {
    const user = await requireAuth(request, reply);
    if (!user) return;

    const parsed = createPostSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const { title, content, excerpt, status, tags } = parsed.data;
    const slug = await uniqueSlug(title);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const postResult = await client.query(
        `INSERT INTO posts (author_id, title, slug, content, excerpt, status, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          user.id,
          title,
          slug,
          content,
          excerpt || `${content.slice(0, 200)}...`,
          status,
          status === 'published' ? new Date().toISOString() : null,
        ],
      );
      const post = postResult.rows[0];

      for (const tagName of tags) {
        const tagSlug = slugify(tagName) || 'tag';
        let tagResult = await client.query('SELECT id FROM tags WHERE name = $1 OR slug = $2', [
          tagName,
          tagSlug,
        ]);
        let tagId: string;
        if (tagResult.rows.length === 0) {
          tagResult = await client.query(
            `INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id`,
            [tagName, tagSlug],
          );
        }
        tagId = tagResult.rows[0].id;
        await client.query(
          `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [post.id, tagId],
        );
      }

      await client.query(
        `UPDATE profiles SET post_count = post_count + 1, updated_at = now() WHERE user_id = $1`,
        [user.id],
      );
      await client.query('COMMIT');

      await cacheDel(cacheKeys.feedLatest, cacheKeys.adminStats);
      return reply.code(201).send({ post });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });
}
