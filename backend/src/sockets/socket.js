import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Collaboration from "../models/Collaboration.js";

const onlineUsers = new Map(); // userId -> socketId

export const initSocket = (io) => {

 io.use((socket, next) => {
   try {
     const token = socket.handshake.auth.token;
     if (!token) return next(new Error("Unauthorized"));
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     socket.userId = decoded.id;
     next();
   } catch {
     next(new Error("Unauthorized"));
   }
 });

 io.on("connection", (socket) => {
   const userId = socket.userId;
   
   // Add user to online tracking
   onlineUsers.set(userId, socket.id);
   socket.join(userId);

   // Broadcast to all clients that this user is online
   io.emit("userOnline", userId);

   // Send this specific client the array of all online users
   socket.emit("onlineUsersList", Array.from(onlineUsers.keys()));

   // Handle marking messages as seen
   socket.on("markAsSeen", async ({ messageIds, senderId }) => {
     try {
       await Message.updateMany(
         { _id: { $in: messageIds } },
         { $set: { seen: true } }
       );
       // Notify the original sender that their messages were seen
       io.to(senderId).emit("messagesSeen", { receiverId: userId, messageIds });
     } catch (err) {
       console.error("markAsSeen error:", err);
     }
   });

   // Handle Call Signaling
   socket.on("incomingCall", ({ targetId, callerName }) => {
     const targetSocketId = onlineUsers.get(targetId);
     if (targetSocketId) {
       io.to(targetSocketId).emit("incomingCall", { callerId: userId, callerName });
     }
   });

   socket.on("callAnswered", ({ targetId }) => {
     const targetSocketId = onlineUsers.get(targetId);
     if (targetSocketId) {
       io.to(targetSocketId).emit("callAnswered");
     }
   });

   socket.on("callRejected", ({ targetId }) => {
     const targetSocketId = onlineUsers.get(targetId);
     if (targetSocketId) {
       io.to(targetSocketId).emit("callRejected");
     }
   });

   socket.on("callEnded", ({ targetId }) => {
     const targetSocketId = onlineUsers.get(targetId);
     if (targetSocketId) {
       io.to(targetSocketId).emit("callEnded");
     }
   });

   // Handle WebRTC Realtime Audio Streaming Signaling
   socket.on("webrtcOffer", ({ targetId, sdp }) => {
     const targetSocketId = onlineUsers.get(targetId);
     if (targetSocketId) {
       io.to(targetSocketId).emit("webrtcOffer", { callerId: userId, sdp });
     }
   });

   socket.on("webrtcAnswer", ({ targetId, sdp }) => {
     const targetSocketId = onlineUsers.get(targetId);
     if (targetSocketId) {
       io.to(targetSocketId).emit("webrtcAnswer", { receiverId: userId, sdp });
     }
   });

   socket.on("iceCandidate", ({ targetId, candidate }) => {
     const targetSocketId = onlineUsers.get(targetId);
     if (targetSocketId) {
       io.to(targetSocketId).emit("iceCandidate", { senderId: userId, candidate });
     }
   });

   socket.on("typing", ({ targetId }) => {
     const targetSocketId = onlineUsers.get(targetId);
     if (targetSocketId) {
       io.to(targetSocketId).emit("typing", { senderId: userId });
     }
   });

   socket.on("stopTyping", ({ targetId }) => {
     const targetSocketId = onlineUsers.get(targetId);
     if (targetSocketId) {
       io.to(targetSocketId).emit("stopTyping", { senderId: userId });
     }
   });

   socket.on("disconnect", () => {
     onlineUsers.delete(userId);
     io.emit("userOffline", userId);
   });
 });

};
