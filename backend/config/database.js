const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Set a timeout for the connection attempt
    const connectPromise = mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000, // Shorter timeout
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    // Race between connection and timeout
    const conn = await Promise.race([
      connectPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      )
    ]);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.warn('Server will continue running without database connection');
    console.warn('Authentication will use demo mode when database is unavailable');
    // Don't exit the process - continue running without DB
  }
};

module.exports = connectDB;