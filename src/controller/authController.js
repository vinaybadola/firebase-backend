const userModel = require("../models/userModel");
const sendEmail = require("../../config/mailer");
const generateUniqueSlug = require("../../_helpers/helperFunctions");

const {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} = require("../../config/firebase");
const admin = require("../../config/firebaseAdminConfig");
const { validationResult } = require("express-validator");

class AuthController {
  async registerUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, email, password, phone, user_type } = req.body;

    try {
      // Check if the user already exists
      const userExist = await userModel.findOne({ email });
      if (userExist) {
        return res.status(400).json({ error: "User already exists" });
      }

      const auth = getAuth();
      const firebaseUser = await createUserWithEmailAndPassword(auth, email, password);

      // Generate unique slug using helper
      const slug = await generateUniqueSlug({ first_name, last_name });

      const user = new userModel({
        first_name,
        last_name,
        email,
        phone,
        password,
        user_type,
        slug,
        has_verified: false,
      });
      await user.save();

      // Send verification email
      await sendEmailVerification(firebaseUser.user);

      res.status(201).json({
        message: "User registered successfully. Verification email sent.",
      });
    } catch (error) {
      console.error("Error in registerUser:", error.message);

      // Handle Firebase errors
      if (error.code === "auth/email-already-in-use") {
        return res.status(400).json({ error: "Email is already in use." });
      }
      if (error.code === "auth/invalid-email") {
        return res.status(400).json({ error: "Invalid email." });
      }
      if (error.code === "auth/weak-password") {
        return res.status(400).json({ error: "Password is too weak." });
      }

      if (error.message === "Could not generate a unique slug. Please choose a different name.") {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({
        success: false,
        error: "Registration failed. Please try again.",
      });
    }
  }

  async verifyEmail(req, res) {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
  
    try {
      // Fetch user details from Firebase Authentication
      const firebaseUser = await admin.auth().getUserByEmail(email);
  
      if (!firebaseUser.emailVerified) {
        return res
          .status(400)
          .json({ error: "Email has not been verified yet in Firebase." });
      }
  
      // Check and update in your local database
      const user = await userModel.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
  
      if (user.has_verified) {
        return res
          .status(400)
          .json({ error: "Email is already marked as verified." });
      }
  
      user.has_verified = true;
      await user.save();
  
      res.status(200).json({ success: "ok",message: "Email verified successfully." });
    } catch (error) {
      console.error("Error verifying email:", error.message);
      res.status(500).json({
        error: "Failed to verify email. Please ensure the process is correct.",
      });
    }
  }

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
  
      // Generate a new email verification link
      const verificationLink = await admin.auth().generateEmailVerificationLink(email);
  
      // Send the verification email using Nodemailer
      const subject = "Verify Your Email Address";
      const html = `
        <h1>Email Verification</h1>
        <p>Click the link below to verify your email address:</p>
        <a href="${verificationLink}">Verify Email</a>
      `;
  
      await sendEmail(email, subject, "Click the link to verify your email.", html);
  
      res.status(200).json({ message: "Verification email resent successfully." });
    } catch (error) {
      console.error("Error in resendVerificationEmail:", error.message);
      res.status(500).json({ error: "Failed to resend verification email. Please try again." });
    }
  }
  
}

module.exports = AuthController;
