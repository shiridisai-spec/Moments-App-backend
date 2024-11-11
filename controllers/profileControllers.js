const { StatusCodes } = require("http-status-codes");
const { pool } = require("../db/connect");
const queries = require("../queries/profileQueries");
const BadRequestError = require("../errors/bad-request");
const CustomAPIError = require("../errors/custom-api");

const cloudinary = require("cloudinary").v2; // Import Cloudinary

// Cloudinary configuration (make sure to add your credentials)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getProfileDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    const userProfileInfo = await pool.query(queries.getProfileInfo, [userId]);
    res.status(StatusCodes.OK).json({
      code: StatusCodes.OK,
      success: true,
      message: "Profile info fetched successfully!",
      profileInfo: userProfileInfo.rows[0],
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);

    if (error instanceof CustomAPIError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "Server error",
      });
    }
  }
};

const uploadUserProfilePicture = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    const photoUrl = result.secure_url;

    const updateUserPicture = await pool.query(queries.updateProfilePicture, [
      photoUrl,
      userId,
    ]);

    if (updateUserPicture.rowCount === 0) {
      throw new BadRequestError("Failed to update profile picture.");
    }
    res.status(StatusCodes.OK).json({
      code: StatusCodes.OK,
      success: true,
      message: "Profile picture updated successfully",
      profilePicture: photoUrl,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);

    if (error instanceof CustomAPIError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        code: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "Server error",
      });
    }
  }
};

module.exports = {
  getProfileDetails,
  uploadUserProfilePicture,
};
