// // db.ts
// import { drizzle } from "drizzle-orm/planetscale-serverless";

// import { connect } from "@planetscale/database";
// import { env } from "../../env.mjs";

// // create the connection
// // const connection = connect({
// //   host: env.DATABASE_HOST,
// //   username: env.DATABASE_USERNAME,
// //   password: env.DATABASE_PASSWORD,
// // });

// const connectionString = process.env.DATABASE_URL
// const client = postgres(connectionString)

// export const db = drizzle(connection);

// import { Pool, neon, neonConfig } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-serverless";
// import { env } from "../../env.mjs";

// const client = new Pool({ connectionString: env.POSTGRES_URL });
// export const db = drizzle(client);

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../../env.mjs";

const connectionString = env.POSTGRES_URL;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client);
