import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getUserById,
  updateCurrentUser,
  changePassword,
  logoutUser,
  deleteAccount,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);

router.get("/profile", protect, getCurrentUser);
router.get("/:userId", protect, getUserById);
router.patch("/profile", protect, updateCurrentUser);
router.delete("/profile", protect, deleteAccount);
router.patch("/password", protect, changePassword);

export default router;
