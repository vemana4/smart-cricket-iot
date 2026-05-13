import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import sessionRouter from "./session.js";
import telemetryRouter from "./telemetry.js";
import stumpRouter from "./stump.js";
import deliveriesRouter from "./deliveries.js";
import wicketsRouter from "./wickets.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/session", sessionRouter);
router.use("/telemetry", telemetryRouter);
router.use("/stump", stumpRouter);
router.use("/deliveries", deliveriesRouter);
router.use("/wickets", wicketsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
