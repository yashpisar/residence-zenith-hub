import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  Notice,
  Document,
  Flat,
  User,
  SocietyMembership,
  Staff,
  Delivery,
  EmergencyAlert,
  Notification,
  Complaint,
  MaintenanceBill,
  Visitor,
  Invitation,
  AuditLog,
} from "../models/index.js";
import { emitToSociety, emitToGuards, emitToSecretaries, emitToFlat, emitToUser } from "../config/socket.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { saveBase64Image } from "./fileController.js";

// --- NOTICES ---

export async function getNotices(req, res, next) {
  try {
    const { category, search } = req.query;
    const role = req.role || req.user?.role;

    const filter = { societyId: req.societyId, status: "Published" };

    // Audience-based filtering by role
    // secretary / superadmin can see all notices
    // resident sees notices targeted at "all" or "residents"
    // security guard sees notices targeted at "all" or "staff"
    if (role === "resident") {
      filter.targetAudience = { $in: ["all", "residents"] };
    } else if (role === "security") {
      filter.targetAudience = { $in: ["all", "staff"] };
    }
    // secretary and superadmin get everything (no targetAudience filter)

    if (category && category !== "All") filter.category = category;
    if (search) {
      filter.$or = [{ title: new RegExp(search, "i") }, { description: new RegExp(search, "i") }];
    }

    const notices = await Notice.find(filter).sort({ publishedAt: -1 }).lean();
    return sendSuccess(res, notices.map((n) => ({ ...n, id: n._id.toString() })));
  } catch (error) {
    next(error);
  }
}

