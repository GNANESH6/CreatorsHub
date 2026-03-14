import User from "../models/User.js";

export const requireProfileComplete = async (req,res,next)=>{

 try{

   const user = await User.findById(req.user);

   if(!user){
     return res.status(404).json({
       message:"User not found"
     });
   }

   if(!user.isProfileComplete){
     return res.status(403).json({
       message:"Complete profile before using this feature"
     });
   }

   next();

 }catch(err){

   console.log(err);

   res.status(500).json({
     message:"Server error"
   });

 }

};
