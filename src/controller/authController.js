
const userModel = require("../models/userModel");
const sendEmail = require("../../config/mailer");
const generateUniqueSlug = require("../../_helpers/helperFunctions");
const jwt = require("jsonwebtoken");
// const { getFromCache, setInCache } = require("../../config/cache"); 

const {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} = require("../../config/firebase");

const admin = require("../../config/firebaseAdminConfig");
const { validationResult } = require("express-validator");
const auth = getAuth();

class AuthController {
  async registerUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, email, password, phone, user_type } = req.body;

    try {
      // const cachedUser = await getFromCache(`user:email:${email}`);
      // if (cachedUser) {
      //   return res.status(400).json({ error: "User already exists" });
      // }

      const userExist = await userModel.findOne({ email });
      if (userExist) {
        // await setInCache(`user:email:${email}`, userExist, 60);
        return res.status(400).json({ error: "User already exists" });
      }

      const firebaseUser = await createUserWithEmailAndPassword(auth, email, password);

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

      const token = user.generateAuthToken();
      await user.save();


      res.status(200).json({ success: "ok", message: "Email verified successfully.", token });
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

  async loginUser(req, res) {
    const { email, password } = req.body;
    if(!email || !password){
      return res.status(400).json({ error: "Email and password are required." });
    }
    try {
      console.log('email', email, 'password', password);
      const user = await userModel.findOne({ email: email, has_verified: true });
      console.log('user', user);
      if (user.has_verified === false) {
        return res.status(400).json({ success: false, error: "Email not verified" });
      }
      if (!user) {
        return res.status(400).json({success: false, message: "User not found" });
      }
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
      const token = user.generateAuthToken();
      res.status(200).json({ success: true, message: "login sucessfully", token: token });
      } catch (error) {
        console.error("Error in loginUser:", error.message);
        res.status(500).json({ error: "Login failed. Please try again." });
      }
  }

  userProfile = async(req,res) => {
    try {
      if(!req.user){
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await userModel.findById(req.user._id);

      if(!user){
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json({ success: true, user: user });
    }
    catch(error){
      console.error("Error in userProfile:", error.message);
      res.status(500).json({ error: "Failed to get user profile. Please try again." });
    }
  }

  logoutUser = async(req,res)=>{
    try {
      if(!req.user){
        return res.status(401).json({ error: "Unauthorized" });
      }
      req.user.tokens = [];
      await req.user.save();
      res.status(200).json({ success: true, message: "User logged out successfully" });
    }
    catch(error){
      console.error("Error in logoutUser:", error.message);
      res.status(500).json({ error: "Failed to logout user. Please try again." });

    }
  }

   exchangeToken = async (req, res) => {
    try {
      const { firebaseToken } = req.body;
  
      const decoded = await admin.auth().verifyIdToken(firebaseToken);
      const userId = decoded.uid;
  
      // Generate a custom JWT
      const customToken = jwt.sign(
        { userId, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" } // Token expiry
      );
  
      // Set the JWT as an HttpOnly cookie
      res.cookie("authToken", customToken, {
        httpOnly: true, // Prevents access via JavaScript
        secure: process.env.NODE_ENV === "production", // Secure in production
        sameSite: "Strict", // Prevents CSRF
        maxAge: 3600 * 1000, // 1 hour in milliseconds
      });
  
      // Return success message
      res.status(200).json({ message: "Token set in cookie successfully." });
    } catch (error) {
      console.error("Error in exchangeToken:", error.message);
      res.status(500).json({ error: "Failed to exchange token. Please try again." });
    }
  };
  
}

module.exports = AuthController;
