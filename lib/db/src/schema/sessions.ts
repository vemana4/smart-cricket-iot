import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("active"),
});

export type Session = typeof sessionsTable.$inferSelect;
