import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createConversation,
  getUserConversations,
  getMessages,
  sendMessage,
  clearChat,
  deleteMessage
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/create", protect, createConversation);
router.get("/conversations", protect, getUserConversations);
router.get("/messages/:id", protect, getMessages);
router.post("/send", protect, sendMessage);
router.post("/clear", protect, clearChat);
router.delete("/messages/:messageId", protect, deleteMessage);

export default router;
