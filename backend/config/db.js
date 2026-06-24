import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Set a short timeout (5 seconds) so it doesn't hang indefinitely if MongoDB is offline
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/realestate', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB Connection Error: ${error.message}`);
    console.warn('Express server will continue running using local filesystem & Strapi fallback.');
    // Do NOT exit the process so the Express server remains alive for Strapi routing
  }
};

export default connectDB;
