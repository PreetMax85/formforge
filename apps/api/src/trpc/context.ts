import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; type: string; jti: string; email: string; };
    }
  }
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const user = req.user;

  return {
    user,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
