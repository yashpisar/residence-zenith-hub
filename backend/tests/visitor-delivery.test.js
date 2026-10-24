import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { setupTestDB, teardownTestDB } from "./setup.js";
import { Society, User, SocietyMembership, Flat, Visitor, Delivery } from "../src/models/index.js";
import { generateAccessToken } from "../src/utils/token.js";

jest.setTimeout(35000);

describe("Visitor & Delivery Management Verification", () => {
  let app;
  let society;
  let flat;
  let guardUser;
  let guardToken;

  beforeAll(async () => {
    await setupTestDB();
    app = createApp();

    // Create test society
    society = await Society.create({
      name: "Harmony Test Society",
      slug: "harmony-test",
      registrationNumber: "REG-TEST-VD-1",
      address: "Test Lane",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      secretaryName: "Test Secretary",
      secretaryEmail: "sec_test@harmony.com",
      secretaryMobile: "9876543210",
      totalWings: 2,
      totalFlats: 10,
    });

    // Create test flat
    flat = await Flat.create({
      societyId: society._id,
      wing: "A",
      flatNumber: "101",
      floor: 1,
      occupancyStatus: "Occupied",
      ownerName: "Test Resident",
    });

    // Create guard user
    guardUser = await User.create({
      name: "Security Guard",
      email: `guard_${Date.now()}@harmony.com`,
      phone: "9988776655",
      passwordHash: "dummyhash",
      role: "security",
      societyId: society._id,
      status: "Active",
    });

    // Create active membership
    await SocietyMembership.create({
      userId: guardUser._id,
      societyId: society._id,
      role: "security",
      status: "Active",
    });

    guardToken = generateAccessToken({ userId: guardUser._id.toString(), role: "security" });
  }, 35000);

  afterAll(async () => {
    await teardownTestDB();
  }, 35000);

  test("1. Guard registers a walk-in visitor with immediate entry & photo", async () => {
    const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

    const res = await request(app)
      .post("/api/v1/visitors")
      .set("Authorization", `Bearer ${guardToken}`)
      .set("X-Society-Id", society._id.toString())
      .send({
        visitorName: "Test Visitor Amit",
        phone: "9876543210",
        purpose: "Guest",
        wing: flat.wing,
        flatNumber: flat.flatNumber,
        flatId: flat._id.toString(),
        vehicleNumber: "MH-12-TEST-1",
        photographUrl: dummyBase64,
        immediateEntry: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.visitorName).toBe("Test Visitor Amit");
    expect(res.body.data.approvalStatus).toBe("Approved");
    expect(res.body.data.entryTime).toBeDefined();
    expect(res.body.data.photographUrl).toMatch(/^\/api\/v1\/files\//);

    // Verify directly in MongoDB
    const doc = await Visitor.findById(res.body.data._id || res.body.data.id);
    expect(doc).toBeDefined();
    expect(doc.visitorName).toBe("Test Visitor Amit");
    expect(doc.photographUrl).toMatch(/^\/api\/v1\/files\//);
  });

  test("2. Guard marks visitor exit & checks out visitor", async () => {
    const visitor = await Visitor.findOne({ visitorName: "Test Visitor Amit", societyId: society._id });
    expect(visitor).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/visitors/${visitor._id}/exit`)
      .set("Authorization", `Bearer ${guardToken}`)
      .set("X-Society-Id", society._id.toString())
      .send();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.exitTime).toBeDefined();

    // Verify exitTime updated in MongoDB
    const updated = await Visitor.findById(visitor._id);
    expect(updated.exitTime).toBeDefined();
  });

  test("3. Guard queries visitor history with filters and gets persisted MongoDB records", async () => {
    const res = await request(app)
      .get("/api/v1/visitors?search=Amit")
      .set("Authorization", `Bearer ${guardToken}`)
      .set("X-Society-Id", society._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.visitors.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.visitors.find((v) => v.visitorName === "Test Visitor Amit");
    expect(found).toBeDefined();
    expect(found.status).toBe("Exited");
  });

  test("4. Guard records a package delivery with photo", async () => {
    const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

    const res = await request(app)
      .post("/api/v1/deliveries")
      .set("Authorization", `Bearer ${guardToken}`)
      .set("X-Society-Id", society._id.toString())
      .send({
        wing: flat.wing,
        flatNumber: flat.flatNumber,
        recipientName: "Test Resident",
        courierCompany: "Amazon",
        trackingNumber: "AMZ-TEST-999",
        deliveryType: "Parcel",
        parcelDetails: "1 Electronics Box",
        packagePhoto: dummyBase64,
        deliveryPersonName: "Courier Agent",
        deliveryPersonPhone: "9123456789",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.courierCompany).toBe("Amazon");
    expect(res.body.data.status).toBe("Waiting for Pickup");
    expect(res.body.data.packagePhoto).toMatch(/^\/api\/v1\/files\//);

    // Verify directly in MongoDB
    const doc = await Delivery.findById(res.body.data._id || res.body.data.id);
    expect(doc).toBeDefined();
    expect(doc.status).toBe("Waiting for Pickup");
    expect(doc.packagePhoto).toMatch(/^\/api\/v1\/files\//);
  });

  test("5. Guard hands over delivery to resident", async () => {
    const delivery = await Delivery.findOne({ trackingNumber: "AMZ-TEST-999", societyId: society._id });
    expect(delivery).toBeDefined();

    const res = await request(app)
      .patch(`/api/v1/deliveries/${delivery._id}/handover`)
      .set("Authorization", `Bearer ${guardToken}`)
      .set("X-Society-Id", society._id.toString())
      .send({ collectedBy: "Test Resident (Self)" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("Collected");
    expect(res.body.data.collectedBy).toBe("Test Resident (Self)");
    expect(res.body.data.collectedAt).toBeDefined();

    // Verify in MongoDB
    const updated = await Delivery.findById(delivery._id);
    expect(updated.status).toBe("Collected");
    expect(updated.collectedBy).toBe("Test Resident (Self)");
  });

  test("6. Guard gets delivery list including history from MongoDB", async () => {
    const res = await request(app)
      .get("/api/v1/deliveries?status=Collected")
      .set("Authorization", `Bearer ${guardToken}`)
      .set("X-Society-Id", society._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.find((d) => d.trackingNumber === "AMZ-TEST-999");
    expect(found).toBeDefined();
    expect(found.status).toBe("Collected");
  });
});
