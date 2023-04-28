import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { goals, links } from "../../db/schema";

export const goalRouter = createTRPCRouter({
  getAll: authenticatedProcedure.query(({ ctx }) => {
    const userId = ctx.auth.userId;
    return ctx.db.select().from(goals).where(eq(goals.userId, userId));
  }),
  get: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const results = await ctx.db
        .select()
        .from(goals)
        .where(and(eq(goals.id, input.id), eq(goals.userId, userId)))
        .limit(1);

      const result = results[0];

      if (!result) {
        throw new Error("Goal not found");
      } else {
        return result;
      }
    }),

  update: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional().nullable(),
        completed: z.boolean().optional().nullable(),
        guideMarkdown: z.string().optional().nullable(),
      })
    )
    .mutation(({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // TODO: check if goal exists and belongs to user

      return ctx.db
        .update(goals)
        .set({
          title: input.title ?? undefined,
          completed: input.completed ?? undefined,
          guideMarkdown: input.guideMarkdown ?? undefined,
        })
        .where(eq(goals.id, input.id));
    }),
  delete: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // TODO: check if goal exists and belongs to user

      return ctx.db.transaction(async (tx) => {
        await tx.delete(goals).where(eq(goals.id, input.id));

        // Delete all links associated with this goal
        await tx.delete(links).where(eq(links.childId, input.id));
        await tx.delete(links).where(eq(links.parentId, input.id));
      });
    }),
});
