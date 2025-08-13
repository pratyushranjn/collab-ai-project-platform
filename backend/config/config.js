module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative-platform',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  aiApiKey: process.env.GEMINI_API_KEY,
  aiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  corsOrigin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
    ['http://localhost:3000', 'http://localhost:5001', 'http://localhost:5173'],
  allowedOrigins: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
    ['http://localhost:3000', 'http://localhost:5001', 'http://localhost:5173']
};