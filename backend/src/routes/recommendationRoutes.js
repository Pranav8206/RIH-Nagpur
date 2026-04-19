import express from "express";
import {
  generateFlow,
  getRecommendations,
  getRecommendationById,
  executeRecommendation,
  rejectRecommendation,
  exportRecommendation,
  executeRecommendationSchema,
  rejectRecommendationSchema
} from "../controllers/recommendationController.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

/**
 * Endpoints
 * Ensure this route is mounted below JWT middleware mapped via app.use
 */

router.post("/generate", generateFlow);
router.get("/", getRecommendations);
router.get("/:id", getRecommendationById);
router.patch("/:id/execute", validateRequest(executeRecommendationSchema, "body"), executeRecommendation);
router.patch("/:id/reject", validateRequest(rejectRecommendationSchema, "body"), rejectRecommendation);
router.get("/:id/export", exportRecommendation); 

export default router;
