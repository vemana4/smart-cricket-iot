import { Router } from "express";
import { randomUUID } from "crypto";
import { db, sessionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { pusher, LIVE_CHANNEL } from "../lib/pusher.js";

const router = Router();

// POST /api/session/start
router.post("/start", async (req, res) => {
  try {
    const id = randomUUID();
    const [session] = await db
      .insert(sessionsTable)
      .values({ id, status: "active" })
      .returning();

    pusher.trigger(LIVE_CHANNEL, "session-started", { session_id: id }).catch(() => {});

    res.json({ session_id: session.id, created_at: session.created_at.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to start session");
    res.status(500).json({ error: "Failed to start session" });
  }
});

// GET /api/session/active
router.get("/active", async (req, res) => {
  try {
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.status, "active"))
      .orderBy(desc(sessionsTable.created_at))
      .limit(1);

    res.json({ session: session ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to get active session");
    res.status(500).json({ error: "Failed to get active session" });
  }
});

// POST /api/session/:sessionId/close
router.post("/:sessionId/close", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await db
      .update(sessionsTable)
      .set({ status: "closed" })
      .where(eq(sessionsTable.id, sessionId));

    pusher.trigger(LIVE_CHANNEL, "session-closed", { session_id: sessionId }).catch(() => {});

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to close session");
    res.status(500).json({ error: "Failed to close session" });
  }
});

export default router;