export async function createNotice(req, res, next) {
  try {
    const { title, description, category = "General", priority = "Medium", targetAudience = "all" } = req.body;

    const notice = await Notice.create({
      societyId: req.societyId,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      postedBy: req.user._id,
      authorName: req.user.name,
      targetAudience,
      status: "Published",
      publishedAt: new Date(),
    });

    emitToSociety(req.societyId, "notice:published", {
      notice: { ...notice.toObject(), id: notice._id.toString() },
    });

    return sendSuccess(res, { ...notice.toObject(), id: notice._id.toString() }, "Notice published successfully", 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteNotice(req, res, next) {
  try {
    const { id } = req.params;
    await Notice.findOneAndDelete({ _id: id, societyId: req.societyId });
    return sendSuccess(res, null, "Notice deleted");
  } catch (error) {
    next(error);
  }
}

// --- DOCUMENTS ---

export async function getDocuments(req, res, next) {
  try {
    const { category } = req.query;
    const filter = { societyId: req.societyId };

    if (req.role !== "secretary" && req.role !== "superadmin") {
      filter.accessLevel = "public_to_society";
    }

    if (category && category !== "All") filter.category = category;

    const documents = await Document.find(filter).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, documents.map((d) => ({ ...d, id: d._id.toString() })));
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req, res, next) {
  try {
    const { title, category, fileUrl, fileType, fileSize, accessLevel = "public_to_society", description } = req.body;

    const doc = await Document.create({
      societyId: req.societyId,
      title: title.trim(),
      category: category || "Other",
      fileUrl,
      fileType: fileType || "application/pdf",
      fileSize: fileSize || 0,
      uploadedBy: req.user._id,
      uploaderName: req.user.name,
      accessLevel,
      description: description || "",
    });

    return sendSuccess(res, { ...doc.toObject(), id: doc._id.toString() }, "Document added successfully", 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    await Document.findOneAndDelete({ _id: id, societyId: req.societyId });
    return sendSuccess(res, null, "Document removed");
  } catch (error) {
    next(error);
  }
}

// --- RESIDENTS DIRECTORY (SECRETARY) ---

export async function getResidents(req, res, next) {
  try {
    const { search, wing } = req.query;
    const filter = { societyId: req.societyId, role: "resident" };

    if (wing && wing !== "All") filter.wing = wing;

    const memberships = await SocietyMembership.find(filter)
      .populate("userId", "name email phone avatarUrl status")
      .populate("flatId", "wing flatNumber floor occupancyStatus")
      .lean();

    const formatted = memberships
      .filter((m) => m.userId)
      .map((m) => ({
        id: m.userId._id.toString(),
        membershipId: m._id.toString(),
        name: m.userId.name,
        email: m.userId.email,
        phone: m.userId.phone || "—",
        wing: m.wing || m.flatId?.wing || "A",
        flatNumber: m.flatNumber || m.flatId?.flatNumber || "—",
        flat: `${m.wing || m.flatId?.wing || ""}-${m.flatNumber || m.flatId?.flatNumber || ""}`,
        type: m.isOwner ? "Owner" : "Tenant",
        status: m.userId.status,
      }));

    let results = formatted;
    if (search) {
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.flat.toLowerCase().includes(search.toLowerCase()) ||
          r.phone.includes(search)
      );
    }

    return sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
}

export async function createResident(req, res, next) {
  try {
    const { name, email, phone, wing, flatNumber, isOwner = true, password = "password123" } = req.body;

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : "",
        passwordHash,
        role: "resident",
        societyId: req.societyId,
        wing,
        flatNumber,
      });
    }

    // Find or create flat
    let flat = await Flat.findOne({
      societyId: req.societyId,
      wing,
      flatNumber,
    });

    if (!flat) {
      flat = await Flat.create({
        societyId: req.societyId,
        wing,
        flatNumber,
        floor: Number(flatNumber.replace(/\D/g, "")[0]) || 1,
        occupancyStatus: "Occupied",
        ownerId: isOwner ? user._id : undefined,
        ownerName: name,
        ownerPhone: phone,
        residentIds: [user._id],
      });
    } else {
      if (!flat.residentIds.includes(user._id)) {
        flat.residentIds.push(user._id);
        flat.occupancyStatus = "Occupied";
        await flat.save();
      }
    }

    // Create society membership
    await SocietyMembership.findOneAndUpdate(
      { userId: user._id, societyId: req.societyId },
      {
        userId: user._id,
        societyId: req.societyId,
        role: "resident",
        flatId: flat._id,
        wing,
        flatNumber,
        isOwner: Boolean(isOwner),
        status: "Active",
      },
      { upsert: true, new: true }
    );

    return sendSuccess(res, {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      flat: `${wing}-${flatNumber}`,
    }, "Resident registered successfully", 201);
  } catch (error) {
    next(error);
  }
}

// --- FLATS DIRECTORY ---

export async function getFlats(req, res, next) {
  try {
    const { wing, status } = req.query;
    const filter = { societyId: req.societyId };

    if (wing && wing !== "All") filter.wing = wing;
    if (status && status !== "All") filter.occupancyStatus = status;

    const flats = await Flat.find(filter)
      .sort({ wing: 1, flatNumber: 1 })
      .populate("ownerId", "name email phone")
      .populate("residentIds", "name email phone")
      .lean();

    return sendSuccess(res, flats.map((f) => ({
      ...f,
      id: f._id.toString(),
      residentName: f.ownerName || f.residentIds?.[0]?.name || "Vacant",
    })));
  } catch (error) {
    next(error);
  }
}

export async function createFlat(req, res, next) {
  try {
    const { wing, flatNumber, floor, occupancyStatus = "Occupied", ownerName, ownerPhone } = req.body;

    const flat = await Flat.create({
      societyId: req.societyId,
      wing: wing.trim(),
      flatNumber: flatNumber.trim(),
      floor: Number(floor) || 1,
      occupancyStatus,
      ownerName: ownerName ? ownerName.trim() : "",
      ownerPhone: ownerPhone ? ownerPhone.trim() : "",
    });

    return sendSuccess(res, { ...flat.toObject(), id: flat._id.toString() }, "Flat added successfully", 201);
  } catch (error) {
    next(error);
  }
}

export async function getFlatById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid flat ID", 400);
    }

    const flat = await Flat.findOne({ _id: id, societyId: req.societyId })
      .populate("ownerId", "name email phone")
      .populate("residentIds", "name email phone role")
      .lean();

    if (!flat) {
      return sendError(res, "Flat not found", 404);
    }

    return sendSuccess(res, { ...flat, id: flat._id.toString() });
  } catch (error) {
    next(error);
  }
}

