const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../db/connect");
const queries = require("../queries/authQueries");
const sgMail = require("@sendgrid/mail");
const BadRequestError = require("../errors/bad-request");
const CustomAPIError = require("../errors/custom-api");

// SendGrid configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const registerUser = async (req, res) => {
  const { user_name, user_email, user_role, user_password } = req.body;

  // Basic validation
  if (!user_name || !user_email || !user_role || !user_password) {
    throw new BadRequestError("All fields are mandatory");
  }

  if (user_role !== "user" && user_role !== "admin") {
    throw new BadRequestError("Role must either be a user or admin");
  }

  try {
    // Check if the email already exists
    const emailExists = await pool.query(queries.checkIfEmailExists, [
      user_email,
    ]);
    if (emailExists.rowCount > 0) {
      throw new BadRequestError("Email already exists!");
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user_password, salt);

    // Insert a new user/admin
    const newUser = await pool.query(queries.insertNewUser, [
      user_name,
      user_email,
      user_role,
      hashedPassword,
    ]);

    // Send confirmation email using SendGrid
    const msg = {
      to: user_email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Registration successful",
      text: "Thank you for registering!",
      html: "<strong>Thank you for registering!</strong>",
    };

    await sgMail.send(msg);

    // Generate a JWT token
    const token = jwt.sign(
      {
        user_id: newUser?.rows[0]?.user_id,
        user_name: newUser?.rows[0]?.user_name,
        user_email: newUser?.rows[0]?.user_email,
        user_role: newUser?.rows[0]?.user_role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_LIFETIME,
      }
    );

    // Successful creation of user/admin
    res.status(StatusCodes.CREATED).json({
      code: StatusCodes.CREATED,
      success: true,
      message: "Registration successful. A confirmation email has been sent.",
      user: {
        user_id: newUser?.rows[0]?.user_id,
        user_name: newUser?.rows[0]?.user_name,
        user_email: newUser?.rows[0]?.user_email,
        user_role: newUser?.rows[0]?.user_role,
      },
      token,
    });
  } catch (error) {
    console.log("Error registering:", error);

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

const loginUser = async (req, res) => {
  const { user_email, user_password } = req.body;

  // Basic validation
  if (!user_email || !user_password) {
    throw new BadRequestError("All Fields are required");
  }

  try {
    const emailExists = await pool.query(queries.checkIfEmailExists, [
      user_email,
    ]);
    if (emailExists.rowCount === 0) {
      throw new BadRequestError("Email doesn' exist");
    }

    const user = emailExists.rows[0];

    // Verify the password
    const isvalidPassword = await bcrypt.compare(
      user_password,
      user.user_password
    );
    if (!isvalidPassword) {
      throw new BadRequestError("Invalid password");
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_email: user.user_email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_LIFETIME,
      }
    );

    res.status(StatusCodes.OK).json({
      code: StatusCodes.OK,
      success: true,
      message: "Login successful.",
      user: {
        user_id: user.user_id,
        user_email: user.user_email,
      },
      token,
    });
  } catch (error) {
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

const outhLogin = async (req, res) => {
  res.send("oauth Login success!");
};

const resetPasswordRequest = async (req, res) => {
  const { user_email } = req.body;

  if (!user_email) {
    throw new BadRequestError("Email is required");
  }

  try {
    const userExists = await pool.query(queries.checkIfEmailExists, [
      user_email,
    ]);

    if (userExists.rowCount === 0) {
      throw new BadRequestError("Email not found");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpire = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiry

    await pool.query(queries.requestResetPassword, [
      resetToken,
      resetTokenExpire,
      user_email,
    ]);

    // We send the reset link via email
    const resetLink = `${process.env.APP_URL}/reset-password-confirm/${resetToken}`;
    const msg = {
      to: user_email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Password Reset Request",
      text: `Please click the following link to reset your password: ${resetLink}`,
      html: `<strong>Please click the following link to reset your password:</strong><br><a href="${resetLink}">Reset Password</a>`,
    };

    await sgMail.send(msg);

    res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      success: true,
      message: "Password reset email sent successfully.",
    });
  } catch (error) {
    console.log("Error registering:", error);

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

const confirmPasswordReset = async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    throw new BadRequestError("Token and new password are required");
  }

  try {
    // Find user by reset token
    const userQuery =
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expire > $2";
    const { rows } = await pool.query(userQuery, [
      token,
      new Date().toISOString(),
    ]);

    if (rows.length === 0) {
      throw new BadRequestError("Invalid or expired token");
    }

    const user = rows[0];

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password in the database
    const updateQuery =
      "UPDATE users SET user_password = $1, reset_token = NULL, reset_token_expire = NULL WHERE user_id = $2";
    await pool.query(updateQuery, [hashedPassword, user.user_id]);

    res.status(200).json({
      success: true,
      message: "Password has been successfully reset.",
    });
  } catch (error) {
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
  registerUser,
  loginUser,
  outhLogin,
  resetPasswordRequest,
  confirmPasswordReset,
};
