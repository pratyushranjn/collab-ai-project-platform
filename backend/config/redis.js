const { createClient } = require("redis");

const redisUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REDIS_URL
    : "redis://localhost:6379";


const client = createClient({ url: redisUrl });

client.on("error", (err) => {
  console.error("Redis error:", err);
});

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    console.log("Redis connected");
  }
}
module.exports = { client, connectRedis };

