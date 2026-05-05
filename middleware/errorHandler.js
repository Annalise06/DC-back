const notFound = (req, res, next) => {
  const err = new Error(`Not Found — ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  // MongoDB connection/network errors
  if (err.name === "MongoNetworkError" || err.name === "MongoServerSelectionError" || err.name === "MongoTimeoutError") {
    console.error("MongoDB connection error:", err.message);
    return res.status(503).json({ 
      error: "Database service temporarily unavailable. Please try again later." 
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ error: `${field} is already in use.` });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    return res.status(400).json({ errors });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token has expired." });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  res.status(status).json({ error: err.message || "Internal Server Error" });
};

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { notFound, errorHandler, asyncHandler };
