import { Router } from "express";
import { db, sessionsTable, deliveriesTable, wicketsTable } from "@workspace/db";
import { eq, desc, avg, max, count, and } from "drizzle-orm";

const router = Router();

// GET /api/dashboard
router.get("/", async (req, res) => {
  try {
    // Get active session
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.status, "active"))
      .orderBy(desc(sessionsTable.created_at))
      .limit(1);

    if (!session) {
      res.json({
        session: null,
        total_deliveries: 0,
        avg_pace_kmh: 0,
        max_pace_kmh: 0,
        total_wickets: 0,
        legal_deliveries: 0,
        recent_deliveries: [],
        recent_wickets: [],
      });
      return;
    }

    // Aggregate stats in parallel
    const [stats, legalCount, recentDeliveries, recentWickets] =
      await Promise.all([
        db
          .select({
            total: count(),
            avg_pace: avg(deliveriesTable.pace_kmh),
            max_pace: max(deliveriesTable.pace_kmh),
          })
          .from(deliveriesTable)
          .where(eq(deliveriesTable.session_id, session.id)),

        db
          .select({ count: count() })
          .from(deliveriesTable)
          .where(
            and(
              eq(deliveriesTable.session_id, session.id),
              eq(deliveriesTable.is_legal, true)
            )
          ),

        db
          .select()
          .from(deliveriesTable)
          .where(eq(deliveriesTable.session_id, session.id))
          .orderBy(desc(deliveriesTable.timestamp))
          .limit(10),

        db
          .select()
          .from(wicketsTable)
          .where(eq(wicketsTable.session_id, session.id))
          .orderBy(desc(wicketsTable.timestamp))
          .limit(5),
      ]);

    const totalWickets = await db
      .select({ count: count() })
      .from(wicketsTable)
      .where(eq(wicketsTable.session_id, session.id));

    res.json({
      session: {
        id: session.id,
        created_at: session.created_at.toISOString(),
        status: session.status,
      },
      total_deliveries: Number(stats[0]?.total ?? 0),
      avg_pace_kmh: parseFloat(Number(stats[0]?.avg_pace ?? 0).toFixed(1)),
      max_pace_kmh: parseFloat(Number(stats[0]?.max_pace ?? 0).toFixed(1)),
      total_wickets: Number(totalWickets[0]?.count ?? 0),
      legal_deliveries: Number(legalCount[0]?.count ?? 0),
      recent_deliveries: recentDeliveries.map((d) => ({
        id: d.id,
        session_id: d.session_id,
        pace_kmh: d.pace_kmh,
        is_legal: d.is_legal,
        trajectory: d.trajectory,
        timestamp: d.timestamp.toISOString(),
      })),
      recent_wickets: recentWickets.map((w) => ({
        id: w.id,
        session_id: w.session_id,
        status: w.status,
        impact_force: w.impact_force,
        timestamp: w.timestamp.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard");
    res.status(500).json({ error: "Failed to get dashboard" });
  }
});

export default router;
