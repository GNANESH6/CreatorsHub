import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import webpush from "web-push";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import connectDB from "./config/db.js";
import { initSocket } from "./sockets/socket.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

// Ensure VAPID keys exist
const vapidPath = path.join(__dirname, "../.env.vapid");
if (!fs.existsSync(vapidPath)) {
  const keys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidPath, `VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`);
}
dotenv.config({ path: vapidPath });
try {
  webpush.setVapidDetails('mailto:admin@creatorshub.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
} catch(e) { console.error("WebPush config error:", e); }

const startServer=async()=>{

 await connectDB();

 const app=express();

 app.use(cors({
   origin: process.env.FRONTEND_URL || "*"
 }));
 app.use(express.json());
 app.use("/uploads", express.static(path.join(__dirname, "uploads")));

 const server=http.createServer(app);

 const io=new Server(server,{
   cors:{
     origin: process.env.FRONTEND_URL || "*"
   }
 });

 initSocket(io);

 app.use((req,res,next)=>{
   req.io=io;
   next();
 });

 app.use("/api/auth",authRoutes);
 app.use("/api/users",userRoutes);
 app.use("/api/collaboration",collaborationRoutes);
 app.use("/api/portfolio",portfolioRoutes);
 app.use("/api/chat",chatRoutes);
 app.use("/api/reviews", reviewRoutes);
 app.use("/api/upload", uploadRoutes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    if (err instanceof Error) {
      console.error("Server Error:", err.message);
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "An unexpected error occurred" });
  });

  server.listen(process.env.PORT || 5002, () => {
    console.log(`Server running on port ${process.env.PORT || 5002}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ PORT CONFLICT: Port ${process.env.PORT || 5002} is already in use.`);
      console.error(`💡 SOLUTION: A stray backend process is likely running. I am attempting to fix this for you...`);
      process.exit(1);
    } else {
      console.error('Server Error:', err);
    }
  });

};

startServer();


