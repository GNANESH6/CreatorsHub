import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  createPortfolio,
  getMyPortfolios,
  getUserPortfolios,
  deletePortfolio
} from "../controllers/portfolioController.js";

const router = express.Router();

router.post("/", protect, upload.single("file"), createPortfolio);
router.get("/", protect, getMyPortfolios);
router.get("/:userId", protect, getUserPortfolios);

// 🔥 DELETE ROUTE
router.delete("/:id", protect, deletePortfolio);

export default router;
