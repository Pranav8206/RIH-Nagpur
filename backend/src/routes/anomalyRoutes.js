import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  detectAnomaliesFlow,
  getAnomalies,
  getAnomalyById,
  updateAnomaly,
  updateAnomalySchema
} from "../controllers/anomalyController.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

/**
 * Endpoints
 * Ensure this route is mounted below JWT middleware (e.g., app.use('/api/anomalies', auth, anomalyRoutes))
 */

router.use(protect);

router.post("/detect", detectAnomaliesFlow);
router.get("/", getAnomalies);
router.get("/:id", getAnomalyById);
router.patch("/:id", validateRequest(updateAnomalySchema, "body"), updateAnomaly);

export default router;
