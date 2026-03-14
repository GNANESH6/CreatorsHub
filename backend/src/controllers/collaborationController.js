import mongoose from "mongoose";
import Collaboration from "../models/Collaboration.js";

/*
====================================
SEND REQUEST
====================================
*/
export const sendRequest = async (req, res) => {

  try {

    const senderId = req.user;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }

    if (receiverId.toString() === senderId.toString()) {
      return res.status(400).json({ message: "Cannot send to yourself" });
    }

    // Check existing collaboration (both directions)
    const exists = await Collaboration.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (exists) {
      if (exists.status === "rejected") {
        await exists.deleteOne(); // Reset by deleting rejected one
      } else {
        return res.status(400).json({ message: "Collaboration already exists or is pending" });
      }
    }

    const collab = await Collaboration.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending"
    });


    res.status(201).json(collab);

  } catch (err) {
    console.error("Send Request Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/*
====================================
ACCEPT / REJECT
====================================
*/
export const updateStatus = async (req, res) => {

  try {

    const userId = req.user;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid collaboration ID" });
    }

    const collab = await Collaboration.findById(req.params.id);

    if (!collab) {
      return res.status(404).json({ message: "Collaboration not found" });
    }

    // Only receiver can update
    if (collab.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (collab.status !== "pending") {
      return res.status(400).json({ message: "Already processed" });
    }

    collab.status = status;
    await collab.save();

    if (status === "accepted") {
    }

    res.json(collab);

  } catch (err) {
    console.error("Update Status Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/*
====================================
GET CONNECTIONS
====================================
*/
export const getConnections = async (req, res) => {

  try {

    const userId = req.user;

    const connections = await Collaboration.find({
      status: "accepted",
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }).populate("sender receiver", "name email occupation locationName");

    res.json(connections);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

};


/*
====================================
INCOMING REQUESTS
====================================
*/
export const getIncomingRequests = async (req, res) => {

  try {

    const incoming = await Collaboration.find({
      receiver: req.user,
      status: "pending"
    }).populate("sender", "name email occupation locationName");

    res.json(incoming);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

};


/*
====================================
OUTGOING REQUESTS
====================================
*/
export const getOutgoingRequests = async (req, res) => {

  try {

    const outgoing = await Collaboration.find({
      sender: req.user,
      status: "pending"
    }).populate("receiver", "name email occupation locationName");

    res.json(outgoing);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

};
