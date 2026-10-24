import express from "express";
import { body } from "express-validator";
import {
  getMaintenance,
  getMaintenanceById,
  getFlatMaintenanceHistory,
  recordMaintenancePayment,
  generateBatchBills,
  getPayments,
  createPaymentOrder,
  verifyPayment,
  recordCashPayment,
  getPaymentReceipt,
} from "../controllers/financeController.js";
import { authenticateToken, requireSociety, authorizeRole } from "../middleware/auth.js";
import { validate } from "../validators/validate.js";

const router = express.Router();

router.use(["/maintenance", "/payments"], authenticateToken, requireSociety);

// Maintenance
router.get("/maintenance", getMaintenance);
router.get("/maintenance/flat/:flatId/history", getFlatMaintenanceHistory);
router.get("/maintenance/:id", getMaintenanceById);
router.post(
  "/maintenance/:id/record-payment",
  authorizeRole(["secretary", "superadmin"]),
  recordMaintenancePayment
);
router.post(
  "/maintenance/record-payment",
  authorizeRole(["secretary", "superadmin"]),
  (req, res, next) => {
    req.params.id = req.body.billId;
    return recordMaintenancePayment(req, res, next);
  }
);
router.post(
  "/maintenance/generate-bills",
  authorizeRole(["secretary", "superadmin"]),
  [
    body("billingPeriod").notEmpty().withMessage("Billing period (YYYY-MM) is required"),
    body("dueDate").notEmpty().withMessage("Due date is required"),
    body("baseAmount").isNumeric().withMessage("Base amount must be numeric"),
  ],
  validate,
  generateBatchBills
);

// Payments
router.get("/payments", getPayments);
router.post(
  "/payments/create-order",
  [body("billId").notEmpty().withMessage("billId is required")],
  validate,
  createPaymentOrder
);
router.post(
  "/payments/verify",
  [body("paymentId").notEmpty().withMessage("paymentId is required")],
  validate,
  verifyPayment
);
router.post("/payments/cash", authorizeRole(["secretary"]), recordCashPayment);
router.get("/payments/:id/receipt", getPaymentReceipt);

export default router;
