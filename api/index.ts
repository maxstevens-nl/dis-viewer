import { Hono } from "hono";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { SignJWT, jwtVerify } from "jose";
import { eq, desc } from "drizzle-orm";
import { mustGetMutator, mustGetQuery } from "@rocicorp/zero";
import { handleMutateRequest, handleQueryRequest } from "@rocicorp/zero/server";
import { zeroNodePg } from "@rocicorp/zero/server/adapters/pg";
import { z } from "zod";
import { mutators } from "../src/mutators.ts";
import { queries } from "../src/queries.ts";
import { schema, type AuthData } from "../src/schema.ts";
import { db, pool } from "./db.ts";
import { message, user, medium } from "./drizzleSchema.ts";

export const config = {
  runtime: "nodejs",
};

export const app = new Hono().basePath("/api");

// See seed.sql
// In real life you would of course authenticate the user however you like.
const userIDs = [
  "6z7dkeVLNm",
  "ycD76wW4R2",
  "IoQSaxeVO5",
  "WndZWmGkO4",
  "ENzoNm7g4E",
  "dLKecN3ntd",
  "7VoEoJWEwn",
  "enVvyDlBul",
  "9ogaDuDNFx",
];

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

const authSecret = new TextEncoder().encode(must(process.env.AUTH_SECRET));
const dbProvider = zeroNodePg(schema, pool);

const messageInput = z.object({
  id: z.string(),
  senderID: z.string(),
  mediumID: z.string(),
  body: z.string(),
  labels: z.array(z.string()).default([]),
  timestamp: z.number().int(),
});

const getContext = async (c: Context): Promise<AuthData> => {
  const token = getCookie(c, "jwt");
  if (!token) {
    return { userID: null };
  }

  try {
    const verified = await jwtVerify(token, authSecret);
    const sub = verified.payload.sub;
    return { userID: typeof sub === "string" ? sub : null };
  } catch {
    return { userID: null };
  }
};

app.get("/login", async (c) => {
  const jwtPayload = {
    sub: userIDs[randomInt(userIDs.length)],
    iat: Math.floor(Date.now() / 1000),
  };

  const jwt = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30days")
    .sign(new TextEncoder().encode(must(process.env.AUTH_SECRET)));

  setCookie(c, "jwt", jwt, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    domain: process.env.COOKIE_DOMAIN ? process.env.COOKIE_DOMAIN : undefined,
  });

  return c.text("ok");
});

app.post("/zero/query", async (c) => {
  const ctx = await getContext(c);
  const result = await handleQueryRequest(
    (name, args) => mustGetQuery(queries, name).fn({ args, ctx }),
    schema,
    c.req.raw
  );
  return c.json(result);
});

app.post("/zero/mutate", async (c) => {
  const ctx = await getContext(c);
  const result = await handleMutateRequest(
    dbProvider,
    (transact) =>
      transact((tx, name, args) =>
        mustGetMutator(mutators, name).fn({ tx, args, ctx })
      ),
    c.req.raw
  );
  return c.json(result);
});

app.get("/data/messages", async (c) => {
  const rows = await db
    .select({
      id: message.id,
      body: message.body,
      labels: message.labels,
      timestamp: message.timestamp,
      senderId: message.senderId,
      senderName: user.name,
      mediumId: message.mediumId,
      mediumName: medium.name,
    })
    .from(message)
    .leftJoin(user, eq(message.senderId, user.id))
    .leftJoin(medium, eq(message.mediumId, medium.id))
    .orderBy(desc(message.timestamp))
    .limit(100);

  return c.json(rows);
});

app.post("/data/messages", async (c) => {
  const payload = await c.req.json();
  const parsed = messageInput.safeParse(payload);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid payload",
        issues: parsed.error.issues,
      },
      400
    );
  }

  const { labels, ...rest } = parsed.data;

  await db.insert(message).values({
    id: rest.id,
    senderId: rest.senderID,
    mediumId: rest.mediumID,
    body: rest.body,
    labels,
    timestamp: rest.timestamp,
  });

  return c.json({ ok: true });
});

export default app;

function must<T>(val: T) {
  if (!val) {
    throw new Error("Expected value to be defined");
  }
  return val;
}
