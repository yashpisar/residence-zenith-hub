import mongoose from "mongoose";
import { Complaint, Notification, Staff, SocietyMembership } from "../models/index.js";
import { emitToSecretaries, emitToUser, emitToSociety } from "../config/socket.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function getComplaints(req, res, next) {
  try {
    const { status, category, priority, visibility, page = 1, limit = 20 } = req.query;
    const filter = { societyId: req.societyId };

    // Residents see their own complaints by default, or public ones if explicitly requested
    if (req.role === "resident") {
      filter.$or = [{ createdBy: req.user._id }, { visibility: "public" }];
    } else if (req.role === "security") {
      const staffMember = await Staff.findOne({ societyId: req.societyId, userId: req.user._id });
      const guardConditions = [{ category: "Security" }, { visibility: "public" }];
      if (staffMember) {
        guardConditions.push({ "assignedStaff.staffId": staffMember._id });
      }
      filter.$or = guardConditions;
    }

    if (status && status !== "All") filter.status = status;
    if (category && category !== "All") filter.category = category;
    if (priority && priority !== "All") filter.priority = priority;
    if (visibility) filter.visibility = visibility;

    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ isUrgent: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("createdBy", "name flatNumber wing avatarUrl")
        .populate("assignedStaff.staffId", "name phone role shift status")
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    const formatted = complaints.map((c) => ({
      ...c,
      id: c._id.toString(),
      upvoteCount: c.upvotes ? c.upvotes.length : 0,
      hasUpvoted: c.upvotes ? c.upvotes.some((u) => u.toString() === req.user._id.toString()) : false,
    }));

    return sendSuccess(res, formatted, "Complaints fetched", 200, {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicComplaints(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { societyId: req.societyId, visibility: "public" };
    const skip = (Number(page) - 1) * Number(limit);

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .sort({ isUrgent: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-createdBy.phone -createdBy.email")
        .populate("createdBy", "name flatNumber wing")
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    const formatted = complaints.map((c) => ({
      ...c,
      id: c._id.toString(),
      upvoteCount: c.upvotes ? c.upvotes.length : 0,
      hasUpvoted: c.upvotes ? c.upvotes.some((u) => u.toString() === req.user._id.toString()) : false,
    }));

    return sendSuccess(res, formatted, "Public complaints fetched", 200, {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getComplaintById(req, res, next) {
  try {
    const { id } = req.params;
    let query = { societyId: req.societyId };

    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.complaintNumber = id;
    }

    const complaint = await Complaint.findOne(query)
      .populate("createdBy", "name email phone wing flatNumber avatarUrl")
      .populate("societyId", "name registrationNumber city")
      .populate("flatId", "wing flatNumber floor occupancyStatus")
      .populate("statusHistory.changedBy", "name role")
      .populate("assignedStaff.staffId", "name phone role shift status")
      .populate("assignedStaff.assignedBy", "name role")
      .lean();

    if (!complaint) {
      return sendError(res, "Complaint not found or does not belong to your society.", 404);
    }

    // Role check: If resident, ensure private complaint belongs to them
    if (req.role === "resident" && complaint.visibility === "private") {
      const creatorId = complaint.createdBy?._id?.toString() || complaint.createdBy?.toString();
      if (creatorId !== req.user._id.toString()) {
        return sendError(res, "You do not have permission to view this complaint.", 403);
      }
    }

    const formatted = {
      ...complaint,
      id: complaint._id.toString(),
      upvoteCount: complaint.upvotes ? complaint.upvotes.length : 0,
      hasUpvoted: complaint.upvotes ? complaint.upvotes.some((u) => u.toString() === req.user._id.toString()) : false,
      societyName: complaint.societyId?.name || "",
    };

    return sendSuccess(res, formatted, "Complaint details fetched successfully");
  } catch (error) {
    next(error);
  }
}

export async function createComplaint(req, res, next) {
  try {
    const { title, description, category, priority = "Medium", isUrgent = false, visibility = "private", images = [] } = req.body;

    // Generate unique complaint number for this society and year
    const year = new Date().getFullYear();
    const count = await Complaint.countDocuments({
      societyId: req.societyId,
      createdAt: { $gte: new Date(`${year}-01-01`) },
    });
    const complaintNumber = `CMP-${year}-${String(count + 1).padStart(3, "0")}`;

    const complaint = await Complaint.create({
      societyId: req.societyId,
      complaintNumber,
      createdBy: req.user._id,
      flatId: req.flatId,
      wing: req.wing || req.user.wing,
      flatNumber: req.flatNumber || req.user.flatNumber,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      isUrgent: Boolean(isUrgent),
      visibility,
      status: "Pending",
      images: Array.isArray(images) ? images : [],
      upvotes: [],
      statusHistory: [
        {
          status: "Pending",
          changedBy: req.user._id,
          changedAt: new Date(),
          notes: "Complaint registered by resident",
        },
      ],
    });

    // Notify Secretary
    await Notification.create({
      societyId: req.societyId,
      recipientId: req.user._id, // Will notify secretary room
      type: "complaint",
      title: `New ${priority} Complaint: ${complaintNumber}`,
      message: `${req.user.name} raised: "${title}" (${category})`,
      relatedResource: "complaint",
      relatedId: complaint._id.toString(),
    });

    emitToSecretaries(req.societyId, "complaint:created", {
      complaint: { ...complaint.toObject(), id: complaint._id.toString() },
    });

    if (visibility === "public") {
      emitToSociety(req.societyId, "complaint:public_added", {
        complaint: { ...complaint.toObject(), id: complaint._id.toString() },
      });
    }

    return sendSuccess(res, { ...complaint.toObject(), id: complaint._id.toString() }, "Complaint submitted successfully", 201);
  } catch (error) {
    next(error);
  }
}

export async function updateComplaintStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ["Pending", "In Progress", "Resolved", "Closed"];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
    }

    let query = { societyId: req.societyId };
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.complaintNumber = id;
    }

    const complaint = await Complaint.findOne(query);
    if (!complaint) {
      return sendError(res, "Complaint not found", 404);
    }

    complaint.status = status;
    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: notes || `Status marked as ${status} by ${req.user.name}`,
    });

    await complaint.save();

    // Create notification for resident
    await Notification.create({
      societyId: req.societyId,
      recipientId: complaint.createdBy,
      type: "complaint",
      title: `Complaint ${complaint.complaintNumber} Updated`,
      message: `Your complaint is now marked as "${status}".`,
      relatedResource: "complaint",
      relatedId: complaint._id.toString(),
    });

    emitToUser(complaint.createdBy.toString(), "complaint:updated", {
      complaintId: complaint._id.toString(),
      status,
      notes,
    });

    emitToSecretaries(req.societyId, "complaint:updated", {
      complaintId: complaint._id.toString(),
      status,
    });

    return sendSuccess(res, { ...complaint.toObject(), id: complaint._id.toString() }, "Complaint status updated");
  } catch (error) {
    next(error);
  }
}

export async function assignComplaintStaff(req, res, next) {
  try {
    const { id } = req.params;
    const { staffMemberId, staffId, name: rawName, staffName, phone: rawPhone, role: rawRole } = req.body;

    // 1. Locate the complaint by ID or complaintNumber
    const complaint = mongoose.Types.ObjectId.isValid(id)
      ? await Complaint.findById(id)
      : await Complaint.findOne({ complaintNumber: id });

    if (!complaint) {
      return sendError(res, "Complaint not found.", 404);
    }

    // 2. Authorization check: Secretary of the complaint's society or superadmin
    const isSuperadmin = req.user.role === "superadmin";
    const isSecretaryOfThisSociety =
      req.societyId?.toString() === complaint.societyId.toString() ||
      (await SocietyMembership.exists({
        userId: req.user._id,
        societyId: complaint.societyId,
        role: "secretary",
        status: "Active",
      }));

    if (!isSuperadmin && !isSecretaryOfThisSociety) {
      return sendError(res, "You do not have permission to assign staff for this society.", 403);
    }

    let targetStaffId = staffMemberId || staffId;
    let staffDoc = null;
    let finalStaffName = (rawName || staffName || "").trim();
    let finalStaffPhone = (rawPhone || "").trim();
    let finalStaffRole = (rawRole || "").trim();

    if (targetStaffId) {
      if (!mongoose.Types.ObjectId.isValid(targetStaffId)) {
        return sendError(res, "Invalid staff member ID.", 400);
      }
      staffDoc = await Staff.findById(targetStaffId);
      if (!staffDoc) {
        return sendError(res, "Staff member not found.", 404);
      }
      // Security: staff must belong to the same society as the complaint
      if (staffDoc.societyId.toString() !== complaint.societyId.toString()) {
        return sendError(res, "Staff member does not belong to this society.", 403);
      }
      if (staffDoc.status === "Terminated") {
        return sendError(res, "Cannot assign a terminated staff member.", 400);
      }
      finalStaffName = staffDoc.name;
      finalStaffPhone = staffDoc.phone || "";
      finalStaffRole = staffDoc.role || "Staff";
    } else if (!finalStaffName) {
      return sendError(res, "Please select a staff member to assign.", 400);
    }

    const wasAssigned = !!complaint.assignedStaff?.name;
    const previousStaffName = complaint.assignedStaff?.name;

    complaint.assignedStaff = {
      staffId: staffDoc ? staffDoc._id : undefined,
      name: finalStaffName,
      phone: finalStaffPhone,
      role: finalStaffRole || "Facility Staff",
      assignedAt: new Date(),
      assignedBy: req.user._id,
    };

    if (complaint.status === "Pending") {
      complaint.status = "In Progress";
    }

    const note = wasAssigned
      ? `Reassigned from ${previousStaffName} to ${finalStaffName} (${finalStaffRole || "Staff"})`
      : `Assigned to ${finalStaffName} (${finalStaffRole || "Staff"})`;

    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: note,
    });

    await complaint.save();

    // Notify resident
    emitToUser(complaint.createdBy.toString(), "complaint:assigned", {
      complaintId: complaint._id.toString(),
      assignedStaff: complaint.assignedStaff,
    });

    // Notify staff user if linked
    if (staffDoc?.userId) {
      emitToUser(staffDoc.userId.toString(), "complaint:assigned_to_you", {
        complaintId: complaint._id.toString(),
        complaintNumber: complaint.complaintNumber,
        title: complaint.title,
      });
    }

    const populated = await Complaint.findById(complaint._id)
      .populate("createdBy", "name email phone wing flatNumber avatarUrl")
      .populate("societyId", "name registrationNumber city")
      .populate("flatId", "wing flatNumber floor occupancyStatus")
      .populate("statusHistory.changedBy", "name role")
      .lean();

    return sendSuccess(
      res,
      { ...populated, id: populated._id.toString() },
      wasAssigned ? `Complaint reassigned to ${finalStaffName}` : `Staff ${finalStaffName} assigned successfully`
    );
  } catch (error) {
    next(error);
  }
}

