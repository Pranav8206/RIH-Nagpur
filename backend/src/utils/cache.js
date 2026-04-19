import { createClient } from "redis";

let redisClient;
let isRedisConnected = false;

/**
 * Initialize Redis connection allowing graceful failovers for dev setups.
 * Recommend running this inside the main `app.js` or `db.js` boot lifecycle wrapper.
 */
export const initRedis = async () => {
    try {
        if (!process.env.REDIS_URI) {
            console.log("Redis URI not provided, running gracefully without cache metrics.");
            return;
        }

        redisClient = createClient({ url: process.env.REDIS_URI });

        redisClient.on('error', (err) => {
            console.error('Redis Client Network Error:', err);
            isRedisConnected = false;
        });

        redisClient.on('ready', () => {
             console.log("Redis Dashboard Cache connected sequentially.");
             isRedisConnected = true;
        });

        await redisClient.connect();
    } catch (err) {
        console.error("Failed to initialize Redis fallback to memory-routes:", err.message);
        isRedisConnected = false;
    }
};

/**
 * Get from cache securely wrapping exceptions 
 * @param {string} key 
 */
export const getCache = async (key) => {
    if (!isRedisConnected || !redisClient) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error(`Redis GET error for key ${key}:`, err.message);
        return null; // Return null forcing fallback to native DB hit
    }
};

/**
 * Write strings to cache enforcing defined Time-To-Live limits
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
    if (!isRedisConnected || !redisClient) return;
    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
        console.error(`Redis SET error for key ${key}:`, err.message);
    }
};

/**
 * Delete key manually to invalidate stale pipelines mappings
 * @param {string} key 
 */
export const clearCache = async (key) => {
    if (!isRedisConnected || !redisClient) return;
    try {
        await redisClient.del(key);
    } catch (err) {
        console.error(`Redis DEL error for key ${key}:`, err.message);
    }
};
