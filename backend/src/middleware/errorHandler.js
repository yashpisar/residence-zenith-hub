import { sendError } from "../utils/response.js";

export function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    return sendError(res, "Validation Error", 400, errors);
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, `Duplicate value for ${field}. A record already exists.`, 409, {
      field,
      value: err.keyValue ? err.keyValue[field] : undefined,
    });
  }

  // Mongoose CastError (Invalid ObjectId)
  if (err.name === "CastError") {
    return sendError(res, `Invalid resource identifier: ${err.value}`, 400);
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid authentication token", 401);
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, "Authentication token has expired", 401);
  }

  // Multer Errors
  if (err.name === "MulterError") {
    return sendError(res, `File upload error: ${err.message}`, 400);
  }

  // Custom HTTP errors or fallback
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  return sendError(res, message, statusCode);
}
