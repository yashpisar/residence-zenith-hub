import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import { User, Society, SocietyMembership, Flat, MaintenanceBill, Complaint } from "../src/models/index.js";
import { generateAccessToken } from "../src/utils/token.js";

const app = createApp();

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("Core Workflows, Concurrency & Multi-Society Isolation Tests", () => {
  let societyA, societyB, residentA, secretaryA, residentB, tokenResidentA, tokenSecretaryA, tokenResidentB;
  let flatA;

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    // Create Society A and Society B
    societyA = await Society.create({
      name: "Society Alpha",
      registrationNumber: "SOC-A-001",
      address: "Address A",
      city: "Pune",
      state: "MH",
      pinCode: "411001",
      secretaryName: "Sec A",
      secretaryMobile: "9800000001",
      secretaryEmail: "secA@test.com",
    });

    societyB = await Society.create({
      name: "Society Beta",
      registrationNumber: "SOC-B-002",
      address: "Address B",
      city: "Mumbai",
      state: "MH",
      pinCode: "400001",
      secretaryName: "Sec B",
      secretaryMobile: "9800000002",
      secretaryEmail: "secB@test.com",
    });

    // Create Flats
    flatA = await Flat.create({
      societyId: societyA._id,
      wing: "A",
      flatNumber: "A-101",
      floor: 1,
      occupancyStatus: "Occupied",
    });

    // Create Users
    residentA = await User.create({
      name: "Resident Alpha",
      email: "resA@test.com",
      passwordHash,
      role: "resident",
      status: "Active",
      societyId: societyA._id,
      flatId: flatA._id,
      wing: "A",
      flatNumber: "A-101",
    });

    secretaryA = await User.create({
      name: "Secretary Alpha",
      email: "secA@test.com",
      passwordHash,
      role: "secretary",
      status: "Active",
      societyId: societyA._id,
    });

    residentB = await User.create({
      name: "Resident Beta",
      email: "resB@test.com",
      passwordHash,
      role: "resident",
      status: "Active",
      societyId: societyB._id,
    });

    // Memberships
    await SocietyMembership.create([
      { userId: residentA._id, societyId: societyA._id, role: "resident", flatId: flatA._id, wing: "A", flatNumber: "A-101", isDefault: true, status: "Active" },
      { userId: secretaryA._id, societyId: societyA._id, role: "secretary", isDefault: true, status: "Active" },
      { userId: residentB._id, societyId: societyB._id, role: "resident", isDefault: true, status: "Active" },
    ]);

    // Tokens
    tokenResidentA = generateAccessToken({ userId: residentA._id, role: "resident", societyId: societyA._id, flatId: flatA._id });
    tokenSecretaryA = generateAccessToken({ userId: secretaryA._id, role: "secretary", societyId: societyA._id });
    tokenResidentB = generateAccessToken({ userId: residentB._id, role: "resident", societyId: societyB._id });
  });

  test("Cross-society isolation: User in Society B cannot access or modify records of Society A", async () => {
    // Resident B attempts to request bills of Society A
    const res = await request(app)
      .get("/api/v1/maintenance")
      .set("Authorization", `Bearer ${tokenResidentB}`)
      .set("X-Society-Id", societyA._id.toString());

    // Should receive 403 Forbidden because resident B is not a member of Society A
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test("Complaint Workflow & Duplicate Upvote Prevention", async () => {
    // 1. Create a public complaint
    const createRes = await request(app)
      .post("/api/v1/complaints")
      .set("Authorization", `Bearer ${tokenResidentA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({
        title: "Main gate light not working",
        description: "Lights near security gate are out",
        category: "Electrical",
        visibility: "public",
        priority: "Medium",
      });

    expect(createRes.status).toBe(201);
    const complaintId = createRes.body.data.id;
    expect(createRes.body.data.complaintNumber).toMatch(/^CMP-/);

    // 2. Upvote once: should add upvote
    const vote1 = await request(app)
      .post(`/api/v1/complaints/${complaintId}/support`)
      .set("Authorization", `Bearer ${tokenResidentA}`)
      .set("X-Society-Id", societyA._id.toString());

    expect(vote1.status).toBe(200);
    expect(vote1.body.data.hasUpvoted).toBe(true);
    expect(vote1.body.data.upvoteCount).toBe(1);

    // 3. Upvote again: atomic toggle should remove upvote (no duplicates)
    const vote2 = await request(app)
      .post(`/api/v1/complaints/${complaintId}/support`)
      .set("Authorization", `Bearer ${tokenResidentA}`)
      .set("X-Society-Id", societyA._id.toString());

    expect(vote2.status).toBe(200);
    expect(vote2.body.data.hasUpvoted).toBe(false);
    expect(vote2.body.data.upvoteCount).toBe(0);

    // 4. Secretary updates status to Resolved
    const statusRes = await request(app)
      .patch(`/api/v1/complaints/${complaintId}/status`)
      .set("Authorization", `Bearer ${tokenSecretaryA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({ status: "Resolved", notes: "Bulbs replaced" });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe("Resolved");
    expect(statusRes.body.data.statusHistory.length).toBe(2);

    // 5. GET /api/v1/complaints/:id - Secretary views full complaint details
    const detailRes = await request(app)
      .get(`/api/v1/complaints/${complaintId}`)
      .set("Authorization", `Bearer ${tokenSecretaryA}`)
      .set("X-Society-Id", societyA._id.toString());

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.title).toBe("Main gate light not working");
    expect(detailRes.body.data.createdBy.name).toBe("Resident Alpha");
    expect(detailRes.body.data.societyName).toBe("Society Alpha");
    expect(detailRes.body.data.status).toBe("Resolved");

    // 6. Cross-society protection on complaint details: User from Society B cannot view Society A complaint
    const crossRes = await request(app)
      .get(`/api/v1/complaints/${complaintId}`)
      .set("Authorization", `Bearer ${tokenResidentB}`)
      .set("X-Society-Id", societyB._id.toString());

    expect(crossRes.status).toBe(404);
    expect(crossRes.body.success).toBe(false);

    // 7. Secretary assigns staff to complaint
    const assignRes = await request(app)
      .patch(`/api/v1/complaints/${complaintId}/assign`)
      .set("Authorization", `Bearer ${tokenSecretaryA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({
        name: "Ramesh Electrician",
        phone: "9876543210",
        role: "Electrician",
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.assignedStaff.name).toBe("Ramesh Electrician");
    expect(assignRes.body.data.assignedStaff.role).toBe("Electrician");

    // 8. Resident creates complaint with photo evidence
    const photoComplaintRes = await request(app)
      .post("/api/v1/complaints")
      .set("Authorization", `Bearer ${tokenResidentA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({
        title: "Pipe burst in basement parking",
        description: "Water leaking heavily near Pillar 4",
        category: "Plumbing",
        priority: "High",
        isUrgent: true,
        images: ["/api/v1/files/sample-leak-photo.jpg"],
      });

    expect(photoComplaintRes.status).toBe(201);
    expect(photoComplaintRes.body.data.images).toContain("/api/v1/files/sample-leak-photo.jpg");

    // Verify photo is returned in GET detail endpoint
    const photoDetailRes = await request(app)
      .get(`/api/v1/complaints/${photoComplaintRes.body.data.id}`)
      .set("Authorization", `Bearer ${tokenSecretaryA}`)
      .set("X-Society-Id", societyA._id.toString());

    expect(photoDetailRes.status).toBe(200);
    expect(photoDetailRes.body.data.images).toContain("/api/v1/files/sample-leak-photo.jpg");
    expect(photoDetailRes.body.data.isUrgent).toBe(true);
  });

  test("Maintenance & Payment Verification: Compound index prevents duplicate bills and verifies payments atomically", async () => {
    // 1. Secretary generates batch bills for period 2026-10
    const billGen1 = await request(app)
      .post("/api/v1/maintenance/generate-bills")
      .set("Authorization", `Bearer ${tokenSecretaryA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({
        billingPeriod: "2026-10",
        dueDate: "2026-10-31",
        baseAmount: 4000,
        breakdown: [
          { label: "Base", amount: 3500 },
          { label: "Water", amount: 500 },
        ],
      });

    expect(billGen1.status).toBe(200);
    expect(billGen1.body.data.generatedCount).toBe(1);

    // 2. Concurrency check: running duplicate generation should not duplicate bills (skippedCount = 1)
    const billGen2 = await request(app)
      .post("/api/v1/maintenance/generate-bills")
      .set("Authorization", `Bearer ${tokenSecretaryA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({
        billingPeriod: "2026-10",
        dueDate: "2026-10-31",
        baseAmount: 4000,
      });

    expect(billGen2.status).toBe(200);
    expect(billGen2.body.data.skippedCount).toBe(1);

    // Find the generated bill
    const bill = await MaintenanceBill.findOne({ societyId: societyA._id, billingPeriod: "2026-10" });
    expect(bill).toBeDefined();
    expect(bill.totalAmount).toBe(4000);
    expect(bill.status).toBe("Unpaid");

    // 3. Resident initiates payment order
    const orderRes = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${tokenResidentA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({ billId: bill._id.toString() });

    expect(orderRes.status).toBe(200);
    const paymentId = orderRes.body.data.paymentId;
    expect(orderRes.body.data.amount).toBe(4000); // Server calculated exact balance

    // 4. Verify payment
    const verifyRes = await request(app)
      .post("/api/v1/payments/verify")
      .set("Authorization", `Bearer ${tokenResidentA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({ paymentId, providerOrderId: orderRes.body.data.orderId });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.receiptNumber).toMatch(/^RCP-/);
    expect(verifyRes.body.data.billStatus).toBe("Paid");

    // 5. Check bill in DB
    const updatedBill = await MaintenanceBill.findById(bill._id);
    expect(updatedBill.status).toBe("Paid");
    expect(updatedBill.outstandingBalance).toBe(0);
    expect(updatedBill.paidAmount).toBe(4000);
  });
});
