const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  resetPasswordRequest,
  confirmPasswordReset,
  outhLogin,
} = require("../controllers/authControllers");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/outhLogin", outhLogin);
router.post("/request-reset-password", resetPasswordRequest);
router.post("/confirm-reset-password", confirmPasswordReset);

module.exports = router;
