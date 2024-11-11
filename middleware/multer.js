// middleware/multer.js
const multer = require("multer");
const path = require("path");
const os = require("os");

// Define the path to the Downloads folder
const downloadsPath = path.join(os.homedir(), "Downloads");

// Define storage for the images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, downloadsPath); // Use the Downloads folder
  },
  filename: (req, file, cb) => {
    // Create a unique filename to avoid name collisions
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// Export the upload middleware
module.exports = upload;
