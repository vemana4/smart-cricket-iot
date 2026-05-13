import { Router } from "express";
import { randomUUID } from "crypto";
import { db, sessionsTable, deliveriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { pusher, LIVE_CHANNEL } from "../lib/pusher.js";
import { processDelivery } from "../lib/physicsEngine.js";

const router = Router();

// POST /api/telemetry
router.post("/", async (req, res) => {
  // Return immediately to prevent watch timeout
  res.json({ status: "received" });

  // Async processing
  try {
    const { payload } = req.body as { payload: unknown[] };
    if (!Array.isArray(payload)) return;

    const result = processDelivery(payload as Parameters<typeof processDelivery>[0]);
    if (!result) return;

    // Fetch active session
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.status, "active"))
      .orderBy(desc(sessionsTable.created_at))
      .limit(1);

    if (!session) return;

    // Save delivery
    const [delivery] = await db
      .insert(deliveriesTable)
      .values({
        id: randomUUID(),
        session_id: session.id,
        pace_kmh: result.pace_kmh,
        is_legal: result.is_legal,
        trajectory: result.trajectory,
      })
      .returning();

    // Broadcast via Pusher
    await pusher.trigger(LIVE_CHANNEL, "new-ball", {
      id: delivery.id,
      session_id: delivery.session_id,
      pace_kmh: delivery.pace_kmh,
      is_legal: delivery.is_legal,
      trajectory: delivery.trajectory,
      timestamp: delivery.timestamp.toISOString(),
    });
  } catch (err) {
    console.error("Telemetry async processing error:", err);
  }
});

export default router;
