import { createTRPCRouter } from "~/server/api/trpc";
import { plungeRouter } from "./routers/plunge";
import { questionRouter } from "~/server/api/routers/question";
import { linkRouter } from "./routers/link";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  question: questionRouter,
  link: linkRouter,
  plunge: plungeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
