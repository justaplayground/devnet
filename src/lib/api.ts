const API_BASE = '/devnet/api';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : data?.error?.formErrors?.[0] || data?.message || res.statusText || 'Request failed';
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
  isModerator: boolean;
}

export interface FeedPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  status: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  bookmark_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  tags: Array<{ name: string; color: string }>;
}

export interface AdminUser {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  email: string;
  is_admin: boolean;
  is_moderator: boolean;
  post_count: number;
  created_at: string;
}

export interface AdminPost {
  id: string;
  title: string;
  status: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  author: {
    username: string;
    display_name: string | null;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  todayPosts: number;
}

export const api = {
  signup: (body: { email: string; password: string; username: string }) =>
    request<{ user: AuthUser }>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () => request<{ user: AuthUser }>('/auth/me'),

  getPosts: () => request<{ posts: FeedPost[] }>('/posts'),

  createPost: (body: {
    title: string;
    content: string;
    excerpt?: string;
    status: 'draft' | 'published';
    tags: string[];
  }) => request<{ post: unknown }>('/posts', { method: 'POST', body: JSON.stringify(body) }),

  adminUsers: () => request<{ users: AdminUser[] }>('/admin/users'),

  adminPosts: () => request<{ posts: AdminPost[] }>('/admin/posts'),

  adminStats: () => request<{ stats: AdminStats }>('/admin/stats'),

  updateUserRole: (userId: string, role: 'admin' | 'moderator', value: boolean) =>
    request<{ user: AdminUser }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, value }),
    }),
};
