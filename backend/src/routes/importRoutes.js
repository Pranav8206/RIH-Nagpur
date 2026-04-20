import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { uploadCSV } from "../middleware/multerConfig.js";
import { importCSV } from "../controllers/importController.js";

const router = express.Router();

/**
 * Endpoint: POST /api/import/csv
 * Description: Implents Multer upload with JWT protection
 */
router.post("/csv", protect, uploadCSV.single("transactions_file"), importCSV);

export default router;
