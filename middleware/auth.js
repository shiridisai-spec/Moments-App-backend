const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const UnauthenticatedError = require("../errors/unauthenticated");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError("Authentication invalid");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.user_id,
      username: decoded.user_email,
      email: decoded.user_email,
    };
    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};

module.exports = authMiddleware;