export async function unassignComplaintStaff(req, res, next) {
  try {
    const { id } = req.params;
    const complaint = mongoose.Types.ObjectId.isValid(id)
      ? await Complaint.findById(id)
      : await Complaint.findOne({ complaintNumber: id });

    if (!complaint) {
      return sendError(res, "Complaint not found.", 404);
    }

    const isSuperadmin = req.user.role === "superadmin";
    const isSecretaryOfThisSociety =
      req.societyId?.toString() === complaint.societyId.toString() ||
      (await SocietyMembership.exists({
        userId: req.user._id,
        societyId: complaint.societyId,
        role: "secretary",
        status: "Active",
      }));

    if (!isSuperadmin && !isSecretaryOfThisSociety) {
      return sendError(res, "You do not have permission to manage complaints for this society.", 403);
    }

    if (!complaint.assignedStaff || !complaint.assignedStaff.name) {
      return sendError(res, "No staff member is currently assigned to this complaint.", 400);
    }

    const previousStaffName = complaint.assignedStaff.name;
    complaint.assignedStaff = undefined;

    complaint.statusHistory.push({
      status: complaint.status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: `Staff assignment removed (previously assigned to ${previousStaffName})`,
    });

    await complaint.save();

    emitToUser(complaint.createdBy.toString(), "complaint:unassigned", {
      complaintId: complaint._id.toString(),
    });

    const populated = await Complaint.findById(complaint._id)
      .populate("createdBy", "name email phone wing flatNumber avatarUrl")
      .populate("societyId", "name registrationNumber city")
      .populate("flatId", "wing flatNumber floor occupancyStatus")
      .populate("statusHistory.changedBy", "name role")
      .lean();

    return sendSuccess(
      res,
      { ...populated, id: populated._id.toString() },
      "Staff assignment removed successfully"
    );
  } catch (error) {
    next(error);
  }
}

export async function toggleComplaintSupport(req, res, next) {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findOne({ _id: id, societyId: req.societyId, visibility: "public" });

    if (!complaint) {
      return sendError(res, "Public complaint not found", 404);
    }

    const userIdStr = req.user._id.toString();
    const alreadyUpvoted = complaint.upvotes.some((u) => u.toString() === userIdStr);

    if (alreadyUpvoted) {
      complaint.upvotes = complaint.upvotes.filter((u) => u.toString() !== userIdStr);
    } else {
      complaint.upvotes.push(req.user._id);
    }

    await complaint.save();

    return sendSuccess(res, {
      id: complaint._id.toString(),
      upvoteCount: complaint.upvotes.length,
      hasUpvoted: !alreadyUpvoted,
    }, alreadyUpvoted ? "Upvote removed" : "Complaint upvoted");
  } catch (error) {
    next(error);
  }
}
