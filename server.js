require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;
const authRoutes = require("./src/routes/authRoute");
const connectDB = require("./config/database");

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Database Connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Default Route
app.use("/", (req, res) => {
  res.send("API is running");
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});