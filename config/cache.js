require('dotenv').config();
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
  console.log('Connected to Redis');
});

redisClient.on('ready', () => {
  console.log('Redis client is ready');
});

redisClient.on('end', () => {
  console.log('Redis connection ended');
});

/**
 * Check if a key exists in the cache.
 * @param {string} key - The key to check in the cache.
 * @returns {Promise<object|null>} - The cached data or null if not found.
 */
async function getFromCache(key) {
  try {
    const cachedResult = await redisClient.get(key);
    return cachedResult ? JSON.parse(cachedResult) : null;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
}

/**
 * Set a key in the cache with an expiration time.
 * @param {string} key - The key to set in the cache.
 * @param {object} data - The data to cache.
 * @param {number} ttl - Time-to-live in seconds.
 * @returns {Promise<void>}
 */
async function setInCache(key, data, ttl = 60) {
  try {
    await redisClient.set(key, JSON.stringify(data), { 'EX': ttl });
    console.log(`Data cached with key: ${key}`);
  } catch (error) {
    console.error('Error setting in cache:', error);
  }
}

module.exports = { getFromCache, setInCache };