import { createTRPCRouter } from "~/server/api/trpc";
import { publicRouter } from "./routers/public";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const functionsAppRouter = createTRPCRouter({
  public: publicRouter,
});

// export type definition of API
export type FunctionsAppRouter = typeof functionsAppRouter;
