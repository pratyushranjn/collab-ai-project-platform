const { createClient } = require("redis");

const redisUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REDIS_URL
    : "redis://localhost:6379";

const client = redisUrl
  ? createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: () => false,
      },
    })
  : null;

if (client) {
  client.on("error", (err) => {
    console.warn("Redis error:", err.message || err);
  });
}

async function connectRedis() {
  if (!client) {
    console.log("Redis not configured, continuing without Redis");
    return false;
  }

  if (!client.isOpen) {
    try {
      await client.connect();
      console.log("Redis connected");
      return true;
    } catch (_err) {
      console.warn("Redis unavailable, continuing without Redis");
      return false;
    }
  }

  return true;
}

module.exports = { client, connectRedis };

