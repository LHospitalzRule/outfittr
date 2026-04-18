const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('./cloudinaryConfig'); 
// Assuming you have a models folder or Item defined somewhere
// const Item = require('./models/Item'); 

const upload = multer({ storage });

// This route handles the image upload and database save
router.post('/add-item', upload.single('image'), async (req, res) => {
  try {
    // req.file.path is the URL returned from Cloudinary
    const imageUrl = req.file.path;
    
    // Here you would save to MongoDB:
    // const newItem = await Item.create({ ...req.body, imageUrl });
    
    res.status(200).json({ 
      message: "Image uploaded successfully!",
      url: imageUrl 
    });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = router;