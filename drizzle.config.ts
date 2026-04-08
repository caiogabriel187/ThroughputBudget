import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.PGHOST
  ? `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}?sslmode=require`
  : process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("Database credentials not found. Make sure the database is provisioned.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
