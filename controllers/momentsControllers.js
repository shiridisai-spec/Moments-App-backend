const { StatusCodes } = require("http-status-codes");
const { pool } = require("../db/connect");
const queries = require("../queries/momentQueries");
const BadRequestError = require("../errors/bad-request");
const CustomAPIError = require("../errors/custom-api");

const cloudinary = require("cloudinary").v2; // Import Cloudinary

// Cloudinary configuration (make sure to add your credentials)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createMoment = async (req, res) => {
  const { title, description, category, ispublic, tags: tagsString } = req.body;
  const userId = req.user.id;

  // Parse tags to ensure it's an array
  const tags =
    typeof tagsString === "string" ? JSON.parse(tagsString) : tagsString;

  if (!title || !category || !ispublic || !tags || !Array.isArray(tags)) {
    throw new BadRequestError(
      "All fields are required, and tags must be an array"
    );
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    const photoUrl = result.secure_url;

    const existingMoment = await pool.query(queries.checkIfMomentExists, [
      title,
      userId,
    ]);

    if (existingMoment.rowCount > 0) {
      throw new BadRequestError("Moment with this title already exists");
    }

    const createMoment = await pool.query(queries.createMoment, [
      title,
      description,
      category,
      ispublic,
      photoUrl,
      userId,
    ]);

    const momentId = createMoment.rows[0]?.moment_id;

    // Process each tag in the tags array
    for (let tag of tags) {
      let tagId;
      const tagsResult = await pool.query(queries.checkExistingTagForUser, [
        userId,
        tag,
      ]);

      if (tagsResult.rowCount > 0) {
        tagId = tagsResult.rows[0]?.tag_id;
      } else {
        const insertTagsResult = await pool.query(queries.insertNewTag, [
          userId,
          tag,
        ]);
        tagId = insertTagsResult.rows[0]?.tag_id;
      }

      console.log("Current Tag:", tag);
      console.log("Tag ID:", tagId);

      // Check if the tag is already associated with the moment
      const existingMomentTagResult = await pool.query(
        queries.checkIfTagAssociatedWithMoment,
        [momentId, tagId]
      );

      if (!tagId) {
        throw new BadRequestError("Failed to get tag ID.");
      }

      // Associate the tag with the moment
      if (existingMomentTagResult.rowCount === 0) {
        await pool.query(queries.insertMomentTag, [momentId, tagId]);
      }
    }

    res.status(StatusCodes.CREATED).json({
      code: StatusCodes.CREATED,
      success: true,
      message: "Moment created successfully",
      moment: {
        moment_id: momentId,
        title,
        description,
        category,
        ispublic,
        photo: photoUrl,
        tags,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating moment:", error);

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

const getAllMoments = async (req, res) => {
  const userId = req.user.id;

  try {
    const allMoments = await pool.query(queries.getAllMoments, [userId]);
    res.status(StatusCodes.OK).json({
      code: StatusCodes.OK,
      success: true,
      message: "Moments fetched successfully!",
      allMoments: allMoments.rows,
    });
  } catch (error) {
    console.error("Error get all moments:", error);

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

const getSingleMoment = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  try {
    const singleMoment = await pool.query(queries.getSingleMoment, [
      userId,
      id,
    ]);
    if (singleMoment.rowCount === 0) {
      throw new BadRequestError("Moment doesn't exist");
    } else {
      res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        success: true,
        message: "Moment fetched successfully!",
        moment: singleMoment.rows[0],
      });
    }
  } catch (error) {
    console.error("Error getting moment:", error);

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

const updateMoment = async (req, res) => {
  const { title, description, category, ispublic, tags: tagsString } = req.body;
  const momentId = req.params.id;
  const userId = req.user.id;

  // Parse tags to ensure it's an array
  const tags =
    typeof tagsString === "string" ? JSON.parse(tagsString) : tagsString;

  try {
    // Check if a file is provided
    if (!req.file) {
      throw new BadRequestError("File not provided.");
    }

    const result = await cloudinary.uploader.upload(req.file.path);
    const photoUrl = result.secure_url;

    const updateMoment = await pool.query(queries.updateMoment, [
      title,
      description,
      category,
      ispublic,
      photoUrl,
      userId,
      momentId,
    ]);

    if (updateMoment.rowCount === 0) {
      throw new BadRequestError("Moment does not exist!");
    }

    for (let tag of tags) {
      let tagId;
      const tagsResult = await pool.query(queries.checkExistingTagForUser, [
        userId,
        tag,
      ]);

      if (tagsResult.rowCount > 0) {
        tagId = tagsResult.rows[0]?.tag_id;
      } else {
        const insertTagsResult = await pool.query(queries.insertNewTag, [
          userId,
          tag,
        ]);
        tagId = insertTagsResult.rows[0]?.tag_id;
      }

      console.log("Current Tag:", tag);
      console.log("Tag ID:", tagId);

      // Check if the tag is already associated with the moment
      const existingMomentTagResult = await pool.query(
        queries.checkIfTagAssociatedWithMoment,
        [momentId, tagId]
      );

      if (!tagId) {
        throw new BadRequestError("Failed to get tag ID.");
      }

      //Associate the tag with the moment
      if (existingMomentTagResult.rowCount === 0) {
        await pool.query(queries.insertMomentTag, [momentId, tagId]);
      }
    }

    res.status(StatusCodes.OK).json({
      code: StatusCodes.OK,
      success: true,
      message: `Moment updated successfully for moment ID : ${momentId}`,
    });
  } catch (error) {
    console.error("Error updating moment:", error);

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

const deleteMoments = async (req, res) => {
  const { moments } = req.body;
  const userId = req.user.id;

  if (!moments || !Array.isArray(moments) || moments.length === 0) {
    throw new BadRequestError("Please select momentst to delete");
  }

  try {
    const deletedMoments = await pool.query(queries.deleteMoments, [
      userId,
      moments,
    ]);
    if (deletedMoments.rowCount > 0) {
      res.status(StatusCodes.ACCEPTED).json({
        code: StatusCodes.ACCEPTED,
        success: true,
        message: `Moment deleted for moment ID : ${moments}`,
      });
    } else {
      throw new notFoundError("Moments not found!");
    }
  } catch (error) {
    console.log("Error deleting moments:", error);
    if (error instanceof CustomAPIError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Server error",
      });
    }
  }
};

const favouriteYourMoment = async (req, res) => {
  const { moments } = req.body;
  const userId = req.user.id;

  if (!moments || !Array.isArray(moments) || moments.length === 0) {
    throw new BadRequestError("Please select moments to favourite");
  }

  try {
    for (const { moment_id, is_favourite } of moments) {
      // Check if favourite exists
      const favouriteExists = await pool.query(queries.favouriteExists, [
        userId,
        moment_id,
      ]);

      if (favouriteExists.rowCount > 0) {
        if (is_favourite) {
          // Update existing favorite status to true
          await pool.query(queries.updateFavourite, [
            is_favourite,
            userId,
            moment_id,
          ]);
        } else {
          // Delete favorite entry if is_favourite is false
          await pool.query(queries.deleteFavourite, [userId, moment_id]);
        }
      } else if (is_favourite) {
        // Insert a new favorite if it doesn't exist and is_favourite is true
        await pool.query(queries.insertFavourite, [
          userId,
          moment_id,
          is_favourite,
        ]);
      }
    }

    res.status(StatusCodes.OK).json({
      code: StatusCodes.OK,
      success: true,
      message: `Favorites updated successfully`,
    });
  } catch (error) {
    console.error("Error updating favorites:", error);
    if (error instanceof CustomAPIError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Server error",
      });
    }
  }
};

const getAllPublicMomentsOfAllUsers = async (req, res) => {
  const userId = req.user.id;

  try {
    const getAllPublicMomentsOfAllUsers = `
    SELECT 
        m.user_id,
        u.user_name, 
        m.moment_id, 
        m.title, 
        m.description, 
        m.category, 
        m.ispublic, 
        m.photo, 
        ARRAY_AGG(DISTINCT t.name) AS tags, 
        COALESCE(l.no_of_likes, 0) AS total_likes, 
        COALESCE(l.liked_by, array[]::TEXT[]) AS liked_by, 
        m.created_at, 
        m.updated_at,
        CASE
          WHEN EXISTS (
              SELECT 1 
            FROM likes l
            WHERE l.moment_id = m.moment_id AND l.user_id = $1
          ) THEN true
          ELSE false
        END AS is_liked
        FROM moments m 
        INNER JOIN users u 
        ON m.user_id = u.user_id 
        INNER JOIN moment_tags mt 
        ON m.moment_id = mt.moment_id 
        INNER JOIN tags t 
        ON mt.tag_id = t.tag_id 
        LEFT JOIN (
          SELECT moment_id, 
          COUNT(*) AS no_of_likes, 
          array_agg(u.user_name) 
          AS liked_by 
          FROM likes l 
          INNER JOIN users u 
          ON l.user_id = u.user_id 
          GROUP BY moment_id
        ) l ON m.moment_id = l.moment_id 
        WHERE m.ispublic = true 
        GROUP BY m.moment_id, u.user_name, m.user_id, m.title, m.description, m.category, m.ispublic, m.photo, m.created_at, m.updated_at, l.no_of_likes, l.liked_by
      `;
    const allPublicMomentsOfAllUsers = await pool.query(
      getAllPublicMomentsOfAllUsers,
      [userId]
    );
    res.status(StatusCodes.OK).json({
      code: StatusCodes.OK,
      success: true,
      message: `Fetched all public moments of all users successfully`,
      allMoments: allPublicMomentsOfAllUsers.rows,
    });
  } catch (error) {
    console.error("Error getting all public moments:", error);
    if (error instanceof CustomAPIError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Server error",
      });
    }
  }
};

const getAllPubliMomentsOfSpecificUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const publicMomentsOfUser = await pool.query(
      queries.getAllPublicMomentsOfSpecificUser,
      [userId]
    );

    if (publicMomentsOfUser.rowCount === 0) {
      res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        success: true,
        message: "Moments fetched",
        allMoments: [],
      });
    } else {
      res.status(StatusCodes.OK).json({
        code: StatusCodes.OK,
        success: true,
        message: "Moments fetched",
        allMoments: publicMomentsOfUser.rows,
      });
    }
  } catch (error) {
    console.error("Error fetching all moments:", error);
    if (error instanceof CustomAPIError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Server error",
      });
    }
  }
};

const likeUnlikeMoment = async (req, res) => {
  const { moment_id, is_liked } = req.body;
  const userId = req.user.id;

  if (!moment_id) {
    throw new BadRequestError("Moment ID is required");
  }

  try {
    if (is_liked) {
      const likeResult = await pool.query(queries.likeMoment, [
        userId,
        moment_id,
      ]);
    } else {
      const unlikeResult = await pool.query(queries.unlikeMoment, [
        userId,
        moment_id,
      ]);
    }

    res.status(StatusCodes.OK).json({
      code: StatusCodes.OK,
      success: true,
      message: is_liked
        ? "Moment liked successfully"
        : "Moment unliked successfully",
    });
  } catch (error) {
    console.error("Error liking/unliking moment:", error);
    if (error instanceof CustomAPIError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Server error",
      });
    }
  }
};

const getAllLikedMomentsOfUser = async (req, res) => {
  const userId = req.user.id;
  try {
  } catch (error) {}
};

module.exports = {
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
};
