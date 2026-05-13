import { Router } from "express";
import { db, wicketsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/wickets?sessionId=...
router.get("/", async (req, res) => {
  try {
    const { sessionId } = req.query as { sessionId?: string };

    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const rows = await db
      .select()
      .from(wicketsTable)
      .where(eq(wicketsTable.session_id, sessionId))
      .orderBy(desc(wicketsTable.timestamp));

    res.json(
      rows.map((w) => ({
        id: w.id,
        session_id: w.session_id,
        status: w.status,
        impact_force: w.impact_force,
        timestamp: w.timestamp.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list wickets");
    res.status(500).json({ error: "Failed to list wickets" });
  }
});

export default router;
