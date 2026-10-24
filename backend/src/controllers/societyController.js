import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  Society,
  Flat,
  Complaint,
  MaintenanceBill,
  Visitor,
  User,
  SocietyMembership,
  AuditLog,
  RefreshToken,
} from "../models/index.js";
import { generateAccessToken, generateRefreshTokenPayload } from "../utils/token.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function getSocieties(req, res, next) {
  try {
    const { search, city, type, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: "Inactive" };
    }

    if (city && city !== "All") {
      filter.city = new RegExp(`^${city}$`, "i");
    }

    if (type && type !== "All") {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { address: new RegExp(search, "i") },
        { city: new RegExp(search, "i") },
      ];
    }

    const societies = await Society.find(filter)
      .sort({ name: 1 })
      .lean();

    // Map `id` alias for seamless frontend compatibility
    const formatted = societies.map((s) => ({
      ...s,
      id: s._id.toString(),
      societyId: s.registrationNumber || s._id.toString(),
    }));

    return sendSuccess(res, formatted);
  } catch (error) {
    next(error);
  }
}

export async function getSocietyById(req, res, next) {
  try {
    const { id } = req.params;
    let society;

    if (mongoose.Types.ObjectId.isValid(id)) {
      society = await Society.findById(id).lean();
    }

    if (!society) {
      society = await Society.findOne({
        $or: [{ registrationNumber: id }, { slug: id.toLowerCase() }],
      }).lean();
    }

    if (!society) {
      return sendError(res, "Society not found", 404);
    }

    return sendSuccess(res, {
      ...society,
      id: society._id.toString(),
      societyId: society.registrationNumber || society._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function createSociety(req, res, next) {
  try {
    const {
      name,
      registrationNumber,
      type,
      address,
      city,
      state,
      pinCode,
      secretaryName,
      secretaryMobile,
      secretaryEmail,
      officeTiming,
      emergencyContact,
      coverImage,
      logo,
      wings,
      amenities,
      description,
    } = req.body;

    const existing = await Society.findOne({
      $or: [
        { registrationNumber: registrationNumber.trim() },
        { name: new RegExp(`^${name.trim()}$`, "i") },
      ],
    });

    if (existing) {
      return sendError(res, "Society with this name or registration number already exists.", 409);
    }

    // Calculate total flats & parse wings
    const rawWings = Array.isArray(wings) && wings.length > 0 ? wings : [
      { id: "wing_A", name: "A", totalFlats: Number(req.body.totalFlats) || 20 }
    ];

    let totalFlats = 0;
    const flatsToCreate = [];
    const parsedWings = [];

    rawWings.forEach((w, idx) => {
      const wingName = (w.name || w.wing || String.fromCharCode(65 + idx)).trim().toUpperCase();
      const wingTotalFlats = Number(w.totalFlats) || Number(req.body.totalFlats) || 20;
      totalFlats += wingTotalFlats;

      parsedWings.push({
        id: w.id || `wing_${wingName}_${idx}`,
        name: wingName,
        totalFlats: wingTotalFlats,
      });

      // Generate flat units
      for (let i = 1; i <= Math.min(wingTotalFlats, 100); i++) {
        const floor = Math.floor((i - 1) / 4) + 1;
        const unitOnFloor = ((i - 1) % 4) + 1;
        const flatNumber = `${wingName}-${floor}${unitOnFloor < 10 ? "0" + unitOnFloor : unitOnFloor}`;
        flatsToCreate.push({
          wing: wingName,
          flatNumber,
          floor,
          occupancyStatus: "Vacant",
          residentIds: [],
          totalResidents: 0,
        });
      }
    });

    const society = await Society.create({
      name: name.trim(),
      registrationNumber: registrationNumber.trim(),
      type: type || "Apartment",
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      secretaryName: secretaryName.trim(),
      secretaryMobile: secretaryMobile.trim(),
      secretaryEmail: secretaryEmail.toLowerCase().trim(),
      officeTiming: officeTiming || "9:00 AM - 6:00 PM",
      emergencyContact: emergencyContact || "1800-000-0000",
      coverImage:
        coverImage ||
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600",
      logo:
        logo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=14B8A6&color=fff&rounded=true`,
      wings: parsedWings,
      totalFlats,
      totalResidents: 0,
      occupiedFlats: 0,
      vacantFlats: totalFlats,
      amenities: Array.isArray(amenities) ? amenities : [],
      description: description || "",
      status: "Active",
    });

    // Bulk create flats for this society in MongoDB
    if (flatsToCreate.length > 0) {
      const enrichedFlats = flatsToCreate.map((f) => ({
        ...f,
        societyId: society._id,
      }));
      await Flat.insertMany(enrichedFlats).catch((e) => console.warn("Flat seed warning:", e.message));
    }

    // Auto-create / link secretary user account in MongoDB
    let secretaryUser = await User.findOne({ email: secretaryEmail.toLowerCase().trim() });
    if (!secretaryUser) {
      const salt = await bcrypt.genSalt(10);
      const chosenPassword = req.body.secretaryPassword || req.body.creatorPassword || "password123";
      const passwordHash = await bcrypt.hash(chosenPassword, salt);
      secretaryUser = await User.create({
        name: secretaryName.trim(),
        email: secretaryEmail.toLowerCase().trim(),
        phone: secretaryMobile ? secretaryMobile.trim() : "",
        passwordHash,
        role: "secretary",
        status: "Active",
        societyId: society._id,
      }).catch((e) => console.warn("User create warning:", e.message));
    }

    if (secretaryUser) {
      await SocietyMembership.findOneAndUpdate(
        { userId: secretaryUser._id, societyId: society._id },
        {
          role: "secretary",
          status: "Active",
          isDefault: true,
          reviewedAt: new Date(),
        },
        { upsert: true, new: true }
      ).catch((e) => console.warn("Membership warning:", e.message));
    }

    return sendSuccess(
      res,
      {
        ...society.toObject(),
        id: society._id.toString(),
        societyId: society.registrationNumber || society._id.toString(),
      },
      "Society registered successfully and stored in database",
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function updateSociety(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates._id;
    delete updates.id;

    const society = await Society.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!society) {
      return sendError(res, "Society not found", 404);
    }

    return sendSuccess(res, {
      ...society,
      id: society._id.toString(),
    }, "Society updated successfully");
  } catch (error) {
    next(error);
  }
}

export async function getSocietyStats(req, res, next) {
  try {
    const { id } = req.params;
    const societyId = mongoose.Types.ObjectId.isValid(id)
      ? id
      : (await Society.findOne({ registrationNumber: id }))?._id;

    if (!societyId) {
      return sendError(res, "Society not found", 404);
    }

    const [
      society,
      totalFlatsCount,
      occupiedFlatsCount,
      openComplaintsCount,
      resolvedComplaintsCount,
      todayVisitorsCount,
      pendingVisitorsCount,
      unpaidBillsAgg,
    ] = await Promise.all([
      Society.findById(societyId).lean(),
      Flat.countDocuments({ societyId }),
      Flat.countDocuments({ societyId, occupancyStatus: "Occupied" }),
      Complaint.countDocuments({ societyId, status: { $in: ["Pending", "In Progress"] } }),
      Complaint.countDocuments({ societyId, status: "Resolved" }),
      Visitor.countDocuments({
        societyId,
        entryTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Visitor.countDocuments({ societyId, approvalStatus: "Pending" }),
      MaintenanceBill.aggregate([
        { $match: { societyId: new mongoose.Types.ObjectId(societyId), status: { $in: ["Unpaid", "Partially Paid", "Overdue"] } } },
        { $group: { _id: null, totalOutstanding: { $sum: "$outstandingBalance" } } },
      ]),
    ]);

    const totalOutstanding = unpaidBillsAgg[0]?.totalOutstanding || 0;

    return sendSuccess(res, {
      societyName: society?.name,
      totalFlats: totalFlatsCount || society?.totalFlats || 0,
      occupiedFlats: occupiedFlatsCount,
      vacantFlats: Math.max(0, (totalFlatsCount || society?.totalFlats || 0) - occupiedFlatsCount),
      openComplaints: openComplaintsCount,
      resolvedComplaints: resolvedComplaintsCount,
      todayVisitors: todayVisitorsCount,
      pendingVisitors: pendingVisitorsCount,
      totalOutstandingMaintenance: totalOutstanding,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSocietyFlatsPublic(req, res, next) {
  try {
    const { societyId } = req.params;

    let targetSociety = null;
    if (mongoose.Types.ObjectId.isValid(societyId)) {
      targetSociety = await Society.findById(societyId).select("_id name");
    }
    if (!targetSociety) {
      targetSociety = await Society.findOne({
        $or: [{ registrationNumber: societyId }, { slug: societyId }],
      }).select("_id name");
    }

    if (!targetSociety) {
      return sendError(res, "Society not found", 404);
    }

    // PRIVACY-SAFE PROJECTION:
    // Only return _id, wing, flatNumber, floor, occupancyStatus.
    // Explicitly exclude owner details, resident IDs, phones, emails, dues, intercom numbers.
    const flats = await Flat.find({ societyId: targetSociety._id })
      .select("_id wing flatNumber floor occupancyStatus")
      .sort({ wing: 1, floor: 1, flatNumber: 1 })
      .lean();

    return sendSuccess(res, flats);
  } catch (error) {
    next(error);
  }
}

export async function registerSociety(req, res, next) {
  let session = null;
  const compensationTracker = [];

  try {
    const {
      name,
      registrationNumber,
      type = "Apartment",
      address,
      city,
      state,
      pinCode,
      officeTiming,
      emergencyContact,
      coverImage,
      logo,
      wings = [],
      amenities = [],
      description = "",
      // Creator Secretary Credentials:
      creatorName,
      creatorEmail,
      creatorPhone,
      creatorPassword,
    } = req.body;

    if (!name || !registrationNumber || !address || !city || !state || !pinCode) {
      return sendError(
        res,
        "Society name, registration number, address, city, state, and PIN code are required.",
        400
      );
    }

    if (!creatorName || !creatorEmail || !creatorPassword) {
      return sendError(res, "Secretary account details (name, email, password) are required.", 400);
    }

    // Check duplicate registration number
    const existingSoc = await Society.findOne({
      $or: [
        { registrationNumber: registrationNumber.trim() },
        { name: new RegExp(`^${name.trim()}$`, "i") },
      ],
    });
    if (existingSoc) {
      return sendError(res, "A society with this name or registration number already exists.", 409);
    }

    // Check if replica set is supported for MongoDB multi-document transactions
    let isReplicaSet = false;
    try {
      const adminDb = mongoose.connection.db?.admin ? mongoose.connection.db.admin() : null;
      if (adminDb) {
        const hello = await adminDb.command({ hello: 1 });
        isReplicaSet = !!(hello.setName || hello.msg === "isdbgrid");
      }
    } catch (e) {
      isReplicaSet = false;
    }

    if (isReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (err) {
        session = null;
      }
    }

    const sessionOpts = session ? { session } : {};

    // 1. Calculate flats & wings configuration
    const rawWings = Array.isArray(wings) ? wings : [];
    let totalFlats = 0;
    const flatsToCreate = [];
    const parsedWings = [];

    rawWings.forEach((w, idx) => {
      const wingName = (w.name || w.wing || String.fromCharCode(65 + idx)).trim().toUpperCase();
      const floorsCount = Number(w.floors) || Number(w.totalFloors) || 4;
      const flatsPerFloor = Number(w.flatsPerFloor) || 4;
      const flatList = Array.isArray(w.flats) ? w.flats : [];
      let wingFlatsCount = 0;

      if (flatList.length > 0) {
        flatList.forEach((f) => {
          totalFlats += 1;
          wingFlatsCount += 1;
          flatsToCreate.push({
            wing: wingName,
            flatNumber: f.flatNumber || f.number || `${wingName}-${totalFlats}`,
            floor: Number(f.floor) || 1,
            occupancyStatus: "Vacant",
            residentIds: [],
            totalResidents: 0,
          });
        });
      } else {
        // Auto-generate standard flats: floor * 100 + unit (e.g. 101, 102...)
        for (let fl = 1; fl <= floorsCount; fl++) {
          for (let u = 1; u <= flatsPerFloor; u++) {
            totalFlats += 1;
            wingFlatsCount += 1;
            const flatNumStr = `${wingName}-${fl}${u < 10 ? "0" + u : u}`;
            flatsToCreate.push({
              wing: wingName,
              flatNumber: flatNumStr,
              floor: fl,
              occupancyStatus: "Vacant",
              residentIds: [],
              totalResidents: 0,
            });
          }
        }
      }

      parsedWings.push({
        id: w.id || `wing_${wingName}_${idx}`,
        name: wingName,
        totalFlats: wingFlatsCount,
      });
    });

    // 2. Create Society document
    const societyData = {
      name: name.trim(),
      registrationNumber: registrationNumber.trim(),
      type: type || "Apartment",
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim(),
      secretaryName: creatorName.trim(),
      secretaryMobile: creatorPhone ? creatorPhone.trim() : "0000000000",
      secretaryEmail: creatorEmail.toLowerCase().trim(),
      officeTiming: officeTiming || "9:00 AM - 6:00 PM",
      emergencyContact: emergencyContact || "1800-000-0000",
      coverImage:
        coverImage ||
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600",
      logo:
        logo ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=14B8A6&color=fff&rounded=true`,
      wings: parsedWings,
      totalFlats,
      totalResidents: 0,
      occupiedFlats: 0,
      vacantFlats: totalFlats,
      amenities: Array.isArray(amenities) ? amenities : [],
      description: description || "",
      status: "Active",
    };

    let society;
    if (session) {
      const created = await Society.create([societyData], sessionOpts);
      society = created[0];
    } else {
      society = await Society.create(societyData);
      compensationTracker.push({ model: Society, id: society._id });
    }

    // 3. Insert generated Flats
    if (flatsToCreate.length > 0) {
      const enrichedFlats = flatsToCreate.map((f) => ({
        ...f,
        societyId: society._id,
      }));

      if (session) {
        await Flat.insertMany(enrichedFlats, sessionOpts);
      } else {
        const createdFlats = await Flat.insertMany(enrichedFlats);
        compensationTracker.push({ model: Flat, ids: createdFlats.map((f) => f._id) });
      }
    }

    // 4. Create or find Secretary User
    const normalizedCreatorEmail = creatorEmail.toLowerCase().trim();
    let creatorUser = await User.findOne({ email: normalizedCreatorEmail }).session(session || null);

    if (creatorUser) {
      creatorUser.societyId = society._id;
      creatorUser.role = "secretary";
      await creatorUser.save(sessionOpts);
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(creatorPassword, salt);
      const newUserData = {
        name: creatorName.trim(),
        email: normalizedCreatorEmail,
        phone: creatorPhone ? creatorPhone.trim() : "",
        passwordHash,
        role: "secretary",
        status: "Active",
        societyId: society._id,
      };

      if (session) {
        const createdUsers = await User.create([newUserData], sessionOpts);
        creatorUser = createdUsers[0];
      } else {
        creatorUser = await User.create(newUserData);
        compensationTracker.push({ model: User, id: creatorUser._id });
      }
    }

    // 5. Create initial Secretary Membership
    const membershipData = {
      userId: creatorUser._id,
      societyId: society._id,
      role: "secretary",
      status: "Active",
      isDefault: true,
      reviewedAt: new Date(),
    };

    let membership;
    if (session) {
      const createdMems = await SocietyMembership.create([membershipData], sessionOpts);
      membership = createdMems[0];
    } else {
      membership = await SocietyMembership.create(membershipData);
      compensationTracker.push({ model: SocietyMembership, id: membership._id });
    }

    // 6. Audit Log
    const auditData = {
      action: "SOCIETY_ONBOARDED_WITH_SECRETARY",
      actorId: creatorUser._id,
      societyId: society._id,
      entityType: "Society",
      entityId: society._id.toString(),
      targetResource: "Society",
      targetId: society._id.toString(),
      details: {
        registrationNumber: society.registrationNumber,
        totalFlats,
        creatorEmail: creatorUser.email,
      },
    };
    if (session) {
      await AuditLog.create([auditData], sessionOpts);
    } else {
      await AuditLog.create(auditData);
    }

    // Commit transaction if active
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    // Generate tokens for immediate Secretary login
    const accessToken = generateAccessToken({
      userId: creatorUser._id,
      email: creatorUser.email,
      role: "secretary",
      societyId: society._id,
    });

    const { rawToken: refreshToken, tokenHash } = generateRefreshTokenPayload();
    await RefreshToken.create({
      userId: creatorUser._id,
      tokenHash,
      family: crypto.randomUUID(),
      isRevoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return sendSuccess(
      res,
      {
        society: {
          id: society._id.toString(),
          name: society.name,
          registrationNumber: society.registrationNumber,
          totalFlats,
          city: society.city,
        },
        user: {
          id: creatorUser._id,
          name: creatorUser.name,
          email: creatorUser.email,
          role: "secretary",
          societyId: society._id,
          societyName: society.name,
          membershipStatus: "Active",
        },
        token: accessToken,
        refreshToken,
      },
      "Society registered successfully! Welcome to your new society management portal.",
      201
    );
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (abortErr) {
        // Ignored
      }
    } else {
      // Non-replica rollback compensation
      for (const item of compensationTracker.reverse()) {
        try {
          if (item.ids) {
            await item.model.deleteMany({ _id: { $in: item.ids } });
          } else if (item.id) {
            await item.model.findByIdAndDelete(item.id);
          }
        } catch (compErr) {
          console.error("Compensation rollback error:", compErr);
        }
      }
    }

    if (error.code === 11000) {
      return sendError(res, "A society with this registration number or name already exists.", 409);
    }
    next(error);
  }
}
