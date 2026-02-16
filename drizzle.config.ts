import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./api/drizzleSchema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.ZERO_UPSTREAM_DB ?? "",
  },
});
