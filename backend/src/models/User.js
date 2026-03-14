import mongoose from "mongoose";

const schema = new mongoose.Schema({

  name:{ type:String, required:true, trim:true },

  email:{
    type:String,
    unique:true,
    required:true,
    lowercase:true
  },

  password:{
    type:String,
    required:true,
    select:false
  },

  // profile fields optional initially
  occupation:String,
  skills:[String],
  bio:String,
  profileImage:String,
  locationName:String,

  location:{
    type:{ type:String, enum:["Point"], default:"Point" },
    coordinates:{ type:[Number], default:[0,0] }
  },

  isProfileComplete:{
    type:Boolean,
    default:false
  }

},{timestamps:true});

schema.index({location:"2dsphere"});

export default mongoose.model("User",schema);