export async function updateFlatOccupancy(req, res, next) {
  try {
    const { id } = req.params;
    const { occupancyStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid flat ID", 400);
    }

    const validStatuses = ["Occupied", "Vacant", "Under Maintenance"];
    if (!validStatuses.includes(occupancyStatus)) {
      return sendError(res, "Invalid occupancy status. Must be Occupied, Vacant, or Under Maintenance", 400);
    }

    const flat = await Flat.findOne({ _id: id, societyId: req.societyId })
      .populate("residentIds", "name")
      .lean();

    if (!flat) {
      return sendError(res, "Flat not found", 404);
    }

    // Guard: cannot mark Vacant if active approved residents are linked
    if (occupancyStatus === "Vacant" && flat.residentIds && flat.residentIds.length > 0) {
      const activeMembers = await SocietyMembership.countDocuments({
        societyId: req.societyId,
        flatId: flat._id,
        status: "Active",
        role: "resident",
      });
      if (activeMembers > 0) {
        return sendError(
          res,
          `Cannot mark flat as Vacant: ${activeMembers} active resident(s) are still linked. Please process their move-out first.`,
          409
        );
      }
    }

    const updated = await Flat.findByIdAndUpdate(
      id,
      { occupancyStatus },
      { new: true, runValidators: true }
    )
      .populate("ownerId", "name email phone")
      .populate("residentIds", "name email phone role")
      .lean();

    return sendSuccess(res, { ...updated, id: updated._id.toString() }, `Flat marked as ${occupancyStatus}`);
  } catch (error) {
    next(error);
  }
}

// --- STAFF DIRECTORY ---

export async function getStaff(req, res, next) {
  try {
    const targetSocietyId = req.query.societyId || req.societyId;
    const staff = await Staff.find({ societyId: targetSocietyId }).sort({ role: 1, name: 1 }).lean();
    return sendSuccess(res, staff.map((s) => ({ ...s, id: s._id.toString() })));
  } catch (error) {
    next(error);
  }
}

export async function createStaff(req, res, next) {
  try {
    const { name, phone, email, role, shift = "Morning", status = "On Duty", assignedWing = "All", societyId } = req.body;
    const targetSocietyId = societyId || req.query.societyId || req.societyId;

    const staffMember = await Staff.create({
      societyId: targetSocietyId,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : undefined,
      role,
      shift,
      status,
      assignedWing,
    });

    return sendSuccess(res, { ...staffMember.toObject(), id: staffMember._id.toString() }, "Staff member added", 201);
  } catch (error) {
    next(error);
  }
}

export async function updateStaff(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, email, role, shift, status, assignedWing } = req.body;

    const staffMember = await Staff.findOne({ _id: id, societyId: req.societyId });
    if (!staffMember) {
      return sendError(res, "Staff member not found in this society.", 404);
    }

    if (name) staffMember.name = name.trim();
    if (phone) staffMember.phone = phone.trim();
    if (email !== undefined) staffMember.email = email ? email.toLowerCase().trim() : undefined;
    if (role) staffMember.role = role;
    if (shift) staffMember.shift = shift;
    if (status) staffMember.status = status;
    if (assignedWing !== undefined) staffMember.assignedWing = assignedWing;

    await staffMember.save();

    return sendSuccess(res, { ...staffMember.toObject(), id: staffMember._id.toString() }, "Staff member updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function deleteStaff(req, res, next) {
  try {
    const { id } = req.params;
    const staffMember = await Staff.findOne({ _id: id, societyId: req.societyId });
    if (!staffMember) {
      return sendError(res, "Staff member not found in this society.", 404);
    }

    await Staff.deleteOne({ _id: id });
    return sendSuccess(res, { id }, "Staff member removed successfully");
  } catch (error) {
    next(error);
  }
}

// --- DELIVERIES ---

