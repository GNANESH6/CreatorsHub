import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireProfileComplete } from "../middleware/profileCompleteMiddleware.js";
import {
  sendRequest,
  updateStatus,
  getConnections,
  getIncomingRequests,
  getOutgoingRequests
} from "../controllers/collaborationController.js";


const router = express.Router();

// Send collaboration request

router.post("/send", protect, requireProfileComplete, sendRequest);

// Accept / Reject request
router.put("/:id", protect, updateStatus);

// Get accepted collaborations
router.get("/connections", protect, getConnections);

// Get incoming pending requests
router.get("/incoming", protect, getIncomingRequests);

// Get outgoing pending requests
router.get("/outgoing", protect, getOutgoingRequests);

export default router;
