import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import {
  getSocieties,
  getSocietyById,
  createSociety,
  updateSociety,
  getSocietyStats,
  getSocietyFlatsPublic,
  registerSociety,
} from "../controllers/societyController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";
import { validate } from "../validators/validate.js";

const router = express.Router();

const publicFlatsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: "Too many flat lookup requests. Please try again later." },
});

// Public routes for society selection & preview
router.get("/", getSocieties);
router.get("/:id", getSocietyById);

// Public privacy-safe flat lookup for registration dropdowns
router.get("/:societyId/flats", publicFlatsLimiter, getSocietyFlatsPublic);

// Public atomic onboarding for new society + creator secretary
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Society name is required"),
    body("registrationNumber").trim().notEmpty().withMessage("Registration number is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("city").trim().notEmpty().withMessage("City is required"),
    body("state").trim().notEmpty().withMessage("State is required"),
    body("pinCode").trim().notEmpty().withMessage("PIN Code is required"),
    body("creatorName").trim().notEmpty().withMessage("Secretary name is required"),
    body("creatorEmail").isEmail().withMessage("Valid secretary email is required"),
    body("creatorPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  validate,
  registerSociety
);

// Create Society (Public onboarding from select-society or societies/new)
router.post(
  "/",
  [
    body("name").notEmpty().withMessage("Society name is required"),
    body("registrationNumber").notEmpty().withMessage("Registration number is required"),
    body("address").notEmpty().withMessage("Address is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("state").notEmpty().withMessage("State is required"),
    body("pinCode").notEmpty().withMessage("PIN Code is required"),
    body("secretaryName").notEmpty().withMessage("Secretary name is required"),
    body("secretaryMobile").notEmpty().withMessage("Secretary mobile is required"),
    body("secretaryEmail").isEmail().withMessage("Valid secretary email is required"),
  ],
  validate,
  createSociety
);

router.patch("/:id", authenticateToken, authorizeRole(["secretary", "superadmin"]), updateSociety);

router.get("/:id/stats", authenticateToken, getSocietyStats);

export default router;
