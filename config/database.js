require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 10000, // Time to establish the connection
      socketTimeoutMS: 45000, // Time for idle socket
      autoIndex: false,       // Disable automatic index creation in production
      retryWrites: true,      // Retry write operations
      w: 'majority',          // Write acknowledgment level
      family: 4,              // Force IPv4
      readPreference: 'primaryPreferred', // ReplicaSet read preference
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); 
  }
};

module.exports = connectDB;