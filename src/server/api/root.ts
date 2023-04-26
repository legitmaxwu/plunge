import { createTRPCRouter } from "~/server/api/trpc";
import { goalRouter } from "~/server/api/routers/goal";
import { publicRouter } from "./routers/public";
import { linkRouter } from "./routers/link";
import { journeyRouter } from "./routers/journey";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  goal: goalRouter,
  link: linkRouter,
  public: publicRouter,
  journey: journeyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
