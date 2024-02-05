import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./src/server/db/schema.ts",
  driver: "mysql2",
  dbCredentials: {
    uri: `mysql://${process.env.DATABASE_USERNAME ?? ""}:${
      process.env.DATABASE_PASSWORD ?? ""
    }@${process.env.DATABASE_HOST ?? ""}/${
      process.env.DATABASE_NAME ?? ""
    }?ssl={"rejectUnauthorized":true}`,
  },
  tablesFilter: ["plunge_*"],
} satisfies Config;
