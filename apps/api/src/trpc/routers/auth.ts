import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { SignupSchema, LoginSchema } from '@repo/shared';

const authRouter = router({
  signup: publicProcedure
    .input(SignupSchema)
    .mutation(async ({ input }) => {
      return { success: true, message: 'Signup endpoint — scaffolded', data: null };
    }),

  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input }) => {
      return { success: true, message: 'Login endpoint — scaffolded', data: null };
    }),

  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      return { success: true, message: 'Logged out', data: null };
    }),

  refresh: publicProcedure
    .query(async () => {
      return { success: true, message: 'Refresh endpoint — scaffolded', data: null };
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      return { success: true, message: 'Current user', data: ctx.user };
    }),
});

export { authRouter };
