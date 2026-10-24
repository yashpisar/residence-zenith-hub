import express from "express";
import { body } from "express-validator";
import {
  getVisitors,
  getVisitorById,
  registerVisitor,
  approveVisitor,
  rejectVisitor,
  recordEntry,
  recordExit,
  getExpectedVisitors,
} from "../controllers/visitorController.js";
import { authenticateToken, requireSociety, authorizeRole } from "../middleware/auth.js";
import { validate } from "../validators/validate.js";

const router = express.Router();

router.use(authenticateToken, requireSociety);

router.get("/", getVisitors);
router.get("/expected", authorizeRole(["security", "secretary"]), getExpectedVisitors);
router.get("/:id", getVisitorById);

router.post(
  "/",
  [
    body("visitorName").notEmpty().withMessage("Visitor name is required"),
    body("phone").notEmpty().withMessage("Phone number is required"),
  ],
  validate,
  registerVisitor
);

router.patch("/:id/approve", approveVisitor);
router.patch("/:id/reject", rejectVisitor);

// Entry & Exit with /check-in and /check-out aliases
router.patch("/:id/entry", authorizeRole(["security", "secretary"]), recordEntry);
router.patch("/:id/check-in", authorizeRole(["security", "secretary"]), recordEntry);
router.patch("/:id/exit", authorizeRole(["security", "secretary"]), recordExit);
router.patch("/:id/check-out", authorizeRole(["security", "secretary"]), recordExit);

export default router;
