import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { journeys, goals } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { createId } from "../../lib/id";

export const journeyRouter = createTRPCRouter({
  getAll: authenticatedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    const result = await ctx.db
      .select()
      .from(journeys)
      .leftJoin(goals, eq(journeys.goalId, goals.id))
      .where(eq(journeys.userId, userId));

    // Transform the result into the desired format
    return result.map((row) => {
      return {
        ...row.journeys,
        goal: {
          ...row.goals,
        },
      };
    });
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
        .from(journeys)
        .leftJoin(goals, eq(journeys.goalId, goals.id))
        .where(and(eq(journeys.id, input.id), eq(journeys.userId, userId)))
        .limit(1);

      const result = results[0];
      if (!result) {
        throw new Error("Journey not found");
      } else {
        return {
          ...result.journeys,
          goal: {
            ...result.goals,
          },
        };
      }
    }),
  create: authenticatedProcedure
    .input(
      z.object({
        goalTitle: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      return ctx.db.transaction(async (tx) => {
        const newJourneyId = createId();
        const newGoalId = createId();
        await tx.insert(goals).values({
          id: newGoalId,
          title: input.goalTitle,
          userId,
        });

        await tx.insert(journeys).values({
          id: newJourneyId,
          userId,
          goalId: newGoalId,
        });

        return {
          id: newJourneyId,
          goalId: newGoalId,
        };
      });
    }),
});
