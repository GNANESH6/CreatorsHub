import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure the local uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Local Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique name: timestamp + original extension
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @route   POST /api/upload
// @desc    Upload a single file (image, video, or doc)
// @access  Private
router.post("/", protect, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Generate public URL assuming server runs on localhost:5002 in dev
  // In production, this should ideally be an environment variable (e.g. process.env.BASE_URL)
  const baseUrl = process.env.BASE_URL || "https://creatorshub-b7zg.onrender.com";
  
  // URL to access the file publicly
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  res.json({
    message: "File uploaded successfully",
    fileUrl: fileUrl,
    fileType: req.file.mimetype,
    fileName: req.file.originalname,
  });
});

export default router;
