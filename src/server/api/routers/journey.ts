import { z } from "zod";
import { authenticatedProcedure, createTRPCRouter } from "~/server/api/trpc";

export const journeyRouter = createTRPCRouter({
  getAll: authenticatedProcedure.query(({ ctx }) => {
    const userId = ctx.auth.userId;
    return ctx.prisma.journey.findMany({
      where: {
        userId,
      },
      include: {
        goal: true,
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
      return ctx.prisma.journey.findFirst({
        where: {
          id: input.id,
          userId,
        },
        include: {
          goal: true,
        },
      });
    }),
  create: authenticatedProcedure
    .input(
      z.object({
        goalTitle: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      return ctx.prisma.journey.create({
        data: {
          userId,
          goal: {
            create: {
              title: input.goalTitle,
              userId,
            },
          },
        },
      });
    }),
});
