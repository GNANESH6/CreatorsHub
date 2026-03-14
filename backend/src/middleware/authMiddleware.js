import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async(req,res,next)=>{

 try{

   let token=req.headers.authorization;

   if(!token || !token.startsWith("Bearer"))
     return res.status(401).json({message:"No token"});

   token=token.split(" ")[1];

   const decoded=jwt.verify(token,process.env.JWT_SECRET);

   const user=await User.findById(decoded.id);

   if(!user) return res.status(401).json({message:"User not found"});

   req.user=user._id;

   next();

 }catch(err){
   res.status(401).json({message:"Not authorized"});
 }

};
