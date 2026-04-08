import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Use individual PG* vars (Replit native Postgres) with SSL
const client = process.env.PGHOST
  ? postgres({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || "5432"),
      database: process.env.PGDATABASE,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: "require",
    })
  : postgres(process.env.DATABASE_URL!, { ssl: "require" });

export const db = drizzle(client, { schema });
