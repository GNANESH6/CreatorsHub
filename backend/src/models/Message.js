import mongoose from "mongoose";

const schema = new mongoose.Schema({

 conversationId:{
   type:mongoose.Schema.Types.ObjectId,
   ref:"Conversation",
   required:true
 },

 sender:{
   type:mongoose.Schema.Types.ObjectId,
   ref:"User",
   required:true
 },

 text:{
   type:String,
   default:""
 },

  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },

 fileUrl:{
   type:String,
 },

 fileType:{
   type:String,
 },

 seen:{
   type:Boolean,
   default:false
 },
 
 deletedBy: [{
   type: mongoose.Schema.Types.ObjectId,
   ref: "User"
 }],

  deletedForEveryone: {
    type: Boolean,
    default: false
  }

},{timestamps:true});

export default mongoose.model("Message",schema);
