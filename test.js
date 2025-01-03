const { MongoClient } = require('mongodb');
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, { monitorCommands: true });
const redis = require('redis');

const redisClient = redis.createClient();

// Connect to Redis
redisClient.connect().catch(console.error);

// Handle Redis errors
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

// Log Redis connection events
redisClient.on('connect', () => {
//   console.log('Connected to Redis');
});

redisClient.on('ready', () => {
//   console.log('Redis client is ready');
});

redisClient.on('end', () => {
//   console.log('Redis connection ended');
});

async function testQueryPerformance() {
  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db('test-db');
    const users = db.collection('users');

    const email = 'user21@example.com';

    // Check cache first
    const redisStartTime = Date.now();
    const cachedResult = await redisClient.get(`user:email:${email}`);
    // console.log('Cached result:', cachedResult); 
    if (cachedResult) {
        const redisEndTime = Date.now();
        console.log('Redis query time:', redisEndTime - redisStartTime);
      process.exit(0); // Exit the script
    }

    // Query MongoDB if not in cache
    const startTime = Date.now();
    const userExists = await users.findOne({ email }, { projection: { _id: 1 } });
    const endTime = Date.now();

    console.log(`Query took ${endTime - startTime} milliseconds`);

    // Cache the result
    if (userExists) {
      await redisClient.set(`user:email:${email}`, JSON.stringify(userExists), {'EX': 60}); // Cache for 60 seconds
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Do not close the MongoDB or Redis client here if using a connection pool
    process.exit(0); // Exit the script
  }
}

testQueryPerformance();