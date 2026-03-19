import Portfolio from "../models/Portfolio.js";

/*
==============================
CREATE PORTFOLIO
==============================
*/

export const createPortfolio = async (req, res) => {
  try {
    const { title, description } = req.body;
    let { fileUrl, fileType } = req.body;

    // If a file was uploaded via multer
    if (req.file) {
      fileUrl = `${process.env.BASE_URL || 'https://creatorshub-b7zg.onrender.com'}/uploads/${req.file.filename}`;
      // Map mimetype to our enum
      const mime = req.file.mimetype;
      if (mime.startsWith("image/")) fileType = "image";
      else if (mime.startsWith("video/")) fileType = "video";
      else fileType = "document";
    }

    const portfolio = await Portfolio.create({
      userId: req.user,
      title,
      description: description || "Portfolio item",
      fileUrl,
      fileType: fileType || "image"
    });

    res.json(portfolio);

 }catch(err){

   console.log(err);

   res.status(500).json({
     message:"Portfolio creation failed"
   });

 }

};

/*
==============================
GET USER PORTFOLIOS
==============================
*/

export const getMyPortfolios = async (req,res)=>{

 try{

   const portfolios = await Portfolio.find({
     userId:req.user
   });

   res.json(portfolios);

 }catch(err){

   res.status(500).json({
     message:"Error fetching portfolios"
   });

 }

};

/*
==============================
GET ANY USER'S PORTFOLIOS
==============================
*/

export const getUserPortfolios = async (req,res)=>{

 try{

   const portfolios = await Portfolio.find({
     userId: req.params.userId
   });

   res.json(portfolios);

 }catch(err){

   res.status(500).json({
     message:"Error fetching portfolios"
   });

 }

};

/*
==============================
DELETE PORTFOLIO
==============================
*/

export const deletePortfolio = async (req,res)=>{

 try{

   const portfolio = await Portfolio.findById(req.params.id);

   if(!portfolio){
     return res.status(404).json({
       message:"Portfolio not found"
     });
   }

   // 🔥 Security check
   // only owner can delete
   if(portfolio.userId.toString() !== req.user.toString()){
     return res.status(403).json({
       message:"Not authorized"
     });
   }

   await portfolio.deleteOne();

   res.json({
     message:"Portfolio deleted successfully"
   });

 }catch(err){

   console.log(err);

   res.status(500).json({
     message:"Delete failed"
   });

 }

};
