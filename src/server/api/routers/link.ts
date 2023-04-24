import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { getLexoRankIndices } from "../../lib/lexoRank";

export const linkRouter = createTRPCRouter({
  getAllUnderGoal: authenticatedProcedure
    .input(
      z.object({
        parentGoalId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      return ctx.prisma.link.findMany({
        where: {
          parentId: input.parentGoalId,
          parent: {
            userId,
          },
        },
        orderBy: {
          lexoRankIndex: "asc",
        },
        include: {
          child: true,
        },
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
      return ctx.prisma.link.update({
        where: {
          id: input.id,
        },
        data: {
          lexoRankIndex: input.lexoRankIndex,
        },
      });
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

      const parentGoal = await ctx.prisma.goal.findFirst({
        where: {
          id: input.parentGoalId,
          userId,
        },
        include: {
          children: {
            orderBy: {
              lexoRankIndex: "desc",
            },
          },
        },
      });

      if (!parentGoal) {
        throw new Error("Parent goal not found");
      }

      const lexoRankIndices = getLexoRankIndices(
        parentGoal.children[0]?.lexoRankIndex ?? null,
        goalTitles.length
      );

      const promises = goalTitles.map((title, index) => {
        return ctx.prisma.link.create({
          data: {
            lexoRankIndex: lexoRankIndices[index] ?? "",
            parent: {
              connect: {
                id: parentGoalId,
              },
            },
            child: {
              create: {
                title,
                userId,
              },
            },
          },
        });
      });

      return Promise.all(promises);
    }),
});
