import { Router } from "express";

const router = Router();

// GET /api/info — returns runtime config the frontend needs
router.get("/", (_req, res) => {
  const domains = process.env["REPLIT_DOMAINS"] ?? "";
  const primary = domains.split(",")[0]?.trim();
  const public_url = primary ? `https://${primary}` : null;

  res.json({
    public_url,
    telemetry_url: public_url ? `${public_url}/api/telemetry` : null,
    calibrate_url: public_url ? `${public_url}/api/calibrate` : null,
    stump_url: public_url ? `${public_url}/api/stump` : null,
  });
});

export default router;
