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
      // check if user is already exist 
      const userExist = await userModel.findOne({ email });

      if(userExist){
        return res.status(400).json({ error: "User already exist" });
      }
      
      const auth = getAuth();
      const firebaseUser = await createUserWithEmailAndPassword(auth, email, password);

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
      // handle the firebase errors 
      if (error.code === "auth/email-already-in-use") {
        return res.status(400).json({ error: "Email is already in use." });
      }
      if (error.code === "auth/invalid-email") {
        return res.status(400).json({ error: "Invalid email." });
      }
      if (error.code === "auth/weak-password") {
        return res.status(400).json({ error: "Password is too weak." });
      }

      res.status(500).json({ success: false, error: "Registration failed. Please try again." });
    }
  }

  // Verify email using Firebase Admin and oobCode
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
  
      res.status(200).json({ message: "Email verified successfully." });
    } catch (error) {
      console.error("Error verifying email:", error.message);
      res.status(500).json({
        error: "Failed to verify email. Please ensure the process is correct.",
      });
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
