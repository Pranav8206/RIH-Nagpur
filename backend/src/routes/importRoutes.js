import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { uploadCSV } from "../middleware/multerConfig.js";
import { importCSV, parseText } from "../controllers/importController.js";

const router = express.Router();

/**
 * Endpoint: POST /api/import/csv
 * Description: Implents Multer upload with JWT protection
 */
router.post("/csv", protect, uploadCSV.single("transactions_file"), importCSV);

/**
 * Endpoint: POST /api/import/parse-text
 * Description: Parses freeform text into transaction structure
 */
router.post("/parse-text", protect, parseText);

export default router;
