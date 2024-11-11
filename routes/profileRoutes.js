const express = require("express");
const upload = require("../middleware/multer");
const {
  getProfileDetails,
  uploadUserProfilePicture,
} = require("../controllers/profileControllers");

const router = express.Router();

router.get("/get-profile-details", getProfileDetails);
router.post(
  "/upload-profile-picture",
  upload.single("photo"),
  uploadUserProfilePicture
);

module.exports = router;
