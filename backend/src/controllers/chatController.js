import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import Collaboration from "../models/Collaboration.js";
import User from "../models/User.js";
import webpush from "web-push";

/*
====================================
CREATE CONVERSATION
====================================
*/
export const createConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "UserId required" });
    }

    const allowed = await Collaboration.findOne({
      status: "accepted",
      $or: [
        { sender: req.user, receiver: userId },
        { sender: userId, receiver: req.user }
      ]
    });

    if (!allowed) {
      return res.status(403).json({ message: "Collaboration required" });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [req.user, userId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [req.user, userId]
      });
    }

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/*
====================================
GET USER CONVERSATIONS
====================================
*/
export const getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user] }
    })
    .populate("members", "_id name profileImage")
    .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/*
====================================
SEND MESSAGE
====================================
*/
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, fileUrl, fileType, replyTo } = req.body;

    if (!conversationId || (!text && !fileUrl)) {
      return res.status(400).json({ message: "Missing data" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMember = conversation.members.some(
      member => member.toString() === req.user.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const msg = await Message.create({
      conversationId,
      sender: req.user,
      text: text || "",
      fileUrl,
      fileType,
      replyTo: replyTo || null
    });

    const populatedMsg = await Message.findById(msg._id).populate('replyTo');

    conversation.lastMessage = fileUrl ? "Sent an attachment" : text;
    await conversation.save();

    const receiverId = conversation.members.find(m => m.toString() !== req.user.toString());
    
    if (receiverId) {
      if (req.io) {
        const room = req.io.sockets.adapter.rooms.get(receiverId.toString());
        const isOnline = room && room.size > 0;
        
        if (isOnline) {
          req.io.to(receiverId.toString()).emit("receiveMessage", populatedMsg);
        } else {
          const receiver = await User.findById(receiverId);
          if (receiver && receiver.pushSubscription) {
            const senderUser = await User.findById(req.user);
            const payload = JSON.stringify({
              title: `New message from ${senderUser?.name || 'someone'}`,
              body: text || (fileUrl ? 'Sent an attachment' : 'New message'),
              icon: '/icon.png',
              data: {
                url: `/chat/${req.user.toString()}`
              }
            });
            try {
              await webpush.sendNotification(receiver.pushSubscription, payload);
            } catch (err) {
              console.error("Push notification error:", err);
              if (err.statusCode === 410) {
                await User.findByIdAndUpdate(receiverId, { pushSubscription: null });
              }
            }
          }
        }
      }
    }

    res.json(populatedMsg);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/*
====================================
GET MESSAGES
====================================
*/
export const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const msgs = await Message.find({
      conversationId: req.params.id,
      deletedBy: { $ne: req.user }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('replyTo');

    res.json(msgs.reverse());

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/*
====================================
CLEAR CHAT (FOR ONE USER)
====================================
*/
export const clearChat = async (req, res) => {
  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMember = conversation.members.some(
      member => member.toString() === req.user.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Message.updateMany(
      { conversationId: conversationId },
      { $addToSet: { deletedBy: req.user } }
    );

    res.json({ message: "Chat cleared and deleted from history" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


/*
====================================
DELETE MESSAGE (For Me / For Everyone)
====================================
*/
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { type } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const messageConversation = await Conversation.findById(message.conversationId);
    
    if (type === 'forMe') {
      if (!message.deletedBy.includes(req.user)) {
        message.deletedBy.push(req.user);
        await message.save();
      }
      return res.json({ message: "Deleted for you" });
    }

    if (type === 'forEveryone') {
      if (message.sender.toString() !== req.user.toString()) {
        return res.status(403).json({ message: "You can only delete your own messages for everyone" });
      }

      message.deletedForEveryone = true;
      message.text = "This message was deleted";
      message.fileUrl = null;
      message.fileType = null;
      await message.save();

      if (messageConversation) {
        const receiverId = messageConversation.members.find(m => m.toString() !== req.user.toString());
        if (receiverId && req.io) {
          req.io.to(receiverId.toString()).emit("messageDeleted", { messageId, deletedForEveryone: true });
        }
      }

      return res.json({ message: "Deleted for everyone", updatedMessage: message });
    }

    res.status(400).json({ message: "Invalid delete type" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
