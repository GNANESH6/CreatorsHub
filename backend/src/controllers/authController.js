import User from "../models/User.js";
import Collaboration from "../models/Collaboration.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/*
================================
GENERATE TOKEN
================================
*/

const generateToken = (id) => {

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

};


/*
================================
REGISTER (FIXED)
================================
*/
export const register = async(req,res)=>{

 try{

    const {name,email,password} = req.body;

    if(!name || !email || !password)
      return res.status(400).json({message:"Missing fields"});

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email structure. Use yourname@gmail.com" });
    }

    const exists = await User.findOne({email});

   if(exists)
     return res.status(400).json({message:"User exists"});

   const hashed = await bcrypt.hash(password,10);

   const user = await User.create({
     name,
     email,
     password:hashed
   });

   res.json({
     _id:user._id,
     token:generateToken(user._id)
   });

 }catch(err){
   res.status(500).json({message:"Server error"});
 }

};


/*
================================
LOGIN
================================
*/

export const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email structure. Use yourname@gmail.com" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    res.json({
      _id: user._id,
      token: generateToken(user._id)
    });

  } catch (err) {

    console.error("Login Error:", err);

    res.status(500).json({
      message: "An internal server error occurred during login"
    });

  }

};


/*
================================
LOGOUT
================================
*/

export const logout = async (req, res) => {

  res.json({
    message: "Logged out successfully"
  });

};


/*
================================
DELETE ACCOUNT
================================
*/

export const deleteAccount = async (req, res) => {

  try {

    const userId = req.user;

    await Collaboration.deleteMany({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    });

    const conversations = await Conversation.find({
      members: userId
    });

    const conversationIds = conversations.map(c => c._id);

    await Message.deleteMany({
      conversationId: { $in: conversationIds }
    });

    await Conversation.deleteMany({
      members: userId
    });


    await User.findByIdAndDelete(userId);

    res.json({
      message: "Account deleted successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }

};

export const getMe = async (req,res)=>{
  const user = await User.findById(req.user).select("-password");
  res.json(user);
};

