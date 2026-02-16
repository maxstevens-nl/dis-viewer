import { Hono } from "hono";
import { mustGetQuery } from "@rocicorp/zero";
import { handleQueryRequest } from "@rocicorp/zero/server";
import { queries } from "../src/queries.ts";
import { schema } from "../src/schema.ts";

export const config = {
  runtime: "nodejs",
};

export const app = new Hono().basePath("/api");

app.post("/zero/query", async (c) => {
  const result = await handleQueryRequest(
    (name, args) => mustGetQuery(queries, name).fn({ args, ctx: {} }),
    schema,
    c.req.raw
  );
  return c.json(result);
});

export default app;
