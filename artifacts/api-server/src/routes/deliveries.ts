import { Router } from "express";
import { db, deliveriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/deliveries?sessionId=...&limit=50
router.get("/", async (req, res) => {
  try {
    const { sessionId, limit } = req.query as {
      sessionId?: string;
      limit?: string;
    };

    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const rows = await db
      .select()
      .from(deliveriesTable)
      .where(eq(deliveriesTable.session_id, sessionId))
      .orderBy(desc(deliveriesTable.timestamp))
      .limit(Math.min(Number(limit ?? 50), 200));

    res.json(
      rows.map((d) => ({
        id: d.id,
        session_id: d.session_id,
        pace_kmh: d.pace_kmh,
        is_legal: d.is_legal,
        trajectory: d.trajectory,
        timestamp: d.timestamp.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list deliveries");
    res.status(500).json({ error: "Failed to list deliveries" });
  }
});

export default router;
