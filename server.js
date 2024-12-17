const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;
const authRoutes = require("./src/routes/authRoute");

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));


// Routes
app.use("/api/auth", authRoutes);


// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
