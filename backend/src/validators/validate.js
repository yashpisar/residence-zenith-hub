import { validationResult } from "express-validator";
import { sendError } from "../utils/response.js";

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      "Validation failed. Please check the supplied inputs.",
      400,
      errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      }))
    );
  }
  next();
}
