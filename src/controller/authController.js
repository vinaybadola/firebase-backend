const userModel = require("../models/userModel");
const slugify = require("slugify");
const {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} = require("../../config/firebase");
const admin = require("../../config/firebaseAdminConfig");
const { validationResult } = require("express-validator");

class AuthController {
  // Register a new user
  async registerUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    console.log('reqbody', req.body);
    const { first_name, last_name, email, password, phone, user_type } = req.body;

    try {
      // Create user in Firebase Auth
      const auth = getAuth();
      const firebaseUser = await createUserWithEmailAndPassword(auth, email, password);

      // Create user in MongoDB
      const user = new userModel({
        first_name,
        last_name,
        email,
        phone,
        user_type,
        slug: slugify(`${first_name}-${last_name}`, { lower: true }),
        has_verified: false
      });
      await user.save();

      // Send verification email
      await sendEmailVerification(firebaseUser.user);

      res.status(201).json({ message: "User registered successfully. Verification email sent." });
    } catch (error) {
      console.error("Error in registerUser:", error.message);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  }

  // Verify email using Firebase Admin and oobCode
  async verifyEmail(req, res) {
    const { email, oobCode } = req.body;

    if (!email || !oobCode) {
      return res.status(400).json({ error: "Email and oobCode are required." });
    }

    try {
      // Verify oobCode using Firebase Admin
      await admin.auth().verifyEmail(oobCode);

      const user = await userModel.findOne({ email });

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (user.has_verified) {
        return res.status(400).json({ error: "Email is already verified." });
      }

      // Update verification status
      user.has_verified = true;
      await user.save();

      res.status(200).json({ message: "Email verified successfully." });
    } catch (error) {
      console.error("Error in verifyEmail:", error.message);
      res.status(500).json({ error: "Failed to verify email. Please try again." });
    }
  }

  // Resend verification email
  async resendVerificationEmail(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    try {
      const user = await userModel.findOne({ email });

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      if (user.has_verified) {
        return res.status(400).json({ error: "Email is already verified." });
      }

      // Resend verification email through Firebase Auth
      const auth = getAuth();
      const firebaseUser = await auth.getUserByEmail(email);

      if (!firebaseUser) {
        return res.status(404).json({ error: "User not found in Firebase." });
      }

      await sendEmailVerification(firebaseUser);
      res.status(200).json({ message: "Verification email resent successfully." });
    } catch (error) {
      console.error("Error in resendVerificationEmail:", error.message);
      res.status(500).json({ error: "Failed to resend verification email. Please try again." });
    }
  }
}

module.exports = AuthController;
