import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { getLexoRankIndices } from "../../lib/lexoRank";
import { and, asc, desc, eq } from "drizzle-orm";
import { type Question, links, questions } from "../../db/schema";
import { createId } from "../../lib/id";

export const linkRouter = createTRPCRouter({
  getAllUnderQuestion: authenticatedProcedure
    .input(
      z.object({
        parentQuestionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { parentQuestionId } = input;
      const userId = ctx.auth.userId;
      const results = await ctx.db
        .select()
        .from(links)
        .leftJoin(questions, eq(links.childId, questions.id))
        .where(
          and(
            eq(links.parentId, parentQuestionId),
            eq(questions.userId, userId)
          )
        )
        .orderBy(asc(links.lexoRankIndex));

      return results.map((row) => {
        return {
          ...row.links,
          questions: {
            ...row.questions,
          },
        };
      });
    }),

  update: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        lexoRankIndex: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      // TODO: Check if user is allowed to update this link
      const result = await ctx.db
        .update(links)
        .set({ lexoRankIndex: input.lexoRankIndex })
        .where(eq(links.id, input.id));
      return result;
    }),

  createChildren: authenticatedProcedure
    .input(
      z.object({
        parentQuestionId: z.string(),
        questionTitles: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const { parentQuestionId: parentGoalId, questionTitles: goalTitles } =
        input;

      const goalsRet = await ctx.db
        .select()
        .from(questions)
        .where(
          and(
            eq(questions.id, input.parentQuestionId),
            eq(questions.userId, userId)
          )
        )
        .leftJoin(links, eq(questions.id, links.parentId))
        .orderBy(desc(links.lexoRankIndex))
        .limit(1);

      const parentGoal = goalsRet[0];
      if (!parentGoal) {
        throw new Error("Parent goal not found");
      }

      const lexoRankIndices = getLexoRankIndices(
        parentGoal.links?.lexoRankIndex ?? null,
        goalTitles.length
      );

      const promises = Promise.all(
        goalTitles.map(async (title, index) => {
          const ids = await ctx.db.transaction(async (tx) => {
            const newQuestionId = createId();
            const newLinkId = createId();

            await tx.insert(questions).values({
              id: newQuestionId,
              title,
              userId,
            });

            await tx.insert(links).values({
              id: newLinkId,
              lexoRankIndex: lexoRankIndices[index] ?? "",
              parentId: parentGoalId,
              childId: newQuestionId,
            });

            return {
              linkId: newLinkId,
              goalId: newQuestionId,
            };
          });
          const { linkId, goalId } = ids;

          const questionsRet = await ctx.db
            .select()
            .from(questions)
            .where(eq(questions.id, goalId))
            .limit(1);

          const question = questionsRet[0];
          if (!question) {
            throw new Error("question not found");
          }

          return {
            ...question,
          };
        })
      );

      const results = await promises;
      return results;
    }),
});
