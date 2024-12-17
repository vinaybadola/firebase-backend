const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;
const authRoutes = require("./src/routes/authRoute");
const connectDB = require("./config/database");

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

connectDB();

// Routes
app.use("/api/auth", authRoutes);

app.use("/", (req,res)=>{
  res.send("API is running");
})
// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
