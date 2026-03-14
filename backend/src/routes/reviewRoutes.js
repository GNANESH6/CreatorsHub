import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addReview, getUserReviews } from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", protect, addReview);
router.get("/:userId", protect, getUserReviews);

export default router;
