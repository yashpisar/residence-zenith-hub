import express from "express";
import { body } from "express-validator";
import {
  getNotices,
  createNotice,
  deleteNotice,
  getDocuments,
  createDocument,
  deleteDocument,
  getResidents,
  createResident,
  getFlats,
  getFlatById,
  createFlat,
  updateFlatOccupancy,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getDeliveries,
  getDeliveryById,
  createDelivery,
  collectDelivery,
  updateDeliveryStatus,
  getEmergencyAlerts,
  triggerEmergencyAlert,
  resolveEmergencyAlert,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAnalyticsOverview,
  getMembershipRequests,
  approveMembershipRequest,
  rejectMembershipRequest,
  createInvitation,
  getInvitations,
  revokeInvitation,
} from "../controllers/communityController.js";
import { authenticateToken, requireSociety, authorizeRole } from "../middleware/auth.js";
import { validate } from "../validators/validate.js";

const router = express.Router();

const communityPaths = [
  "/notices",
  "/documents",
  "/residents",
  "/flats",
  "/staff",
  "/deliveries",
  "/emergency",
  "/notifications",
  "/analytics",
  "/membership-requests",
  "/invitations",
];
router.use(communityPaths, authenticateToken, requireSociety);

// Notices
router.get("/notices", getNotices);
router.post(
  "/notices",
  authorizeRole(["secretary"]),
  [body("title").notEmpty().withMessage("Notice title is required")],
  validate,
  createNotice
);
router.delete("/notices/:id", authorizeRole(["secretary"]), deleteNotice);

// Documents
router.get("/documents", getDocuments);
router.post(
  "/documents",
  authorizeRole(["secretary"]),
  [
    body("title").notEmpty().withMessage("Document title is required"),
    body("fileUrl").notEmpty().withMessage("File URL is required"),
  ],
  validate,
  createDocument
);
router.delete("/documents/:id", authorizeRole(["secretary"]), deleteDocument);

// Residents Directory
router.get("/residents", authorizeRole(["secretary"]), getResidents);
router.post(
  "/residents",
  authorizeRole(["secretary"]),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("wing").notEmpty().withMessage("Wing is required"),
    body("flatNumber").notEmpty().withMessage("Flat number is required"),
  ],
  validate,
  createResident
);

// Flats Directory
router.get("/flats", getFlats);
router.get("/flats/:id", authorizeRole(["secretary"]), getFlatById);
router.patch("/flats/:id/occupancy", authorizeRole(["secretary"]), updateFlatOccupancy);
router.post(
  "/flats",
  authorizeRole(["secretary"]),
  [
    body("wing").notEmpty().withMessage("Wing is required"),
    body("flatNumber").notEmpty().withMessage("Flat number is required"),
  ],
  validate,
  createFlat
);

// Staff Directory
router.get("/staff", getStaff);
router.post(
  "/staff",
  authorizeRole(["secretary"]),
  [body("name").notEmpty().withMessage("Staff name is required"), body("role").notEmpty().withMessage("Role is required")],
  validate,
  createStaff
);
router.patch("/staff/:id", authorizeRole(["secretary"]), updateStaff);
router.delete("/staff/:id", authorizeRole(["secretary"]), deleteStaff);

// Deliveries
router.get("/deliveries", getDeliveries);
router.get("/deliveries/:id", getDeliveryById);
router.post(
  "/deliveries",
  authorizeRole(["security", "secretary"]),
  [
    body("wing").notEmpty().withMessage("Wing is required"),
    body("flatNumber").notEmpty().withMessage("Flat number is required"),
    body("courierCompany").notEmpty().withMessage("Courier company is required"),
  ],
  validate,
  createDelivery
);
router.patch("/deliveries/:id/collect", collectDelivery);
router.patch("/deliveries/:id/handover", collectDelivery);
router.patch("/deliveries/:id/status", updateDeliveryStatus);

// Emergency SOS
router.get("/emergency", getEmergencyAlerts);
router.post(
  "/emergency",
  [body("alertType").notEmpty().withMessage("Alert type is required")],
  validate,
  triggerEmergencyAlert
);
router.patch("/emergency/:id/resolve", authorizeRole(["security", "secretary"]), resolveEmergencyAlert);

// Notifications
router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.patch("/notifications/read-all", markAllNotificationsRead);

// Analytics
router.get("/analytics/overview", authorizeRole(["secretary"]), getAnalyticsOverview);

// Membership Requests (Secretary / Superadmin)
router.get("/membership-requests", authorizeRole(["secretary", "superadmin"]), getMembershipRequests);
router.patch("/membership-requests/:id/approve", authorizeRole(["secretary", "superadmin"]), approveMembershipRequest);
router.patch("/membership-requests/:id/reject", authorizeRole(["secretary", "superadmin"]), rejectMembershipRequest);

// Invitations (Secretary / Superadmin)
router.get("/invitations", authorizeRole(["secretary", "superadmin"]), getInvitations);
router.post(
  "/invitations",
  authorizeRole(["secretary", "superadmin"]),
  [body("role").isIn(["resident", "secretary", "security"]).withMessage("Valid role is required")],
  validate,
  createInvitation
);
router.patch("/invitations/:id/revoke", authorizeRole(["secretary", "superadmin"]), revokeInvitation);

export default router;
