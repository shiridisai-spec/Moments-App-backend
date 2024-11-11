const express = require("express");
const {
  createMoment,
  getAllMoments,
  getSingleMoment,
  updateMoment,
  deleteMoments,
  favouriteYourMoment,
  getAllPublicMomentsOfAllUsers,
  getAllPubliMomentsOfSpecificUser,
  likeUnlikeMoment,
  getAllLikedMomentsOfUser,
} = require("../controllers/momentsControllers");
const upload = require("../middleware/multer");
const router = express.Router();

router.post("/create-moment", upload.single("photo"), createMoment);
router.get("/all-moments", getAllMoments);
router.get("/get-moment/:id", getSingleMoment);
router.put("/update-moment/:id", upload.single("photo"), updateMoment);
router.delete("/delete-moment", deleteMoments);
router.post("/favourite-moments", favouriteYourMoment);
router.get("/get-all-public-moments", getAllPublicMomentsOfAllUsers);
router.get("/get-all-public-moments/:id", getAllPubliMomentsOfSpecificUser);
router.post("/like-unlike-moment", likeUnlikeMoment);
router.get("/get-all-liked-moments", getAllLikedMomentsOfUser);

module.exports = router;
