import { appRouter } from "~/server/api/root";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { db } from "../../../server/db/db";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { createTRPCContext } from "../../../server/api/trpc";
import { env } from "../../../env.mjs";

// export const config = {
//   runtime: "edge",
//   regions: "pdx1",
// };

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
          );
        }
      : undefined,
});

// export API handler

// export default async function handler(req: NextRequest) {
//   return fetchRequestHandler({
//     endpoint: "/api/trpc",
//     router: appRouter,
//     req,
//     createContext: () => {
//       return {
//         auth: getAuth(req),
//         db: db,
//       };
//     },
//   });
// }
