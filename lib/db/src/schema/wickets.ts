import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";

export const wicketsTable = pgTable("wickets", {
  id: text("id").primaryKey(),
  session_id: text("session_id").notNull(),
  status: text("status").notNull(),
  impact_force: real("impact_force").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Wicket = typeof wicketsTable.$inferSelect;
