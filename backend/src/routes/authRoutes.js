import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import {
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  registerResident,
  registerSecretary,
  registerGuard,
  switchSociety,
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";
import { validate } from "../validators/validate.js";

const router = express.Router();

// Rate limiter for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // 30 requests per IP per 15 min window
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.post("/refresh", refreshToken);

router.post("/logout", logout);

router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  forgotPassword
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  validate,
  resetPassword
);

router.get("/me", authenticateToken, getMe);

// Registration Endpoints (Public, Rate Limited)
router.post(
  "/register/resident",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("societyId").notEmpty().withMessage("Society is required"),
    body("wing").trim().notEmpty().withMessage("Wing is required"),
    body("flatNumber").trim().notEmpty().withMessage("Flat number is required"),
  ],
  validate,
  registerResident
);

router.post(
  "/register/secretary",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("societyId").notEmpty().withMessage("Society is required"),
    body("invitationToken").trim().notEmpty().withMessage("Secretary invitation token is required"),
  ],
  validate,
  registerSecretary
);

router.post(
  "/register/guard",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("societyId").notEmpty().withMessage("Society is required"),
    body("staffId").trim().notEmpty().withMessage("Staff ID is required"),
  ],
  validate,
  registerGuard
);

router.post(
  "/switch-society",
  authenticateToken,
  [body("societyId").notEmpty().withMessage("Society ID is required")],
  validate,
  switchSociety
);

export default router;
