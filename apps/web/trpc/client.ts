import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@repo/trpc";

export const trpc = createTRPCReact<AppRouter>();
