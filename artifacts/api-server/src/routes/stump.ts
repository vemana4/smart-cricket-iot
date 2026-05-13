import { Router } from "express";
import { randomUUID } from "crypto";
import { db, sessionsTable, wicketsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { pusher, LIVE_CHANNEL } from "../lib/pusher.js";

const router = Router();

// POST /api/stump
router.post("/", async (req, res) => {
  // Return immediately to prevent ESP32 timeout
  res.json({ status: "received" });

  // Async processing
  try {
    const { status, impact_force } = req.body as {
      status: "out" | "not_out";
      impact_force: number;
    };

    // Fetch active session
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.status, "active"))
      .orderBy(desc(sessionsTable.created_at))
      .limit(1);

    if (!session) return;

    // Save wicket
    const [wicket] = await db
      .insert(wicketsTable)
      .values({
        id: randomUUID(),
        session_id: session.id,
        status,
        impact_force,
      })
      .returning();

    // Broadcast wicket alert
    await pusher.trigger(LIVE_CHANNEL, "wicket-alert", {
      id: wicket.id,
      session_id: wicket.session_id,
      status: wicket.status,
      impact_force: wicket.impact_force,
      timestamp: wicket.timestamp.toISOString(),
    });
  } catch (err) {
    console.error("Stump async processing error:", err);
  }
});

export default router;
