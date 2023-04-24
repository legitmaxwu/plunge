import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";

export const goalRouter = createTRPCRouter({
  getAll: authenticatedProcedure.query(({ ctx }) => {
    const userId = ctx.auth.userId;
    return ctx.prisma.goal.findMany({
      where: {
        userId,
      },
    });
  }),
  get: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(({ ctx, input }) => {
      const userId = ctx.auth.userId;
      return ctx.prisma.goal.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });
    }),
  create: authenticatedProcedure
    .input(
      z.object({
        title: z.string(),
        parentGoalId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      return ctx.prisma.goal.create({
        data: {
          title: input.title,
          userId,
        },
      });
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

      return ctx.prisma.goal.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title ?? undefined,
          completed: input.completed ?? undefined,
          guideMarkdown: input.guideMarkdown ?? undefined,
        },
      });
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

      return ctx.prisma.goal.delete({
        where: {
          id: input.id,
        },
      });
    }),
});
