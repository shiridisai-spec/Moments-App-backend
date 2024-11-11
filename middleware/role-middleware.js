const UnauthenticatedError = require("../errors/unauthenticated");

const roleMiddleWare = (requiredRole) => {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
      throw new UnauthenticatedError("Access denied");
    }
    next();
  };
};

module.exports = roleMiddleWare;
