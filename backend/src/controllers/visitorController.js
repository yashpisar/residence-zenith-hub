import crypto from "crypto";
import mongoose from "mongoose";
import { Visitor, Flat, Notification } from "../models/index.js";
import { emitToFlat, emitToGuards, emitToUser } from "../config/socket.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { saveBase64Image } from "./fileController.js";

export async function getVisitors(req, res, next) {
  try {
    const { status, search, wing, page = 1, limit = 50 } = req.query;
    const filter = { societyId: req.societyId };

    if (req.role === "resident") {
      filter.flatId = req.flatId;
    }

    if (status && status !== "All" && status !== "all") {
      if (status === "inside" || status === "Inside") {
        filter.entryTime = { $ne: null };
        filter.exitTime = null;
        filter.approvalStatus = "Approved";
      } else if (status === "exited" || status === "Exited") {
        filter.exitTime = { $ne: null };
      } else if (status === "pending" || status === "Pending") {
        filter.approvalStatus = "Pending";
      } else if (status === "approved" || status === "Approved") {
        filter.approvalStatus = "Approved";
      } else if (status === "rejected" || status === "Rejected") {
        filter.approvalStatus = "Rejected";
      } else {
        filter.approvalStatus = status;
      }
    }

    if (wing && wing !== "All") {
      filter.wing = wing;
    }

    if (search) {
      filter.$or = [
        { visitorName: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
        { vehicleNumber: new RegExp(search, "i") },
        { flatNumber: new RegExp(search, "i") },
        { purpose: new RegExp(search, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [visitors, total] = await Promise.all([
      Visitor.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("flatId", "wing flatNumber ownerName ownerPhone")
        .populate("approvedBy", "name")
        .populate("guardId", "name")
        .lean(),
      Visitor.countDocuments(filter),
    ]);

    const formatted = visitors.map((v) => {
      // Determine overall human-readable status
      let calculatedStatus = v.approvalStatus;
      if (v.exitTime) {
        calculatedStatus = "Exited";
      } else if (v.entryTime) {
        calculatedStatus = "Inside";
      } else if (v.approvalStatus === "Approved") {
        calculatedStatus = "Approved";
      } else if (v.approvalStatus === "Pending") {
        calculatedStatus = "Awaiting approval";
      }

      return {
        ...v,
        id: v._id.toString(),
        name: v.visitorName,
        flat: v.flatId ? `${v.flatId.wing}-${v.flatId.flatNumber}` : `${v.wing || ""}-${v.flatNumber || ""}`,
        status: calculatedStatus,
        entry: v.entryTime ? new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
        exit: v.exitTime ? new Date(v.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      };
    });

    return sendSuccess(res, {
      visitors: formatted,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
}

export async function getVisitorById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid visitor ID", 400);
    }

    const visitor = await Visitor.findOne({ _id: id, societyId: req.societyId })
      .populate("flatId", "wing flatNumber ownerName ownerPhone")
      .populate("approvedBy", "name phone")
      .populate("guardId", "name phone")
      .lean();

    if (!visitor) {
      return sendError(res, "Visitor record not found", 404);
    }

    let calculatedStatus = visitor.approvalStatus;
    if (visitor.exitTime) {
      calculatedStatus = "Exited";
    } else if (visitor.entryTime) {
      calculatedStatus = "Inside";
    } else if (visitor.approvalStatus === "Approved") {
      calculatedStatus = "Approved";
    } else if (visitor.approvalStatus === "Pending") {
      calculatedStatus = "Awaiting approval";
    }

    return sendSuccess(res, {
      ...visitor,
      id: visitor._id.toString(),
      name: visitor.visitorName,
      flat: visitor.flatId ? `${visitor.flatId.wing}-${visitor.flatId.flatNumber}` : `${visitor.wing || ""}-${visitor.flatNumber || ""}`,
      status: calculatedStatus,
      entry: visitor.entryTime ? new Date(visitor.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
      exit: visitor.exitTime ? new Date(visitor.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerVisitor(req, res, next) {
  try {
    const {
      visitorName,
      phone,
      purpose = "Guest",
      wing,
      flatNumber,
      flatId,
      vehicleNumber,
      photographUrl,
      idProofPhoto,
      idType,
      idNumber,
      numberOfVisitors = 1,
      notes,
      expectedTime,
      immediateEntry = false,
    } = req.body;

    let targetFlatId = flatId;
    let targetWing = wing ? wing.trim() : "";
    let targetFlatNumber = flatNumber ? flatNumber.trim() : "";

    if (!targetFlatId) {
      const foundFlat = await Flat.findOne({
        societyId: req.societyId,
        wing: targetWing,
        flatNumber: targetFlatNumber,
      });
      if (foundFlat) {
        targetFlatId = foundFlat._id;
      }
    } else {
      const foundFlat = await Flat.findById(targetFlatId);
      if (foundFlat) {
        targetWing = foundFlat.wing;
        targetFlatNumber = foundFlat.flatNumber;
      }
    }

    if (!targetFlatId) {
      return sendError(res, `Flat ${targetWing}-${targetFlatNumber} not found in this society.`, 404);
    }

    // Deduplication guard: Check if identical visitor was logged for this flat within 15 seconds
    const recentDuplicate = await Visitor.findOne({
      societyId: req.societyId,
      flatId: targetFlatId,
      phone: phone.trim(),
      visitorName: visitorName.trim(),
      createdAt: { $gte: new Date(Date.now() - 15000) },
    }).lean();

    if (recentDuplicate) {
      return sendSuccess(
        res,
        { ...recentDuplicate, id: recentDuplicate._id.toString() },
        "Visitor already registered moments ago",
        200
      );
    }

    // Process and persist any base64 images to permanent disk storage
    const savedPhoto = saveBase64Image(photographUrl);
    const savedIdPhoto = saveBase64Image(idProofPhoto);

    const isResident = req.role === "resident";
    const passToken = `PASS_${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    // Link pre-approved expected visitor if one exists and hasn't entered
    let existingExpected = null;
    if (!isResident) {
      existingExpected = await Visitor.findOne({
        societyId: req.societyId,
        flatId: targetFlatId,
        phone: phone.trim(),
        entryTime: null,
        approvalStatus: "Approved",
      });
    }

    if (existingExpected) {
      existingExpected.visitorName = visitorName.trim();
      existingExpected.purpose = purpose;
      if (vehicleNumber) existingExpected.vehicleNumber = vehicleNumber.trim();
      if (savedPhoto) existingExpected.photographUrl = savedPhoto;
      if (savedIdPhoto) existingExpected.idProofPhoto = savedIdPhoto;
      existingExpected.entryTime = new Date();
      existingExpected.guardId = req.user._id;
      await existingExpected.save();

      emitToFlat(targetFlatId.toString(), "visitor:entered", {
        visitorId: existingExpected._id.toString(),
        visitorName: existingExpected.visitorName,
        entryTime: existingExpected.entryTime,
      });

      return sendSuccess(
        res,
        { ...existingExpected.toObject(), id: existingExpected._id.toString() },
        "Expected visitor checked in successfully",
        200
      );
    }

    // Standard new visitor creation
    const isInstant = Boolean(immediateEntry) || isResident;
    const approvalStatus = isInstant ? "Approved" : "Pending";
    const entryTime = (immediateEntry && !isResident) ? new Date() : undefined;

    const visitor = await Visitor.create({
      societyId: req.societyId,
      flatId: targetFlatId,
      wing: targetWing,
      flatNumber: targetFlatNumber,
      visitorName: visitorName.trim(),
      phone: phone.trim(),
      purpose,
      vehicleNumber: vehicleNumber ? vehicleNumber.trim() : "",
      numberOfVisitors: Number(numberOfVisitors) || 1,
      notes: notes ? notes.trim() : "",
      photographUrl: savedPhoto || "",
      idProofPhoto: savedIdPhoto || "",
      idType: idType || "",
      idNumber: idNumber || "",
      expectedTime: expectedTime ? new Date(expectedTime) : undefined,
      registeredBy: isResident ? "resident" : "guard",
      guardId: isResident ? undefined : req.user._id,
      approvalStatus,
      approvedBy: isInstant ? req.user._id : undefined,
      entryTime,
      passToken,
    });

    // Notify flat residents if guard registered a visitor awaiting approval
    if (!isResident && approvalStatus === "Pending") {
      const flat = await Flat.findById(targetFlatId);
      const recipientIds = flat?.residentIds || [];
      if (flat?.ownerId && !recipientIds.some((id) => id.toString() === flat.ownerId.toString())) {
        recipientIds.push(flat.ownerId);
      }

      for (const recId of recipientIds) {
        await Notification.create({
          societyId: req.societyId,
          recipientId: recId,
          type: "visitor",
          title: `Visitor Approval Request: ${visitor.visitorName}`,
          message: `${visitor.visitorName} (${visitor.purpose}) is at the gate for flat ${targetWing}-${targetFlatNumber}.`,
          relatedResource: "visitor",
          relatedId: visitor._id.toString(),
        });
        emitToUser(recId.toString(), "visitor:approval_requested", {
          visitor: { ...visitor.toObject(), id: visitor._id.toString() },
        });
      }

      emitToFlat(targetFlatId.toString(), "visitor:approval_requested", {
        visitor: { ...visitor.toObject(), id: visitor._id.toString() },
      });
    }

    // If entry was recorded immediately, emit entry event
    if (entryTime) {
      emitToFlat(targetFlatId.toString(), "visitor:entered", {
        visitorId: visitor._id.toString(),
        visitorName: visitor.visitorName,
        entryTime: visitor.entryTime,
      });
    }

    return sendSuccess(res, { ...visitor.toObject(), id: visitor._id.toString() }, "Visitor registered successfully", 201);
  } catch (error) {
    next(error);
  }
}

export async function approveVisitor(req, res, next) {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findOne({ _id: id, societyId: req.societyId });

    if (!visitor) {
      return sendError(res, "Visitor record not found", 404);
    }

    visitor.approvalStatus = "Approved";
    visitor.approvedBy = req.user._id;
    await visitor.save();

    emitToGuards(req.societyId, "visitor:approved", {
      visitorId: visitor._id.toString(),
      visitorName: visitor.visitorName,
      flat: `${visitor.wing}-${visitor.flatNumber}`,
    });

    return sendSuccess(res, { ...visitor.toObject(), id: visitor._id.toString() }, "Visitor approved");
  } catch (error) {
    next(error);
  }
}

export async function rejectVisitor(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const visitor = await Visitor.findOne({ _id: id, societyId: req.societyId });
    if (!visitor) {
      return sendError(res, "Visitor record not found", 404);
    }

    visitor.approvalStatus = "Rejected";
    visitor.rejectionReason = reason || "Entry denied by resident";
    await visitor.save();

    emitToGuards(req.societyId, "visitor:rejected", {
      visitorId: visitor._id.toString(),
      visitorName: visitor.visitorName,
      flat: `${visitor.wing}-${visitor.flatNumber}`,
      reason: visitor.rejectionReason,
    });

    return sendSuccess(res, { ...visitor.toObject(), id: visitor._id.toString() }, "Visitor rejected");
  } catch (error) {
    next(error);
  }
}

export async function recordEntry(req, res, next) {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findOne({ _id: id, societyId: req.societyId });

    if (!visitor) {
      return sendError(res, "Visitor record not found", 404);
    }

    if (visitor.approvalStatus !== "Approved") {
      // Guard can approve walk-in entry directly
      if (req.role === "security" || req.role === "secretary" || req.role === "superadmin") {
        visitor.approvalStatus = "Approved";
        visitor.approvedBy = req.user._id;
      } else {
        return sendError(res, "Cannot record entry. Visitor is not approved by resident.", 403);
      }
    }

    visitor.entryTime = new Date();
    visitor.guardId = req.user._id;
    await visitor.save();

    emitToFlat(visitor.flatId.toString(), "visitor:entered", {
      visitorId: visitor._id.toString(),
      visitorName: visitor.visitorName,
      entryTime: visitor.entryTime,
    });

    return sendSuccess(res, { ...visitor.toObject(), id: visitor._id.toString() }, "Visitor entry recorded");
  } catch (error) {
    next(error);
  }
}

export async function recordExit(req, res, next) {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findOne({ _id: id, societyId: req.societyId });

    if (!visitor) {
      return sendError(res, "Visitor record not found", 404);
    }

    visitor.exitTime = new Date();
    await visitor.save();

    emitToFlat(visitor.flatId.toString(), "visitor:exited", {
      visitorId: visitor._id.toString(),
      visitorName: visitor.visitorName,
      exitTime: visitor.exitTime,
    });

    return sendSuccess(res, { ...visitor.toObject(), id: visitor._id.toString() }, "Visitor exit recorded");
  } catch (error) {
    next(error);
  }
}

export async function getExpectedVisitors(req, res, next) {
  try {
    const visitors = await Visitor.find({
      societyId: req.societyId,
      entryTime: null,
      approvalStatus: "Approved",
    })
      .populate("flatId", "wing flatNumber ownerName")
      .sort({ expectedTime: 1, createdAt: -1 })
      .lean();

    const formatted = visitors.map((v) => ({
      ...v,
      id: v._id.toString(),
      flat: v.flatId ? `${v.flatId.wing}-${v.flatId.flatNumber}` : `${v.wing || ""}-${v.flatNumber || ""}`,
    }));

    return sendSuccess(res, formatted);
  } catch (error) {
    next(error);
  }
}
