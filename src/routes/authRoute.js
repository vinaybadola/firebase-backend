const express = require('express');
const router = express.Router();

const AuthController = require("../controller/authController");
const authController = new AuthController();

router.post("/register", authController.registerUser);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification-email", authController.resendVerificationEmail);

module.exports = router;

