import mongoose from "mongoose";

const schema = new mongoose.Schema({

 members:[
   {
     type:mongoose.Schema.Types.ObjectId,
     ref:"User"
   }
 ],

 lastMessage:String

},{timestamps:true});

export default mongoose.model("Conversation",schema);
