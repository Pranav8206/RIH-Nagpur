import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  classifyFlow,
  getClassifications,
  getClassificationById,
  updateClassification,
  updateClassificationSchema
} from "../controllers/classificationController.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

/**
 * Endpoints
 * Ensure this route is mounted below JWT middleware.
 */

router.use(protect);

router.post("/classify", classifyFlow);
router.get("/", getClassifications);
router.get("/:id", getClassificationById);
router.patch("/:id", validateRequest(updateClassificationSchema, "body"), updateClassification);

export default router;
