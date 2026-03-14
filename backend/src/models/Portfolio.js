import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema({

  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    index:true
  },

  title:{
    type:String,
    required:true,
    trim:true
  },

  description:{
    type:String,
    required:true,
    trim:true
  },

  // uploaded file path (local storage)
  fileUrl:{
    type:String
  },

  // file category
  fileType:{
    type:String,
    enum:["image","video","audio","document"]
  }

},{timestamps:true});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

export default Portfolio;
