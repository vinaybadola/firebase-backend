const express = require('express');
const router = express.Router();

const AuthController = require("../controller/authController");
const authController = new AuthController();
const auth = require("../middleware/authMiddleware");

router.post("/register", authController.registerUser);
router.post("/verify-email", authController.verifyEmail);
router.post("/exchange-token", authController.exchangeToken);
router.post("/resend-verification-email", authController.resendVerificationEmail);
router.post("/login", authController.loginUser);
router.get("/dashboard", auth, authController.userProfile);
router.post("/logout", auth, authController.logoutUser);

module.exports = router;

