import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import { User, Society, SocietyMembership, Flat, MaintenanceBill, Payment } from "../src/models/index.js";
import { generateAccessToken } from "../src/utils/token.js";

const app = createApp();

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe("Maintenance Management & Payments Test Suite", () => {
  let secretaryUser;
  let residentUser;
  let societyA;
  let societyB;
  let flatA1;
  let flatA2;
  let secToken;
  let resToken;

  beforeAll(async () => {
    // 1. Create 2 Societies
    societyA = await Society.create({
      name: "Maintenance Test Society A",
      registrationNumber: `SOC-MAINT-A-${Date.now()}`,
      address: "123 Main Road",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400001",
      secretaryName: "Secretary Sunita",
      secretaryMobile: "9811002201",
      secretaryEmail: `sec_sunita_${Date.now()}@test.com`,
    });

    societyB = await Society.create({
      name: "Maintenance Test Society B",
      registrationNumber: `SOC-MAINT-B-${Date.now()}`,
      address: "456 Side Road",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      secretaryName: "Secretary B",
      secretaryMobile: "9811002202",
      secretaryEmail: `sec_b_${Date.now()}@test.com`,
    });

    // 2. Create Secretary & Resident
    secretaryUser = await User.create({
      name: "Secretary Sunita",
      email: `sec_maint_${Date.now()}@test.com`,
      passwordHash: "hash123",
      role: "secretary",
      status: "Active",
      societyId: societyA._id,
    });

    residentUser = await User.create({
      name: "Resident Ramesh",
      email: `res_maint_${Date.now()}@test.com`,
      passwordHash: "hash123",
      role: "resident",
      status: "Active",
      societyId: societyA._id,
    });

    await SocietyMembership.create([
      { userId: secretaryUser._id, societyId: societyA._id, role: "secretary", status: "Active", isDefault: true },
      { userId: residentUser._id, societyId: societyA._id, role: "resident", status: "Active", isDefault: true },
    ]);

    // 3. Create Flats
    flatA1 = await Flat.create({
      societyId: societyA._id,
      wing: "A",
      flatNumber: "101",
      floor: 1,
      occupancyStatus: "Occupied",
      ownerId: residentUser._id,
      ownerName: "Resident Ramesh",
      ownerPhone: "9811002233",
      residentIds: [residentUser._id],
    });

    flatA2 = await Flat.create({
      societyId: societyA._id,
      wing: "A",
      flatNumber: "102",
      floor: 1,
      occupancyStatus: "Occupied",
      ownerName: "Pooja Hegde",
      ownerPhone: "9811004455",
      maintenanceAmount: 5000, // custom rate
    });

    secToken = generateAccessToken({
      userId: secretaryUser._id.toString(),
      email: secretaryUser.email,
      role: "secretary",
      societyId: societyA._id.toString(),
    });

    resToken = generateAccessToken({
      userId: residentUser._id.toString(),
      email: residentUser.email,
      role: "resident",
      societyId: societyA._id.toString(),
      flatId: flatA1._id.toString(),
    });

    await MaintenanceBill.deleteMany({ societyId: { $in: [societyA._id, societyB._id] } });
    await Payment.deleteMany({ societyId: { $in: [societyA._id, societyB._id] } });
  });

  afterAll(async () => {
    await MaintenanceBill.deleteMany({ societyId: { $in: [societyA._id, societyB._id] } });
    await Payment.deleteMany({ societyId: { $in: [societyA._id, societyB._id] } });
    await Flat.deleteMany({ societyId: { $in: [societyA._id, societyB._id] } });
    await SocietyMembership.deleteMany({ userId: { $in: [secretaryUser._id, residentUser._id] } });
    await User.deleteMany({ _id: { $in: [secretaryUser._id, residentUser._id] } });
    await Society.deleteMany({ _id: { $in: [societyA._id, societyB._id] } });
  });

  test("1. Generate monthly maintenance bills for society with flat-specific rates and duplicate prevention", async () => {
    const res = await request(app)
      .post("/api/v1/maintenance/generate-bills")
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString())
      .send({
        billingPeriod: "2026-11",
        dueDate: new Date("2026-11-20"),
        baseAmount: 3500,
        breakdown: [
          { label: "Base Maintenance", amount: 3000 },
          { label: "Sinking Fund", amount: 500 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.generatedCount).toBe(2);
    expect(res.body.data.skippedCount).toBe(0);

    // Verify flatA2 has custom flat-specific rate of 5000
    const bill2 = await MaintenanceBill.findOne({ societyId: societyA._id, flatId: flatA2._id, billingPeriod: "2026-11" });
    expect(bill2).toBeTruthy();
    expect(bill2.totalAmount).toBe(5000);

    // Re-running generation for the same period should skip without crashing or duplicating
    const reRun = await request(app)
      .post("/api/v1/maintenance/generate-bills")
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString())
      .send({
        billingPeriod: "2026-11",
        dueDate: new Date("2026-11-20"),
        baseAmount: 3500,
      });

    expect(reRun.status).toBe(200);
    expect(reRun.body.data.generatedCount).toBe(0);
    expect(reRun.body.data.skippedCount).toBe(2);
  });

  test("2. Secretary queries maintenance summary cards and bills", async () => {
    const res = await request(app)
      .get("/api/v1/maintenance")
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.totalExpected).toBe(8500); // 3500 + 5000
    expect(res.body.data.stats.countPending).toBe(2);
    expect(res.body.data.bills.length).toBe(2);
  });

  test("3. Secretary views detailed maintenance bill by ID", async () => {
    const bill1 = await MaintenanceBill.findOne({ societyId: societyA._id, flatId: flatA1._id, billingPeriod: "2026-11" });

    const res = await request(app)
      .get(`/api/v1/maintenance/${bill1._id}`)
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.flat).toContain("A-101");
    expect(res.body.data.totalAmount).toBe(3500);
    expect(res.body.data.breakdown.length).toBeGreaterThan(0);
  });

  test("4. Secretary records partial payment of ₹1500; status becomes Partially Paid", async () => {
    const bill1 = await MaintenanceBill.findOne({ societyId: societyA._id, flatId: flatA1._id, billingPeriod: "2026-11" });

    const res = await request(app)
      .post(`/api/v1/maintenance/${bill1._id}/record-payment`)
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString())
      .send({
        amount: 1500,
        paymentMethod: "Cash",
        transactionId: "CSH-001",
        notes: "Partial payment at desk",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bill.status).toBe("Partially Paid");
    expect(res.body.data.bill.paidAmount).toBe(1500);
    expect(res.body.data.bill.outstandingBalance).toBe(2000);
    expect(res.body.data.receiptNumber).toBeDefined();

    // Verify Payment document created in DB
    const pmt = await Payment.findOne({ billId: bill1._id });
    expect(pmt).toBeTruthy();
    expect(pmt.amount).toBe(1500);
    expect(pmt.paymentMethod).toBe("Cash");
  });

  test("5. Payment validation: Overpayment exceeding remaining balance rejected with 400", async () => {
    const bill1 = await MaintenanceBill.findOne({ societyId: societyA._id, flatId: flatA1._id, billingPeriod: "2026-11" });

    const res = await request(app)
      .post(`/api/v1/maintenance/${bill1._id}/record-payment`)
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString())
      .send({
        amount: 5000, // Remaining balance is only 2000
        paymentMethod: "UPI",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("cannot exceed the remaining balance");
  });

  test("6. Payment validation: Zero or negative amount rejected with 400", async () => {
    const bill1 = await MaintenanceBill.findOne({ societyId: societyA._id, flatId: flatA1._id, billingPeriod: "2026-11" });

    const res = await request(app)
      .post(`/api/v1/maintenance/${bill1._id}/record-payment`)
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString())
      .send({
        amount: -500,
        paymentMethod: "UPI",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("7. Secretary records remaining balance of ₹2000; status transitions to Paid", async () => {
    const bill1 = await MaintenanceBill.findOne({ societyId: societyA._id, flatId: flatA1._id, billingPeriod: "2026-11" });

    const res = await request(app)
      .post(`/api/v1/maintenance/${bill1._id}/record-payment`)
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString())
      .send({
        amount: 2000,
        paymentMethod: "UPI",
        transactionId: "UPI-PAY-7788",
        notes: "Settled full balance",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bill.status).toBe("Paid");
    expect(res.body.data.bill.paidAmount).toBe(3500);
    expect(res.body.data.bill.outstandingBalance).toBe(0);

    // Fresh fetch to ensure persistence
    const updated = await MaintenanceBill.findById(bill1._id);
    expect(updated.status).toBe("Paid");
    expect(updated.outstandingBalance).toBe(0);
  });

  test("8. Fully paid bill rejects further payments with 400", async () => {
    const bill1 = await MaintenanceBill.findOne({ societyId: societyA._id, flatId: flatA1._id, billingPeriod: "2026-11" });

    const res = await request(app)
      .post(`/api/v1/maintenance/${bill1._id}/record-payment`)
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString())
      .send({
        amount: 500,
        paymentMethod: "Cash",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already fully paid");
  });

  test("9. Overdue detection: Bill past due date with remaining balance is marked Overdue", async () => {
    // Create an past due bill
    const pastBill = await MaintenanceBill.create({
      societyId: societyA._id,
      flatId: flatA1._id,
      wing: "A",
      flatNumber: "101",
      billingPeriod: "2026-08",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      baseAmount: 3000,
      totalAmount: 3000,
      paidAmount: 0,
      outstandingBalance: 3000,
      status: "Unpaid",
    });

    const res = await request(app)
      .get("/api/v1/maintenance?status=Overdue")
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyA._id.toString());

    expect(res.status).toBe(200);
    const overdue = res.body.data.bills.find((b) => b.id === pastBill._id.toString());
    expect(overdue).toBeTruthy();
    expect(overdue.status).toBe("Overdue");
  });

  test("10. Cross-society isolation: Secretary cannot record payments for another society's bill", async () => {
    // Create bill in Society B
    const billSocietyB = await MaintenanceBill.create({
      societyId: societyB._id,
      flatId: new mongoose.Types.ObjectId(),
      wing: "B",
      flatNumber: "999",
      billingPeriod: "2026-11",
      dueDate: new Date("2026-11-20"),
      baseAmount: 4000,
      totalAmount: 4000,
      paidAmount: 0,
      outstandingBalance: 4000,
      status: "Unpaid",
    });

    // Secretary of Society A attempts to record payment on Society B's bill
    const res = await request(app)
      .post(`/api/v1/maintenance/${billSocietyB._id}/record-payment`)
      .set("Authorization", `Bearer ${secToken}`)
      .set("x-society-id", societyB._id.toString())
      .send({
        amount: 1000,
        paymentMethod: "Cash",
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
