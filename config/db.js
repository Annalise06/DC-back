const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    // Don't exit process - let the server start and handle DB errors gracefully
    console.error("Server will start but database operations may fail");
    return null;
  }
};

module.exports = connectDB;
