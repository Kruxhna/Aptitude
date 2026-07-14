const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the MONGO_URI environment variable.
 * Retries are handled by Mongoose's built-in reconnection logic.
 */
async function connectDB() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/aptitude';
    await mongoose.connect(uri);
    console.log(`✓ MongoDB connected: ${uri}`);
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
