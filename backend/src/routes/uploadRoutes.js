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

  const upload = (req, res, next) => {
    const multerUpload = multer({ 
      storage,
      limits: { fileSize: 50 * 1024 * 1024 } 
    }).single("file");

    multerUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Multer error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ message: `Unknown upload error: ${err.message}` });
      }
      next();
    });
  };

  router.post("/", protect, upload, (req, res) => {
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
