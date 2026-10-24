import mongoose from "mongoose";
import { verifyAccessToken } from "../utils/token.js";
import { User, SocietyMembership, Society, Flat } from "../models/index.js";
import { sendError } from "../utils/response.js";

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return sendError(res, "Access denied. Authentication token required.", 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).lean();

    if (!user) {
      return sendError(res, "User not found or account no longer exists.", 401);
    }

    if (user.status !== "Active") {
      return sendError(
        res,
        `Your account is ${user.status.toLowerCase()}. Please contact the society administrator.`,
        403
      );
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Access token has expired. Please refresh your session.", 401);
    }
    return sendError(res, "Invalid authentication token.", 401);
  }
}

export async function requireSociety(req, res, next) {
  try {
    const rawSocietyId =
      req.query.societyId ||
      req.body.societyId ||
      req.headers["x-society-id"] ||
      req.user?.societyId?.toString();

    if (!rawSocietyId) {
      return sendError(res, "Society context required. Please select a society.", 400);
    }

    // Resolve target society by ObjectId, registrationNumber, id, or slug
    let targetSociety = null;
    if (mongoose.Types.ObjectId.isValid(rawSocietyId)) {
      targetSociety = await Society.findById(rawSocietyId).lean();
    }
    if (!targetSociety) {
      targetSociety = await Society.findOne({
        $or: [
          { registrationNumber: rawSocietyId },
          { slug: rawSocietyId },
          { id: rawSocietyId },
        ],
      }).lean();
    }

    const resolvedSocietyId = targetSociety
      ? targetSociety._id
      : mongoose.Types.ObjectId.isValid(rawSocietyId)
        ? rawSocietyId
        : null;

    if (!resolvedSocietyId) {
      return sendError(res, "Society not found. Please select a valid society.", 404);
    }

    // Superadmins have universal access
    if (req.user.role === "superadmin") {
      req.societyId = resolvedSocietyId;
      req.role = "superadmin";
      return next();
    }

    // Check user's membership for this specific society
    const membership = await SocietyMembership.findOne({
      userId: req.user._id,
      societyId: resolvedSocietyId,
    }).lean();

    if (!membership) {
      return sendError(res, "Unauthorized. You are not a member of this society.", 403);
    }

    if (membership.status !== "Active") {
      const statusMsg =
        membership.status === "Pending"
          ? "Your membership registration for this society is pending approval from the administrator."
          : membership.status === "Rejected"
          ? "Your membership request for this society was rejected."
          : `Your membership status is ${membership.status.toLowerCase()}. Access denied.`;
      return sendError(res, statusMsg, 403);
    }

    req.societyId = resolvedSocietyId;
    req.membership = membership;
    req.role = membership.role || req.user.role;
    req.flatId = membership.flatId;
    req.wing = membership.wing || req.user.wing;
    req.flatNumber = membership.flatNumber || req.user.flatNumber;

    next();
  } catch (error) {
    next(error);
  }
}

export function authorizeRole(roles = []) {
  return (req, res, next) => {
    const currentRole = req.role || req.user?.role;
    if (!currentRole || (!roles.includes(currentRole) && currentRole !== "superadmin")) {
      return sendError(
        res,
        `Access forbidden. Required role(s): ${roles.join(", ")}. Your role: ${currentRole}`,
        403
      );
    }
    next();
  };
}
