import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { plunges, questions } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { createId } from "../../lib/id";

export const plungeRouter = createTRPCRouter({
  getAll: authenticatedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;
    const result = await ctx.db
      .select()
      .from(plunges)
      .leftJoin(questions, eq(plunges.questionId, questions.id))
      .where(eq(plunges.userId, userId));

    // Transform the result into the desired format
    return result.map((row) => {
      return {
        ...row.plunges,
        question: {
          ...row.questions,
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
        .from(plunges)
        .leftJoin(questions, eq(plunges.questionId, questions.id))
        .where(and(eq(plunges.id, input.id), eq(plunges.userId, userId)))
        .limit(1);

      const result = results[0];
      if (!result) {
        throw new Error("Plunge not found");
      } else {
        return {
          ...result.plunges,
          question: {
            ...result.questions,
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
        const newPlungeId = createId();
        const newQuestionId = createId();
        await tx.insert(questions).values({
          id: newQuestionId,
          title: input.goalTitle,
          userId,
        });

        await tx.insert(plunges).values({
          id: newPlungeId,
          userId,
          questionId: newQuestionId,
        });

        return {
          id: newPlungeId,
          goalId: newQuestionId,
        };
      });
    }),
});
