import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  createTransactionSchema,
  updateTransactionSchema
} from "../controllers/transactionController.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

/**
 * Endpoints
 * 
 * Note: These routes explicitly assume mounting below an Express JWT validation layer.
 * Usually implemented via: app.use('/api/transactions', jwtMiddleware, transactionRoutes)
 * That guarantees `req.user.id` exists prior to hitting controllers.
 */

router.use(protect);

router.post("/", validateRequest(createTransactionSchema, "body"), createTransaction);
router.get("/", getTransactions);
router.get("/:id", getTransactionById);
router.patch("/:id", validateRequest(updateTransactionSchema, "body"), updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
