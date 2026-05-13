import { pgTable, text, real, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const deliveriesTable = pgTable("deliveries", {
  id: text("id").primaryKey(),
  session_id: text("session_id").notNull(),
  pace_kmh: real("pace_kmh").notNull(),
  is_legal: boolean("is_legal").notNull(),
  trajectory: jsonb("trajectory").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Delivery = typeof deliveriesTable.$inferSelect;
