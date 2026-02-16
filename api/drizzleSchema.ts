import { boolean, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  partner: boolean("partner"),
});

export const medium = pgTable("medium", {
  id: text("id").primaryKey(),
  name: text("name"),
});

export const message = pgTable("message", {
  id: text("id").primaryKey(),
  senderId: text("sender_id"),
  mediumId: text("medium_id"),
  body: text("body"),
  labels: jsonb("labels").$type<string[]>(),
  timestamp: integer("timestamp"),
});
