export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
  isModerator: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null;
  }
}
