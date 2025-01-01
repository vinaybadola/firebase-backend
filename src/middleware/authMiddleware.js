const User = require("../models/userModel");
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1] || req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ success: false, key: "token_not_provided", error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id || decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, key: "unknown_user", error: 'User not found.' });
    }

    const validToken = user.tokens.some(t => t.token === token);
    if (!validToken) {
      return res.status(401).json({ success: false, key : "token_false", error: 'Invalid or expired token.' });
    }

    req.user = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || ''
    };
    req.userType = user.user_type;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(400).json({ success: false, key : "token_false", message: 'Invalid token.', error: err });
  }
};

module.exports = auth;