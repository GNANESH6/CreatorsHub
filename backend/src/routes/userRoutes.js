import express from "express";
import { 
  updateProfile,
  searchUsers,
  subscribePush,
  getVapidKey
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.get("/search", protect, searchUsers);
router.post("/push/subscribe", protect, subscribePush);
router.get("/push/vapidKey", protect, getVapidKey);

export default router;
