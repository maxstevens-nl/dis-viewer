import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export const pool = new Pool({
  connectionString: mustGetEnv("ZERO_UPSTREAM_DB"),
});

export const db = drizzle(pool);

function mustGetEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Expected ${key} to be defined`);
  }
  return value;
}
