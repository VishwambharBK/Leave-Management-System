const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  try {
    if (uri && uri.trim().length > 0 && process.env.NODE_ENV !== 'test') {
      try {
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[MongoDB] Connected successfully to: ${mongoose.connection.host}`);
        return mongoose.connection;
      } catch (err) {
        console.error(`[MongoDB] Connection to MongoDB failed: ${err.message}`);
        if (process.env.NODE_ENV === 'production') {
          process.exit(1);
        }
        console.log('[MongoDB] Falling back to in-memory MongoDB instance for development/testing...');
      }
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('[MongoDB] Critical: MONGO_URI environment variable is not defined in production.');
      process.exit(1);
    }

    // In-memory fallback if direct connection failed or in test environment
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[MongoDB] Connected to in-memory database: ${memoryUri}`);
    return mongoose.connection;
  } catch (error) {
    console.error(`[MongoDB] Critical database connection error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
  } catch (error) {
    console.error(`[MongoDB] Disconnect error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };

