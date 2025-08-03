module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative-platform',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  aiApiKey: process.env.OPENAI_API_KEY,
  aiModel: process.env.AI_MODEL || 'gpt-3.5-turbo',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};