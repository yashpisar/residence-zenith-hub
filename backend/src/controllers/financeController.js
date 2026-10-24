import crypto from "crypto";
import mongoose from "mongoose";
import { MaintenanceBill, Payment, Flat, Notification, SocietyMembership } from "../models/index.js";
import { emitToUser, emitToSecretaries } from "../config/socket.js";
import { sendSuccess, sendError } from "../utils/response.js";

// --- MAINTENANCE BILLS ---

export async function getMaintenance(req, res, next) {
  try {
    const targetSocietyId = req.query.societyId || req.societyId;
    const { flatId, billingPeriod, status, search, page = 1, limit = 100 } = req.query;

    const isSuperadmin = req.user.role === "superadmin";

    if (req.role === "resident") {
      // Resident can only view their own flat's bills
      if (!req.flatId) {
        return sendSuccess(res, {
          stats: {
            totalExpected: 0,
            totalCollected: 0,
            totalOutstanding: 0,
            countPaid: 0,
            countPending: 0,
            countOverdue: 0,
            totalFlats: 0,
          },
          currentDue: 0,
          totalCollected: 0,
          unpaidCount: 0,
          bills: [],
          availablePeriods: [],
          latestBill: null,
        });
      }
    }

    const now = new Date();

    // 1. Automatically update any past-due unpaid/partially-paid bills to "Overdue"
    await MaintenanceBill.updateMany(
      {
        societyId: targetSocietyId,
        outstandingBalance: { $gt: 0 },
        dueDate: { $lt: now },
        status: { $in: ["Unpaid", "Partially Paid"] },
      },
      { $set: { status: "Overdue" } }
    );

    // Also ensure zero balance bills are marked "Paid"
    await MaintenanceBill.updateMany(
      {
        societyId: targetSocietyId,
        outstandingBalance: { $lte: 0 },
        status: { $ne: "Paid" },
      },
      { $set: { status: "Paid" } }
    );

    // 2. Query available distinct billing periods in this society
    const availablePeriods = await MaintenanceBill.distinct("billingPeriod", {
      societyId: targetSocietyId,
    });
    availablePeriods.sort().reverse();

    // 3. Compute Summary Statistics for the Secretary dashboard
    // If a specific billingPeriod is selected, compute stats for that period; otherwise compute overall
    const statsPeriodFilter = { societyId: targetSocietyId };
    if (billingPeriod && billingPeriod !== "All") {
      statsPeriodFilter.billingPeriod = billingPeriod;
    }
    const allStatsBills = await MaintenanceBill.find(statsPeriodFilter).lean();

    const totalExpected = allStatsBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalCollected = allStatsBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
    const totalOutstanding = allStatsBills.reduce((acc, b) => acc + (b.outstandingBalance || 0), 0);

    const countPaid = allStatsBills.filter(
      (b) => b.status === "Paid" || (b.outstandingBalance || 0) <= 0
    ).length;
    const countPending = allStatsBills.filter(
      (b) =>
        (b.status === "Unpaid" || b.status === "Partially Paid") &&
        new Date(b.dueDate) >= now &&
        (b.outstandingBalance || 0) > 0
    ).length;
    const countOverdue = allStatsBills.filter(
      (b) =>
        b.status === "Overdue" ||
        ((b.outstandingBalance || 0) > 0 && new Date(b.dueDate) < now)
    ).length;

    const stats = {
      totalExpected,
      totalCollected,
      totalOutstanding,
      countPaid,
      countPending,
      countOverdue,
      totalFlats: allStatsBills.length,
    };

    // 4. Build filter for matching bills to return in the table
    const filter = { societyId: targetSocietyId };
    if (req.role === "resident") {
      filter.flatId = req.flatId;
    } else if (flatId) {
      filter.flatId = flatId;
    }

    if (billingPeriod && billingPeriod !== "All") {
      filter.billingPeriod = billingPeriod;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    // 5. Query bills with populated flat and resident
    const bills = await MaintenanceBill.find(filter)
      .sort({ billingPeriod: -1, wing: 1, flatNumber: 1, dueDate: -1 })
      .populate("flatId", "wing flatNumber floor occupancyStatus ownerName ownerPhone ownerEmail maintenanceAmount")
      .populate("residentId", "name email phone avatarUrl")
      .lean();

    // 6. Map & enhance each bill with calculated dynamic status and display fields
    let formattedBills = bills.map((b) => {
      const isPastDue = new Date(b.dueDate) < now;
      let calculatedStatus = b.status;
      if (b.outstandingBalance <= 0) {
        calculatedStatus = "Paid";
      } else if (b.paidAmount > 0 && !isPastDue) {
        calculatedStatus = "Partially Paid";
      } else if (isPastDue) {
        calculatedStatus = "Overdue";
      } else {
        calculatedStatus = "Unpaid";
      }

      const wing = (b.wing || b.flatId?.wing || "").trim();
      const rawFlat = (b.flatNumber || b.flatId?.flatNumber || "").trim();
      let cleanFlat = rawFlat;
      if (wing && rawFlat.toUpperCase().startsWith(wing.toUpperCase() + "-")) {
        cleanFlat = rawFlat.substring(wing.length + 1).trim();
      } else if (wing && rawFlat.toUpperCase().startsWith(wing.toUpperCase()) && rawFlat.length > wing.length && !isNaN(rawFlat[wing.length])) {
        cleanFlat = rawFlat.substring(wing.length).trim();
      }
      const flatDisplay = wing && cleanFlat ? `${wing}-${cleanFlat}` : rawFlat || "Flat";
      const owner = b.ownerName || b.flatId?.ownerName || b.residentId?.name || "Resident";
      const phone = b.contactPhone || b.flatId?.ownerPhone || b.residentId?.phone || "";
      const email = b.flatId?.ownerEmail || b.residentId?.email || "";

      return {
        ...b,
        id: b._id.toString(),
        flat: flatDisplay,
        wing,
        flatNumber: cleanFlat || rawFlat,
        owner,
        residentName: owner,
        contactPhone: phone,
        residentEmail: email,
        calculatedStatus,
        status: calculatedStatus,
        remainingBalance: b.outstandingBalance,
      };
    });

    // 7. Search filter in memory if search query provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      formattedBills = formattedBills.filter((b) => {
        return (
          b.flat.toLowerCase().includes(q) ||
          b.wing.toLowerCase().includes(q) ||
          b.flatNumber.toLowerCase().includes(q) ||
          b.owner.toLowerCase().includes(q) ||
          b.contactPhone.toLowerCase().includes(q) ||
          b.billingPeriod.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q)
        );
      });
    }

    return sendSuccess(res, {
      stats,
      currentDue: totalOutstanding,
      totalCollected,
      unpaidCount: countPending + countOverdue,
      bills: formattedBills,
      availablePeriods,
      latestBill: formattedBills[0] || null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceById(req, res, next) {
  try {
    const { id } = req.params;

    const bill = await MaintenanceBill.findById(id)
      .populate("flatId", "wing flatNumber floor occupancyStatus ownerName ownerPhone ownerEmail maintenanceAmount")
      .populate("residentId", "name email phone avatarUrl")
      .populate("societyId", "name registrationNumber city address")
      .populate("createdBy", "name role")
      .lean();

    if (!bill) {
      return sendError(res, "Maintenance bill not found.", 404);
    }

    // Payments for this bill
    const payments = await Payment.find({ billId: bill._id })
      .sort({ createdAt: -1 })
      .populate("recordedBy", "name role")
      .populate("payerId", "name email phone")
      .lean();

    // Previous months' bills for this flat
    const flatId = bill.flatId?._id || bill.flatId;
    const historyBills = await MaintenanceBill.find({
      flatId,
      _id: { $ne: bill._id },
    })
      .sort({ billingPeriod: -1 })
      .limit(12)
      .lean();

    const formattedPayments = payments.map((p) => ({
      ...p,
      id: p._id.toString(),
      paymentDate: p.verifiedAt || p.paymentDate || p.createdAt,
    }));

    const formattedHistory = historyBills.map((h) => ({
      ...h,
      id: h._id.toString(),
    }));

    const wing = (bill.wing || bill.flatId?.wing || "").trim();
    const rawFlat = (bill.flatNumber || bill.flatId?.flatNumber || "").trim();
    let cleanFlat = rawFlat;
    if (wing && rawFlat.toUpperCase().startsWith(wing.toUpperCase() + "-")) {
      cleanFlat = rawFlat.substring(wing.length + 1).trim();
    } else if (wing && rawFlat.toUpperCase().startsWith(wing.toUpperCase()) && rawFlat.length > wing.length && !isNaN(rawFlat[wing.length])) {
      cleanFlat = rawFlat.substring(wing.length).trim();
    }
    const flatDisplay = wing && cleanFlat ? `${wing}-${cleanFlat}` : rawFlat || "Flat";

    return sendSuccess(res, {
      ...bill,
      id: bill._id.toString(),
      flat: flatDisplay,
      owner: bill.ownerName || bill.flatId?.ownerName || bill.residentId?.name || "Resident",
      contactPhone: bill.contactPhone || bill.flatId?.ownerPhone || bill.residentId?.phone || "",
      payments: formattedPayments,
      previousBills: formattedHistory,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFlatMaintenanceHistory(req, res, next) {
  try {
    const { flatId } = req.params;
    const targetSocietyId = req.query.societyId || req.societyId;

    const bills = await MaintenanceBill.find({
      societyId: targetSocietyId,
      flatId,
    })
      .sort({ billingPeriod: -1 })
      .lean();

    const payments = await Payment.find({
      societyId: targetSocietyId,
      flatId,
      status: "Successful",
    })
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, {
      bills: bills.map((b) => ({ ...b, id: b._id.toString() })),
      payments: payments.map((p) => ({ ...p, id: p._id.toString() })),
    });
  } catch (error) {
    next(error);
  }
}

export async function recordMaintenancePayment(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = "Cash", transactionId, paymentDate, notes } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return sendError(res, "Payment amount must be greater than zero.", 400);
    }

    const bill = await MaintenanceBill.findById(id);
    if (!bill) {
      return sendError(res, "Maintenance bill not found.", 404);
    }

    // Verify Secretary authorization for this bill's society
    const isSuperadmin = req.user.role === "superadmin";
    const isSecretary =
      req.societyId?.toString() === bill.societyId.toString() ||
      (await SocietyMembership.exists({
        userId: req.user._id,
        societyId: bill.societyId,
        role: "secretary",
        status: "Active",
      }));

    if (!isSuperadmin && !isSecretary) {
      return sendError(res, "You do not have permission to record payments for this society.", 403);
    }

    if (bill.outstandingBalance <= 0) {
      return sendError(res, "This maintenance bill is already fully paid.", 400);
    }

    if (numAmount > bill.outstandingBalance) {
      return sendError(
        res,
        `Payment amount (₹${numAmount}) cannot exceed the remaining balance of ₹${bill.outstandingBalance}.`,
        400
      );
    }

    // Generate unique receipt number
    const yearMonth = bill.billingPeriod.replace("-", "");
    const receiptNumber = `RCP-${yearMonth}-${Date.now().toString().slice(-4)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const txnId = (transactionId || "").trim() || receiptNumber;
    const verifiedDate = paymentDate ? new Date(paymentDate) : new Date();

    // Create Payment record
    const payment = await Payment.create({
      societyId: bill.societyId,
      flatId: bill.flatId,
      billId: bill._id,
      payerId: bill.residentId || req.user._id,
      amount: numAmount,
      paymentMethod,
      provider: "Demo",
      providerTransactionId: txnId,
      receiptNumber,
      status: "Successful",
      recordedBy: req.user._id,
      verifiedAt: verifiedDate,
      paymentDate: verifiedDate,
      notes: notes || `Payment of ₹${numAmount} recorded by ${req.user.name} via ${paymentMethod}`,
    });

    // Update bill
    bill.paidAmount = (bill.paidAmount || 0) + numAmount;
    bill.outstandingBalance = Math.max(0, bill.totalAmount - bill.paidAmount);
    bill.lastPaymentDate = verifiedDate;
    bill.lastPaymentMethod = paymentMethod;

    const now = new Date();
    if (bill.outstandingBalance <= 0) {
      bill.status = "Paid";
    } else if (new Date(bill.dueDate) < now) {
      bill.status = "Overdue";
    } else {
      bill.status = "Partially Paid";
    }

    await bill.save();

    // Notify resident if present
    if (bill.residentId) {
      await Notification.create({
        societyId: bill.societyId,
        recipientId: bill.residentId,
        type: "payment",
        title: `Payment Recorded: ₹${numAmount} (${paymentMethod})`,
        message: `A payment of ₹${numAmount} has been recorded for Flat ${bill.wing}-${bill.flatNumber} (${bill.billingPeriod}). Receipt: ${receiptNumber}. Remaining balance: ₹${bill.outstandingBalance}.`,
        relatedResource: "payment",
        relatedId: payment._id.toString(),
      });
      emitToUser(bill.residentId.toString(), "payment:confirmed", {
        receiptNumber,
        amount: numAmount,
        billStatus: bill.status,
        outstandingBalance: bill.outstandingBalance,
      });
    }

    emitToSecretaries(bill.societyId, "payment:confirmed", {
      receiptNumber,
      amount: numAmount,
      flat: `${bill.wing}-${bill.flatNumber}`,
    });

    const populated = await MaintenanceBill.findById(bill._id)
      .populate("flatId", "wing flatNumber floor occupancyStatus ownerName ownerPhone ownerEmail")
      .populate("residentId", "name email phone")
      .lean();

    return sendSuccess(
      res,
      {
        bill: {
          ...populated,
          id: populated._id.toString(),
          flat: `${populated.wing || populated.flatId?.wing || ""}-${populated.flatNumber || populated.flatId?.flatNumber || ""}`,
          owner: populated.ownerName || populated.flatId?.ownerName || populated.residentId?.name || "Resident",
        },
        payment: { ...payment.toObject(), id: payment._id.toString() },
        receiptNumber,
      },
      `Payment of ₹${numAmount} recorded successfully. Receipt #${receiptNumber} generated.`
    );
  } catch (error) {
    next(error);
  }
}

export async function generateBatchBills(req, res, next) {
  try {
    const { billingPeriod, dueDate, baseAmount, breakdown, targetFlats = "all" } = req.body;
    const targetSocietyId = req.body.societyId || req.query.societyId || req.societyId;

    if (!billingPeriod || !dueDate || !baseAmount) {
      return sendError(res, "Billing period (YYYY-MM), due date, and base amount are required.", 400);
    }

    const flatFilter = { societyId: targetSocietyId };
    if (targetFlats === "occupied") {
      flatFilter.occupancyStatus = "Occupied";
    }

    const flats = await Flat.find(flatFilter).lean();

    if (flats.length === 0) {
      return sendError(res, "No flats found in this society to generate bills for.", 400);
    }

    const parsedBreakdown = Array.isArray(breakdown) && breakdown.length > 0
      ? breakdown
      : [{ label: "Base Maintenance", amount: Number(baseAmount) }];

    const defaultTotal = parsedBreakdown.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

    const createdBills = [];
    let skippedCount = 0;

    for (const flat of flats) {
      try {
        // Prevent duplicate billing for the same flat & period
        const existing = await MaintenanceBill.findOne({
          societyId: targetSocietyId,
          flatId: flat._id,
          billingPeriod,
        });
        if (existing) {
          skippedCount++;
          continue;
        }

        // Flat-specific pricing: check if flat has custom maintenanceAmount
        const flatBase = flat.maintenanceAmount && flat.maintenanceAmount > 0
          ? Number(flat.maintenanceAmount)
          : Number(baseAmount);

        let flatBreakdown = parsedBreakdown;
        let flatTotal = defaultTotal;
        if (flat.maintenanceAmount && flat.maintenanceAmount > 0) {
          flatBreakdown = [{ label: "Flat Maintenance Rate", amount: flatBase }];
          flatTotal = flatBase;
        }

        const bill = await MaintenanceBill.create({
          societyId: targetSocietyId,
          flatId: flat._id,
          residentId: flat.ownerId || flat.residentIds?.[0],
          wing: flat.wing,
          flatNumber: flat.flatNumber,
          ownerName: flat.ownerName || "",
          contactPhone: flat.ownerPhone || "",
          billingPeriod,
          dueDate: new Date(dueDate),
          baseAmount: flatBase,
          breakdown: flatBreakdown,
          totalAmount: flatTotal,
          paidAmount: 0,
          outstandingBalance: flatTotal,
          status: "Unpaid",
          createdBy: req.user._id,
        });
        createdBills.push(bill);

        // Notify resident if present
        if (flat.ownerId || flat.residentIds?.[0]) {
          const recipientId = (flat.ownerId || flat.residentIds?.[0]).toString();
          await Notification.create({
            societyId: targetSocietyId,
            recipientId,
            type: "maintenance",
            title: `Maintenance Bill Generated (${billingPeriod})`,
            message: `New bill of ₹${flatTotal} generated for Flat ${flat.wing}-${flat.flatNumber}. Due by ${new Date(dueDate).toLocaleDateString()}.`,
            relatedResource: "maintenance",
            relatedId: bill._id.toString(),
          });
          emitToUser(recipientId, "maintenance:bill_created", { bill });
        }
      } catch (err) {
        // If compound unique index conflicts, bill already exists for this flat/period
        if (err.code === 11000) {
          skippedCount++;
        } else {
          throw err;
        }
      }
    }

    return sendSuccess(res, {
      generatedCount: createdBills.length,
      skippedCount,
      totalFlats: flats.length,
      billingPeriod,
      totalAmountPerFlat: defaultTotal,
    }, `Generated bills for ${createdBills.length} flats (${skippedCount} already existed).`);
  } catch (error) {
    next(error);
  }
}

// --- PAYMENTS ---

export async function getPayments(req, res, next) {
  try {
    const { status, month, page = 1, limit = 50 } = req.query;
    const filter = { societyId: req.societyId };

    if (req.role === "resident") {
      filter.payerId = req.user._id;
    }

    if (status && status !== "All") filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("billId", "billingPeriod dueDate totalAmount")
        .populate("flatId", "wing flatNumber ownerName")
        .populate("payerId", "name email phone")
        .lean(),
      Payment.countDocuments(filter),
    ]);

    const totalPaid = payments
      .filter((p) => p.status === "Successful")
      .reduce((acc, p) => acc + p.amount, 0);

    const formatted = payments.map((p) => ({
      ...p,
      id: p._id.toString(),
      month: p.billId?.billingPeriod || new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      flat: p.flatId ? `${p.flatId.wing}-${p.flatId.flatNumber}` : "—",
      payerName: p.payerId?.name || "Resident",
    }));

    return sendSuccess(res, {
      totalPaid,
      payments: formatted,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
}

export async function createPaymentOrder(req, res, next) {
  try {
    const { billId, paymentMethod = "Demo", idempotencyKey } = req.body;

    if (!billId) {
      return sendError(res, "Maintenance billId is required.", 400);
    }

    const bill = await MaintenanceBill.findOne({
      _id: billId,
      societyId: req.societyId,
    });

    if (!bill) {
      return sendError(res, "Maintenance bill not found.", 404);
    }

    if (bill.status === "Paid" || bill.outstandingBalance <= 0) {
      return sendError(res, "This bill has already been fully paid.", 400);
    }

    // Server-side amount validation: Always charge exact outstanding balance
    const amountToPay = bill.outstandingBalance;

    const orderId = `order_${process.env.PAYMENT_MODE || "demo"}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const actualIdempotencyKey = idempotencyKey || `idem_${billId}_${Date.now()}`;

    // Create pending payment record
    const payment = await Payment.create({
      societyId: req.societyId,
      flatId: bill.flatId,
      billId: bill._id,
      payerId: req.user._id,
      amount: amountToPay,
      paymentMethod,
      provider: process.env.PAYMENT_MODE === "razorpay" ? "Razorpay" : "Demo",
      providerOrderId: orderId,
      status: "Pending",
      idempotencyKey: actualIdempotencyKey,
    });

    return sendSuccess(res, {
      paymentId: payment._id.toString(),
      orderId,
      amount: amountToPay,
      currency: "INR",
      billPeriod: bill.billingPeriod,
      mode: process.env.PAYMENT_MODE || "demo",
      flatNumber: bill.flatNumber,
    }, "Payment order created");
  } catch (error) {
    next(error);
  }
}

export async function verifyPayment(req, res, next) {
  try {
    const { paymentId, providerOrderId, providerTransactionId, signature } = req.body;

    const payment = await Payment.findOne({
      _id: paymentId,
      societyId: req.societyId,
      status: "Pending",
    });

    if (!payment) {
      return sendError(res, "Payment record not found or already verified/processed.", 400);
    }

    const bill = await MaintenanceBill.findById(payment.billId);
    if (!bill) {
      return sendError(res, "Associated maintenance bill not found.", 404);
    }

    const txnId = providerTransactionId || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const yearMonth = bill.billingPeriod.replace("-", "");
    const receiptNumber = `RCP-${yearMonth}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Atomic update of the payment record
    payment.status = "Successful";
    payment.providerTransactionId = txnId;
    payment.receiptNumber = receiptNumber;
    payment.verifiedAt = new Date();
    await payment.save();

    // Atomic update of the bill
    bill.paidAmount = (bill.paidAmount || 0) + payment.amount;
    bill.outstandingBalance = Math.max(0, bill.totalAmount - bill.paidAmount);
    if (bill.outstandingBalance <= 0) {
      bill.status = "Paid";
    } else {
      bill.status = "Partially Paid";
    }
    await bill.save();

    // Notify Resident and Secretary
    await Notification.create({
      societyId: req.societyId,
      recipientId: payment.payerId,
      type: "payment",
      title: `Payment Received: ₹${payment.amount}`,
      message: `Payment successful for ${bill.billingPeriod}. Receipt: ${receiptNumber}.`,
      relatedResource: "payment",
      relatedId: payment._id.toString(),
    });

    emitToUser(payment.payerId.toString(), "payment:confirmed", {
      paymentId: payment._id.toString(),
      receiptNumber,
      amount: payment.amount,
      billStatus: bill.status,
    });

    emitToSecretaries(req.societyId, "payment:confirmed", {
      receiptNumber,
      amount: payment.amount,
      flat: `${bill.wing}-${bill.flatNumber}`,
    });

    return sendSuccess(res, {
      paymentId: payment._id.toString(),
      receiptNumber,
      amount: payment.amount,
      status: "Successful",
      billStatus: bill.status,
      verifiedAt: payment.verifiedAt,
    }, "Payment verified successfully. Receipt generated.");
  } catch (error) {
    next(error);
  }
}

export async function recordCashPayment(req, res, next) {
  try {
    const { billId, amount, notes } = req.body;

    const bill = await MaintenanceBill.findOne({ _id: billId, societyId: req.societyId });
    if (!bill) {
      return sendError(res, "Bill not found", 404);
    }

    const paidAmount = Number(amount) || bill.outstandingBalance;
    const yearMonth = bill.billingPeriod.replace("-", "");
    const receiptNumber = `RCP-CASH-${yearMonth}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payment = await Payment.create({
      societyId: req.societyId,
      flatId: bill.flatId,
      billId: bill._id,
      payerId: bill.residentId || req.user._id,
      amount: paidAmount,
      paymentMethod: "Cash",
      provider: "Demo",
      receiptNumber,
      status: "Successful",
      recordedBy: req.user._id,
      verifiedAt: new Date(),
      notes: notes || `Cash collected by ${req.user.name}`,
    });

    bill.paidAmount = (bill.paidAmount || 0) + paidAmount;
    bill.outstandingBalance = Math.max(0, bill.totalAmount - bill.paidAmount);
    bill.status = bill.outstandingBalance <= 0 ? "Paid" : "Partially Paid";
    await bill.save();

    return sendSuccess(res, {
      payment: { ...payment.toObject(), id: payment._id.toString() },
      billStatus: bill.status,
    }, "Cash payment recorded successfully");
  } catch (error) {
    next(error);
  }
}

export async function getPaymentReceipt(req, res, next) {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({ _id: id, societyId: req.societyId })
      .populate("billId")
      .populate("flatId")
      .populate("payerId", "name email phone")
      .populate("societyId", "name address city registrationNumber logo")
      .lean();

    if (!payment) {
      return sendError(res, "Receipt not found", 404);
    }

    if (payment.status !== "Successful") {
      return sendError(res, "Receipt is only available for verified successful payments.", 400);
    }

    return sendSuccess(res, {
      ...payment,
      id: payment._id.toString(),
    });
  } catch (error) {
    next(error);
  }
}
