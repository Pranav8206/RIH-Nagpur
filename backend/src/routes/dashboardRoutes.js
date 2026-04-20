import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMetrics,
  getTimeline,
  getTopAnomalies,
  getByDepartment,
  getByVendor,
  computeMetricsCache,
  computeMetricsSchema
} from "../controllers/dashboardController.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

/**
 * Endpoints
 * Ensure this route is mounted safely nested securely below standard JWT express extraction setups!
 */

router.use(protect);

router.get("/metrics", getMetrics);
router.get("/timeline", getTimeline);
router.get("/top-anomalies", getTopAnomalies);
router.get("/by-department", getByDepartment);
router.get("/by-vendor", getByVendor);

// POST requests validation wraps logic securely checking dates
router.post("/metrics/compute", validateRequest(computeMetricsSchema, "body"), computeMetricsCache);

export default router;
