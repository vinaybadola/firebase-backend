require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;
const authRoutes = require("./src/routes/authRoute");
const connectDB = require("./config/database");
const cors = require('cors');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

const corsOptions = {
  origin: '*', 
  methods: 'GET,POST,PUT,DELETE', 
  allowedHeaders: ['Content-Type'] 
};

app.use(cors(corsOptions));

// Routes
app.use("/api/auth", authRoutes);

app.use("/", (req,res)=>{
  res.send("API is running");
})
// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
