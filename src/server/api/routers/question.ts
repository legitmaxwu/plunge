import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { questions, links, type Question } from "../../db/schema";
import { alias } from "drizzle-orm/pg-core";

export const questionRouter = createTRPCRouter({
  getAll: authenticatedProcedure.query(({ ctx }) => {
    const userId = ctx.auth.userId;
    return ctx.db.select().from(questions).where(eq(questions.userId, userId));
  }),
  get: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const nestedLinks = alias(links, "childLinks");

      const userId = ctx.auth.userId;

      const results = await ctx.db
        .select()
        .from(questions)
        .where(and(eq(questions.id, input.id), eq(questions.userId, userId)));

      const result = results[0];

      if (!result) {
        throw new Error("Goal not found");
      } else {
        return result;
      }
    }),

  getQuestionPath: authenticatedProcedure
    .input(
      z.object({
        topQuestionId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { topQuestionId } = input;
      const nestedLinks = alias(links, "childLinks");
      const nestedQuestions = alias(questions, "childQuestions");

      const topResult = await ctx.db
        .select()
        .from(questions)
        .where(eq(questions.id, topQuestionId))
        .leftJoin(nestedLinks, eq(questions.id, nestedLinks.parentId))
        .leftJoin(nestedQuestions, eq(nestedLinks.childId, nestedQuestions.id))
        .limit(1);

      if (!topResult[0]) {
        throw new Error("Goal not found");
      }

      const qList = [
        {
          question: topResult[0].questions,
          childQuestions: topResult
            .map((row) => row.childQuestions)
            .filter((q) => q) as Question[],
        },
      ];

      for (let i = 0; i < 5; i++) {
        const nextQ = qList[qList.length - 1];
        if (!nextQ) break;

        const firstChildQ = nextQ.childQuestions[0];
        if (!firstChildQ) break;

        const result = await ctx.db
          .select()
          .from(questions)
          .where(eq(questions.id, firstChildQ.id))
          .leftJoin(nestedLinks, eq(questions.id, nestedLinks.parentId))
          .leftJoin(
            nestedQuestions,
            eq(nestedLinks.childId, nestedQuestions.id)
          );

        if (!result[0]) break;
        qList.push({
          question: result[0].questions,
          childQuestions: result
            .map((row) => row.childQuestions)
            .filter((q) => q) as Question[],
        });
      }

      return qList.map((q) => q.question) as Question[];
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
        .update(questions)
        .set({
          title: input.title ?? undefined,
          guideMarkdown: input.guideMarkdown ?? undefined,
        })
        .where(eq(questions.id, input.id));
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
        await tx.delete(questions).where(eq(questions.id, input.id));

        // Delete all links associated with this goal
        await tx.delete(links).where(eq(links.childId, input.id));
        await tx.delete(links).where(eq(links.parentId, input.id));
      });
    }),

  deleteIncludingChildren: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // TODO: check if goal exists and belongs to user

      async function getAllChildrenIds(questionId: string): Promise<string[]> {
        const childrenLinks = await ctx.db
          .select()
          .from(links)
          .where(eq(links.parentId, questionId));

        if (childrenLinks.length === 0) {
          return [];
        } else {
          return [
            ...childrenLinks.map((link) => link.childId),
            ...(
              await Promise.all(
                childrenLinks.map((link) => getAllChildrenIds(link.childId))
              )
            ).flat(),
          ];
        }
      }

      const idsToDelete = [input.id, ...(await getAllChildrenIds(input.id))];

      await ctx.db.transaction(async (tx) => {
        await tx.delete(questions).where(inArray(questions.id, idsToDelete));
        await tx.delete(links).where(inArray(links.childId, idsToDelete));
      });

      return input.id;
    }),
});
