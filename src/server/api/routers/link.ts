import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { getLexoRankIndices } from "../../lib/lexoRank";
import { and, asc, desc, eq } from "drizzle-orm";
import { links, goals } from "../../db/schema";
import { createId } from "../../lib/id";

export const linkRouter = createTRPCRouter({
  getAllUnderGoal: authenticatedProcedure
    .input(
      z.object({
        parentGoalId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { parentGoalId } = input;
      const userId = ctx.auth.userId;
      const results = await ctx.db
        .select()
        .from(links)
        .leftJoin(goals, eq(links.parentId, goals.id))
        .where(and(eq(links.parentId, parentGoalId), eq(goals.userId, userId)))
        .orderBy(asc(links.lexoRankIndex));

      return results.map((row) => {
        return {
          ...row.links,
          goal: {
            ...row.goals,
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
        parentGoalId: z.string(),
        goalTitles: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const { parentGoalId, goalTitles } = input;

      const goalsRet = await ctx.db
        .select()
        .from(goals)
        .where(and(eq(goals.id, input.parentGoalId), eq(goals.userId, userId)))
        .leftJoin(links, eq(goals.id, links.parentId))
        .orderBy(desc(links.lexoRankIndex))
        .limit(1);

      const parentGoal = goalsRet[0];
      if (!parentGoal) {
        throw new Error("Parent goal not found");
      }

      console.log(parentGoal);

      const lexoRankIndices = getLexoRankIndices(
        parentGoal.links?.lexoRankIndex ?? null,
        goalTitles.length
      );

      const promises = goalTitles.map((title, index) => {
        return ctx.db.transaction(async (tx) => {
          const newGoalId = createId();
          const newLinkId = createId();

          await tx.insert(goals).values({
            id: newGoalId,
            title,
            userId,
          });

          await tx.insert(links).values({
            id: newLinkId,
            lexoRankIndex: lexoRankIndices[index] ?? "",
            parentId: parentGoalId,
            childId: newGoalId,
          });
        });
      });

      return Promise.all(promises);
    }),
});