export async function getDeliveries(req, res, next) {
  try {
    const { status, search, wing } = req.query;
    const filter = { societyId: req.societyId };
    if (req.role === "resident") {
      filter.flatId = req.flatId;
    }

    if (status && status !== "All" && status !== "all") {
      filter.status = status;
    }

    if (wing && wing !== "All") {
      filter.wing = wing;
    }

    if (search) {
      filter.$or = [
        { recipientName: new RegExp(search, "i") },
        { courierCompany: new RegExp(search, "i") },
        { trackingNumber: new RegExp(search, "i") },
        { flatNumber: new RegExp(search, "i") },
        { deliveryPersonName: new RegExp(search, "i") },
      ];
    }

    const deliveries = await Delivery.find(filter)
      .sort({ createdAt: -1 })
      .populate("flatId", "wing flatNumber ownerName ownerPhone")
      .populate("receivedBy", "name")
      .lean();

    return sendSuccess(res, deliveries.map((d) => ({
      ...d,
      id: d._id.toString(),
      flat: d.flatId ? `${d.flatId.wing}-${d.flatId.flatNumber}` : `${d.wing}-${d.flatNumber}`,
    })));
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Invalid delivery ID", 400);
    }

    const delivery = await Delivery.findOne({ _id: id, societyId: req.societyId })
      .populate("flatId", "wing flatNumber ownerName ownerPhone")
      .populate("receivedBy", "name")
      .lean();

    if (!delivery) {
      return sendError(res, "Delivery parcel not found", 404);
    }

    return sendSuccess(res, {
      ...delivery,
      id: delivery._id.toString(),
      flat: delivery.flatId ? `${delivery.flatId.wing}-${delivery.flatId.flatNumber}` : `${delivery.wing}-${delivery.flatNumber}`,
    });
  } catch (error) {
    next(error);
  }
}

export async function createDelivery(req, res, next) {
  try {
    const {
      wing,
      flatNumber,
      recipientName,
      courierCompany,
      trackingNumber,
      parcelDetails,
      deliveryPersonName,
      deliveryPersonPhone,
      deliveryPersonPhoto,
      packagePhoto,
      deliveryType = "Parcel",
      notes,
    } = req.body;

    const flat = await Flat.findOne({ societyId: req.societyId, wing: wing.trim(), flatNumber: flatNumber.trim() });
    if (!flat) {
      return sendError(res, `Flat ${wing}-${flatNumber} not found`, 404);
    }

    // Deduplication guard: Check if identical delivery logged within 15 seconds
    const duplicate = await Delivery.findOne({
      societyId: req.societyId,
      flatId: flat._id,
      courierCompany: courierCompany.trim(),
      trackingNumber: trackingNumber ? trackingNumber.trim() : "",
      createdAt: { $gte: new Date(Date.now() - 15000) },
    }).lean();

    if (duplicate) {
      return sendSuccess(
        res,
        { ...duplicate, id: duplicate._id.toString(), flat: `${wing}-${flatNumber}` },
        "Delivery already recorded moments ago",
        200
      );
    }

    const finalRecipient = (recipientName && recipientName.trim()) || flat.ownerName || "Resident";
    const savedPackagePhoto = saveBase64Image(packagePhoto);
    const savedPersonPhoto = saveBase64Image(deliveryPersonPhoto);

    const delivery = await Delivery.create({
      societyId: req.societyId,
      flatId: flat._id,
      wing: wing.trim(),
      flatNumber: flatNumber.trim(),
      recipientName: finalRecipient,
      courierCompany: courierCompany.trim(),
      trackingNumber: trackingNumber ? trackingNumber.trim() : "",
      parcelDetails: parcelDetails || "",
      deliveryPersonName: deliveryPersonName ? deliveryPersonName.trim() : "",
      deliveryPersonPhone: deliveryPersonPhone ? deliveryPersonPhone.trim() : "",
      deliveryPersonPhoto: savedPersonPhoto || "",
      packagePhoto: savedPackagePhoto || "",
      deliveryType: deliveryType || "Parcel",
      notes: notes ? notes.trim() : "",
      receivedBy: req.user._id,
      receivedAt: new Date(),
      status: "Waiting for Pickup",
    });

    emitToFlat(flat._id.toString(), "delivery:received", {
      delivery: { ...delivery.toObject(), id: delivery._id.toString(), flat: `${wing}-${flatNumber}` },
    });

    return sendSuccess(
      res,
      { ...delivery.toObject(), id: delivery._id.toString(), flat: `${wing}-${flatNumber}` },
      "Delivery registered successfully",
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function collectDelivery(req, res, next) {
  try {
    const { id } = req.params;
    const { collectedBy, notes } = req.body;

    const delivery = await Delivery.findOne({ _id: id, societyId: req.societyId });
    if (!delivery) {
      return sendError(res, "Delivery parcel not found", 404);
    }

    delivery.status = "Collected";
    delivery.collectedAt = new Date();
    delivery.collectedBy = collectedBy || req.user.name;
    if (notes) {
      delivery.notes = delivery.notes ? `${delivery.notes} | ${notes}` : notes;
    }
    await delivery.save();

    emitToFlat(delivery.flatId.toString(), "delivery:collected", {
      deliveryId: delivery._id.toString(),
      collectedBy: delivery.collectedBy,
      collectedAt: delivery.collectedAt,
    });

    return sendSuccess(res, { ...delivery.toObject(), id: delivery._id.toString() }, "Parcel marked as collected / handed over");
  } catch (error) {
    next(error);
  }
}

export async function updateDeliveryStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, collectedBy, notes } = req.body;

    const delivery = await Delivery.findOne({ _id: id, societyId: req.societyId });
    if (!delivery) {
      return sendError(res, "Delivery parcel not found", 404);
    }

    if (status) delivery.status = status;
    if (status === "Collected") {
      delivery.collectedAt = new Date();
      delivery.collectedBy = collectedBy || req.user.name;
    }
    if (notes) {
      delivery.notes = delivery.notes ? `${delivery.notes} | ${notes}` : notes;
    }
    await delivery.save();

    return sendSuccess(res, { ...delivery.toObject(), id: delivery._id.toString() }, "Delivery status updated");
  } catch (error) {
    next(error);
  }
}

