import express from "express";
import { protect } from "../middleware/authMiddleware.js";



import {
  register,
  login,
  logout,
  deleteAccount,
  getMe
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", protect, logout);

router.delete("/delete", protect, deleteAccount);

router.get("/me", protect, getMe);

export default router;
