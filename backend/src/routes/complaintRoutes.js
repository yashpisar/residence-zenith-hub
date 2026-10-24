import express from "express";
import { body } from "express-validator";
import {
  getComplaints,
  getComplaintById,
  getPublicComplaints,
  createComplaint,
  updateComplaintStatus,
  assignComplaintStaff,
  unassignComplaintStaff,
  toggleComplaintSupport,
} from "../controllers/complaintController.js";
import { authenticateToken, requireSociety, authorizeRole } from "../middleware/auth.js";
import { validate } from "../validators/validate.js";

const router = express.Router();

router.use(authenticateToken, requireSociety);

router.get("/", getComplaints);
router.get("/public", getPublicComplaints);
router.get("/:id", getComplaintById);

router.post(
  "/",
  [
    body("title").notEmpty().withMessage("Complaint title is required"),
    body("description").notEmpty().withMessage("Complaint description is required"),
    body("category").notEmpty().withMessage("Category is required"),
  ],
  validate,
  createComplaint
);

router.patch("/:id/status", authorizeRole(["secretary"]), updateComplaintStatus);
router.patch("/:id/assign", authorizeRole(["secretary"]), assignComplaintStaff);
router.patch("/:id/unassign", authorizeRole(["secretary"]), unassignComplaintStaff);
router.delete("/:id/assign", authorizeRole(["secretary"]), unassignComplaintStaff);
router.post("/:id/support", toggleComplaintSupport);

export default router;