// --- EMERGENCY SOS ---

export async function getEmergencyAlerts(req, res, next) {
  try {
    const alerts = await EmergencyAlert.find({ societyId: req.societyId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    return sendSuccess(res, alerts.map((a) => ({ ...a, id: a._id.toString() })));
  } catch (error) {
    next(error);
  }
}

export async function triggerEmergencyAlert(req, res, next) {
  try {
    const { alertType, location, description } = req.body;

    const alert = await EmergencyAlert.create({
      societyId: req.societyId,
      reportedBy: req.user._id,
      reporterName: req.user.name,
      reporterPhone: req.user.phone || "",
      alertType,
      location: location || `Flat ${req.wing || ""}-${req.flatNumber || ""}`,
      flatId: req.flatId,
      wing: req.wing,
      flatNumber: req.flatNumber,
      description: description || "Immediate assistance requested!",
      priority: "Critical",
      status: "Active",
    });

    // Broadcast IMMEDIATELY to security guards and secretaries
    emitToGuards(req.societyId, "emergency:created", {
      alert: { ...alert.toObject(), id: alert._id.toString() },
    });
    emitToSecretaries(req.societyId, "emergency:created", {
      alert: { ...alert.toObject(), id: alert._id.toString() },
    });

    return sendSuccess(res, { ...alert.toObject(), id: alert._id.toString() }, "Emergency SOS alert broadcasted!", 201);
  } catch (error) {
    next(error);
  }
}

export async function resolveEmergencyAlert(req, res, next) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const alert = await EmergencyAlert.findOne({ _id: id, societyId: req.societyId });
    if (!alert) {
      return sendError(res, "Alert not found", 404);
    }

    alert.status = "Resolved";
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;
    alert.resolutionNotes = notes || `Resolved by ${req.user.name}`;
    await alert.save();

    return sendSuccess(res, { ...alert.toObject(), id: alert._id.toString() }, "Emergency alert marked resolved");
  } catch (error) {
    next(error);
  }
}

// --- NOTIFICATIONS ---

export async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({
      societyId: req.societyId,
      recipientId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return sendSuccess(res, notifications.map((n) => ({ ...n, id: n._id.toString() })));
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, null, "Marked as read");
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, societyId: req.societyId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return sendSuccess(res, null, "All marked as read");
  } catch (error) {
    next(error);
  }
}

// --- ANALYTICS ---

export async function getAnalyticsOverview(req, res, next) {
  try {
    const societyId = new mongoose.Types.ObjectId(req.societyId);

    const [
      complaintsByCategory,
      complaintStatusCounts,
      maintenanceBreakdown,
      weeklyVisitors,
    ] = await Promise.all([
      Complaint.aggregate([
        { $match: { societyId } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { societyId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      MaintenanceBill.aggregate([
        { $match: { societyId } },
        {
          $group: {
            _id: "$status",
            totalBilled: { $sum: "$totalAmount" },
            totalCollected: { $sum: "$paidAmount" },
            totalPending: { $sum: "$outstandingBalance" },
          },
        },
      ]),
      Visitor.aggregate([
        {
          $match: {
            societyId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const visitorFlow = [
      { name: "Mon", visitors: 0, deliveries: 0 },
      { name: "Tue", visitors: 0, deliveries: 0 },
      { name: "Wed", visitors: 0, deliveries: 0 },
      { name: "Thu", visitors: 0, deliveries: 0 },
      { name: "Fri", visitors: 0, deliveries: 0 },
      { name: "Sat", visitors: 0, deliveries: 0 },
      { name: "Sun", visitors: 0, deliveries: 0 },
    ];

    weeklyVisitors.forEach((v) => {
      const dayName = daysMap[v._id - 1];
      const found = visitorFlow.find((f) => f.name === dayName);
      if (found) found.visitors = v.count;
    });

    return sendSuccess(res, {
      categorySplit: complaintsByCategory.map((c) => ({ name: c._id, value: c.count })),
      complaintStatus: complaintStatusCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      maintenanceBreakdown,
      visitorFlow,
    });
  } catch (error) {
    next(error);
  }
}

// --- MEMBERSHIP APPROVALS & INVITATIONS ---

export async function getMembershipRequests(req, res, next) {
  try {
    const requests = await SocietyMembership.find({
      societyId: req.societyId,
      status: "Pending",
    })
      .populate("userId", "name email phone avatarUrl status")
      .populate("flatId", "wing flatNumber floor occupancyStatus")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = requests.map((r) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      userId: r.userId?._id?.toString(),
      name: r.userId?.name || "Unknown",
      email: r.userId?.email || "",
      phone: r.userId?.phone || "",
      avatar: r.userId?.avatarUrl || "",
      role: r.role,
      residentType: r.residentType || "Owner",
      wing: r.wing || r.flatId?.wing || "",
      flatNumber: r.flatNumber || r.flatId?.flatNumber || "",
      status: r.status,
      appliedAt: r.createdAt,
    }));

    return sendSuccess(res, formatted);
  } catch (error) {
    next(error);
  }
}

export async function approveMembershipRequest(req, res, next) {
  try {
    const { id } = req.params;

    const membership = await SocietyMembership.findOne({
      _id: id,
      societyId: req.societyId,
    });

    if (!membership) {
      return sendError(res, "Membership request not found for this society.", 404);
    }

    if (membership.status !== "Pending") {
      return sendError(res, `This request is already ${membership.status.toLowerCase()}.`, 400);
    }

    membership.status = "Active";
    membership.reviewedBy = req.user._id;
    membership.reviewedAt = new Date();
    await membership.save();

    // If resident membership, link to Flat
    if (membership.role === "resident" && (membership.flatId || (membership.wing && membership.flatNumber))) {
      let flat = null;
      if (membership.flatId) {
        flat = await Flat.findById(membership.flatId);
      }
      if (!flat && membership.wing && membership.flatNumber) {
        flat = await Flat.findOne({
          societyId: req.societyId,
          wing: membership.wing,
          flatNumber: membership.flatNumber,
        });
      }

      if (flat) {
        if (!flat.residentIds.some((uid) => uid.toString() === membership.userId.toString())) {
          flat.residentIds.push(membership.userId);
        }
        if (membership.residentType === "Owner" && !flat.ownerId) {
          flat.ownerId = membership.userId;
        }
        flat.occupancyStatus = "Occupied";
        flat.totalResidents = flat.residentIds.length;
        await flat.save();

        // Ensure user document has current flat info
        await User.findByIdAndUpdate(membership.userId, {
          flatId: flat._id,
          wing: flat.wing,
          flatNumber: flat.flatNumber,
        });
      }
    }

    // If security guard membership, activate linked Staff record
    if (membership.role === "security") {
      await Staff.findOneAndUpdate(
        { societyId: req.societyId, userId: membership.userId },
        { status: "On Duty" }
      );
    }

    // 1. Persist DB Notification first
    const notif = await Notification.create({
      societyId: req.societyId,
      recipientId: membership.userId,
      type: "membership",
      title: "Membership Request Approved",
      message: `Your membership request for ${membership.wing ? membership.wing + "-" + membership.flatNumber : "Harmony Society"} has been approved. You now have full access.`,
      relatedResource: "SocietyMembership",
      relatedId: membership._id.toString(),
    });

    // 2. Emit Socket event after DB commit
    emitToUser(membership.userId.toString(), "membership:approved", {
      membershipId: membership._id,
      notification: notif,
    });

    // 3. Audit Log
    await AuditLog.create({
      action: "MEMBERSHIP_APPROVED",
      actorId: req.user._id,
      societyId: req.societyId,
      entityType: "SocietyMembership",
      entityId: membership._id.toString(),
      targetResource: "SocietyMembership",
      targetId: membership._id.toString(),
      details: {
        userId: membership.userId.toString(),
        role: membership.role,
        residentType: membership.residentType,
      },
    });

    return sendSuccess(res, {
      id: membership._id.toString(),
      status: "Active",
      message: "Membership approved successfully.",
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectMembershipRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { reason = "Application requirements were not met." } = req.body;

    const membership = await SocietyMembership.findOne({
      _id: id,
      societyId: req.societyId,
    });

    if (!membership) {
      return sendError(res, "Membership request not found for this society.", 404);
    }

    membership.status = "Rejected";
    membership.approvalNotes = reason;
    membership.reviewedBy = req.user._id;
    membership.reviewedAt = new Date();
    await membership.save();

    // Pull from flat if previously added
    if (membership.flatId) {
      const flat = await Flat.findById(membership.flatId);
      if (flat) {
        flat.residentIds = flat.residentIds.filter(
          (uid) => uid.toString() !== membership.userId.toString()
        );
        flat.totalResidents = flat.residentIds.length;
        if (flat.residentIds.length === 0) {
          flat.occupancyStatus = "Vacant";
        }
        await flat.save();
      }
    }

    // Persist DB Notification
    const notif = await Notification.create({
      societyId: req.societyId,
      recipientId: membership.userId,
      type: "membership",
      title: "Membership Request Not Approved",
      message: `Your application could not be approved at this time. Reason: ${reason}`,
      relatedResource: "SocietyMembership",
      relatedId: membership._id.toString(),
    });

    // Socket event
    emitToUser(membership.userId.toString(), "membership:rejected", {
      membershipId: membership._id,
      reason,
      notification: notif,
    });

    // Audit Log
    await AuditLog.create({
      action: "MEMBERSHIP_REJECTED",
      actorId: req.user._id,
      societyId: req.societyId,
      entityType: "SocietyMembership",
      entityId: membership._id.toString(),
      targetResource: "SocietyMembership",
      targetId: membership._id.toString(),
      details: {
        userId: membership.userId.toString(),
        reason,
      },
    });

    return sendSuccess(res, {
      id: membership._id.toString(),
      status: "Rejected",
      message: "Membership request rejected.",
    });
  } catch (error) {
    next(error);
  }
}

export async function createInvitation(req, res, next) {
  try {
    const {
      role = "resident",
      residentType = "Tenant",
      wing,
      flatNumber,
      recipientEmail,
      recipientPhone,
      expiresDays = 7,
      usageLimit = 1,
    } = req.body;

    if (!["resident", "secretary", "security"].includes(role)) {
      return sendError(res, "Invalid role for invitation.", 400);
    }

    let flatId = null;
    if (role === "resident" && wing && flatNumber) {
      const flat = await Flat.findOne({
        societyId: req.societyId,
        wing: wing.trim(),
        flatNumber: flatNumber.trim(),
      });
      if (flat) {
        flatId = flat._id;
      }
    }

    // Cryptographically strong random token (256 bits entropy)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      societyId: req.societyId,
      invitedBy: req.user._id,
      role,
      residentType: role === "resident" ? residentType : undefined,
      flatId,
      wing: wing ? wing.trim() : undefined,
      flatNumber: flatNumber ? flatNumber.trim() : undefined,
      recipientEmail: recipientEmail ? recipientEmail.toLowerCase().trim() : undefined,
      recipientPhone: recipientPhone ? recipientPhone.trim() : undefined,
      tokenHash,
      usageLimit: Number(usageLimit) || 1,
      usedCount: 0,
      expiresAt,
      isRevoked: false,
    });

    await AuditLog.create({
      action: "INVITATION_CREATED",
      actorId: req.user._id,
      societyId: req.societyId,
      entityType: "Invitation",
      entityId: invitation._id.toString(),
      targetResource: "Invitation",
      targetId: invitation._id.toString(),
      details: {
        role,
        expiresAt,
        recipientEmail: invitation.recipientEmail,
      },
    });

    // Return the raw token ONLY ONCE in response payload
    return sendSuccess(
      res,
      {
        invitationId: invitation._id.toString(),
        invitationToken: rawToken,
        role: invitation.role,
        residentType: invitation.residentType,
        wing: invitation.wing,
        flatNumber: invitation.flatNumber,
        recipientEmail: invitation.recipientEmail,
        expiresAt: invitation.expiresAt,
        usageLimit: invitation.usageLimit,
      },
      "Single-use invitation token generated successfully. Please share this secure code with the recipient.",
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function getInvitations(req, res, next) {
  try {
    const invitations = await Invitation.find({
      societyId: req.societyId,
    })
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Strictly exclude tokenHash from returned payload
    const sanitized = invitations.map((inv) => ({
      id: inv._id.toString(),
      _id: inv._id.toString(),
      role: inv.role,
      residentType: inv.residentType,
      wing: inv.wing,
      flatNumber: inv.flatNumber,
      recipientEmail: inv.recipientEmail,
      recipientPhone: inv.recipientPhone,
      usageLimit: inv.usageLimit,
      usedCount: inv.usedCount,
      expiresAt: inv.expiresAt,
      isRevoked: inv.isRevoked,
      isExpired: new Date() > new Date(inv.expiresAt),
      invitedBy: inv.invitedBy?.name || "Admin",
      createdAt: inv.createdAt,
    }));

    return sendSuccess(res, sanitized);
  } catch (error) {
    next(error);
  }
}

export async function revokeInvitation(req, res, next) {
  try {
    const { id } = req.params;

    const invitation = await Invitation.findOneAndUpdate(
      { _id: id, societyId: req.societyId },
      { isRevoked: true },
      { new: true }
    );

    if (!invitation) {
      return sendError(res, "Invitation not found.", 404);
    }

    await AuditLog.create({
      action: "INVITATION_REVOKED",
      actorId: req.user._id,
      societyId: req.societyId,
      entityType: "Invitation",
      entityId: invitation._id.toString(),
      targetResource: "Invitation",
      targetId: invitation._id.toString(),
    });

    return sendSuccess(res, null, "Invitation token successfully revoked.");
  } catch (error) {
    next(error);
  }
}
