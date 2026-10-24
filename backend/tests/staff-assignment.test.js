import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import { User, Society, SocietyMembership, Flat, Complaint, Staff } from "../src/models/index.js";
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

describe("Staff Management & Complaint Staff Assignment Tests", () => {
  let societyA, societyB;
  let secretaryUserA, residentUserA, residentUserB;
  let tokenSecretaryA, tokenResidentA;
  let flatA1;
  let complaintA1;
  let staffPlumberA, staffElectricianA, staffPlumberB, staffTerminatedA;

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    // 1. Societies
    societyA = await Society.create({
      name: "Society Alpha",
      registrationNumber: "SOC-ALPHA-01",
      address: "123 MG Road",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      secretaryName: "Secretary Alpha",
      secretaryMobile: "9800000001",
      secretaryEmail: "sec.alpha@test.com",
    });

    societyB = await Society.create({
      name: "Society Beta",
      registrationNumber: "SOC-BETA-02",
      address: "456 Link Road",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400001",
      secretaryName: "Secretary Beta",
      secretaryMobile: "9800000002",
      secretaryEmail: "sec.beta@test.com",
    });

    // 2. Users
    secretaryUserA = await User.create({
      name: "Rahul Patil",
      email: "sec.alpha@test.com",
      passwordHash: passwordHash,
      phone: "9800000001",
      role: "secretary",
      status: "Active",
    });

    residentUserA = await User.create({
      name: "Vikram Malhotra",
      email: "vikram@test.com",
      passwordHash: passwordHash,
      phone: "9820044556",
      role: "resident",
      status: "Active",
      wing: "A",
      flatNumber: "101",
    });

    // 3. Memberships
    await SocietyMembership.create({
      userId: secretaryUserA._id,
      societyId: societyA._id,
      role: "secretary",
      status: "Active",
    });

    await SocietyMembership.create({
      userId: residentUserA._id,
      societyId: societyA._id,
      role: "resident",
      status: "Active",
      wing: "A",
      flatNumber: "101",
      residentType: "Owner",
    });

    // 4. Flat
    flatA1 = await Flat.create({
      societyId: societyA._id,
      wing: "A",
      flatNumber: "101",
      floor: 1,
      ownerId: residentUserA._id,
      residentIds: [residentUserA._id],
      occupancyStatus: "Occupied",
    });

    // 5. Staff in Society A
    staffPlumberA = await Staff.create({
      societyId: societyA._id,
      name: "Ramesh Pawar",
      phone: "9823001122",
      role: "Plumber",
      shift: "General",
      status: "On Duty",
      assignedWing: "All",
    });

    staffElectricianA = await Staff.create({
      societyId: societyA._id,
      name: "Mahesh Jadhav",
      phone: "9823001133",
      role: "Electrician",
      shift: "Morning",
      status: "On Duty",
      assignedWing: "All",
    });

    staffTerminatedA = await Staff.create({
      societyId: societyA._id,
      name: "Old Staff",
      phone: "9823009999",
      role: "Housekeeping",
      shift: "General",
      status: "Terminated",
      assignedWing: "All",
    });

    // 6. Staff in Society B (cross-society)
    staffPlumberB = await Staff.create({
      societyId: societyB._id,
      name: "Beta Plumber",
      phone: "9823002222",
      role: "Plumber",
      shift: "General",
      status: "On Duty",
      assignedWing: "All",
    });

    // 7. Complaint in Society A
    complaintA1 = await Complaint.create({
      societyId: societyA._id,
      complaintNumber: "CMP-2026-001",
      createdBy: residentUserA._id,
      flatId: flatA1._id,
      wing: "A",
      flatNumber: "101",
      title: "Water pipe leaking in kitchen",
      description: "Severe water leakage under kitchen sink",
      category: "Plumbing",
      priority: "High",
      status: "Pending",
      visibility: "private",
    });

    tokenSecretaryA = generateAccessToken({
      userId: secretaryUserA._id,
      role: "secretary",
      societyId: societyA._id,
    });
    tokenResidentA = generateAccessToken({
      userId: residentUserA._id,
      role: "resident",
      societyId: societyA._id,
      flatId: flatA1._id,
    });
  });

  describe("Staff Directory CRUD APIs", () => {
    it("should list staff members for the authenticated society", async () => {
      const res = await request(app)
        .get("/api/v1/staff")
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      const names = res.body.data.map((s) => s.name);
      expect(names).toContain("Ramesh Pawar");
      expect(names).toContain("Mahesh Jadhav");
    });

    it("should allow Secretary to create a new staff member", async () => {
      const res = await request(app)
        .post("/api/v1/staff")
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          name: "Sunita Devi",
          phone: "9823005555",
          email: "sunita@clean.com",
          role: "Housekeeping",
          shift: "Morning",
          status: "On Duty",
          assignedWing: "Wing A",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Sunita Devi");
      expect(res.body.data.role).toBe("Housekeeping");

      const inDB = await Staff.findOne({ name: "Sunita Devi", societyId: societyA._id });
      expect(inDB).toBeTruthy();
      expect(inDB.phone).toBe("9823005555");
    });

    it("should allow Secretary to update an existing staff member status", async () => {
      const res = await request(app)
        .patch(`/api/v1/staff/${staffPlumberA._id}`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          status: "On Leave",
          shift: "Evening",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("On Leave");
      expect(res.body.data.shift).toBe("Evening");

      const updated = await Staff.findById(staffPlumberA._id);
      expect(updated.status).toBe("On Leave");
    });

    it("should allow Secretary to remove a staff member", async () => {
      const res = await request(app)
        .delete(`/api/v1/staff/${staffTerminatedA._id}`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const inDB = await Staff.findById(staffTerminatedA._id);
      expect(inDB).toBeNull();
    });
  });

  describe("Complaint Staff Assignment Workflows", () => {
    it("should assign selected staff member by MongoDB ID and update complaint status to In Progress", async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/assign`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          staffMemberId: staffPlumberA._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedStaff).toBeTruthy();
      expect(res.body.data.assignedStaff.name).toBe("Ramesh Pawar");
      expect(res.body.data.assignedStaff.role).toBe("Plumber");
      expect(res.body.data.assignedStaff.phone).toBe("9823001122");
      expect(res.body.data.status).toBe("In Progress");

      // Verify in MongoDB
      const inDB = await Complaint.findById(complaintA1._id);
      expect(inDB.assignedStaff.name).toBe("Ramesh Pawar");
      expect(inDB.assignedStaff.staffId.toString()).toBe(staffPlumberA._id.toString());
      expect(inDB.assignedStaff.assignedBy.toString()).toBe(secretaryUserA._id.toString());
      expect(inDB.status).toBe("In Progress");

      // Verify status history log
      const lastHistory = inDB.statusHistory[inDB.statusHistory.length - 1];
      expect(lastHistory.notes).toContain("Assigned to Ramesh Pawar (Plumber)");
    });

    it("should allow reassigning complaint to another staff member and update statusHistory", async () => {
      // 1. Initial assignment to Plumber
      await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/assign`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          staffMemberId: staffPlumberA._id.toString(),
        });

      // 2. Reassign to Electrician
      const res = await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/assign`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          staffMemberId: staffElectricianA._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignedStaff.name).toBe("Mahesh Jadhav");
      expect(res.body.data.assignedStaff.role).toBe("Electrician");

      const inDB = await Complaint.findById(complaintA1._id);
      expect(inDB.assignedStaff.name).toBe("Mahesh Jadhav");
      expect(inDB.statusHistory.some((h) => h.notes.includes("Reassigned from Ramesh Pawar to Mahesh Jadhav"))).toBe(
        true
      );
    });

    it("should reject assignment if staff member belongs to another society (403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/assign`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          staffMemberId: staffPlumberB._id.toString(), // Belongs to Society Beta
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not belong to this society/i);

      // Verify complaint was not modified
      const inDB = await Complaint.findById(complaintA1._id);
      expect(inDB.assignedStaff?.name).toBeFalsy();
    });

    it("should reject assignment if staff member ID is invalid or non-existent", async () => {
      // Invalid hex ID
      const resInvalid = await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/assign`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          staffMemberId: "invalid-object-id",
        });
      expect(resInvalid.status).toBe(400);

      // Non-existent ID
      const resNonExistent = await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/assign`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          staffMemberId: "600000000000000000000099",
        });
      expect(resNonExistent.status).toBe(404);
    });

    it("should reject assignment if staff member is Terminated (400 Bad Request)", async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/assign`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          staffMemberId: staffTerminatedA._id.toString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/terminated staff member/i);
    });

    it("should allow Secretary to unassign / remove staff from a complaint", async () => {
      // 1. Assign first
      await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/assign`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          staffMemberId: staffPlumberA._id.toString(),
        });

      // 2. Unassign
      const res = await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/unassign`)
        .set("Authorization", `Bearer ${tokenSecretaryA}`)
        .set("X-Society-Id", societyA._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const inDB = await Complaint.findById(complaintA1._id);
      expect(inDB.assignedStaff?.name).toBeFalsy();
      const lastHistory = inDB.statusHistory[inDB.statusHistory.length - 1];
      expect(lastHistory.notes).toContain("Staff assignment removed");
    });

    it("should reject non-Secretary (Resident) attempting to assign staff (403 Forbidden)", async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${complaintA1._id}/assign`)
        .set("Authorization", `Bearer ${tokenResidentA}`)
        .set("X-Society-Id", societyA._id.toString())
        .send({
          staffMemberId: staffPlumberA._id.toString(),
        });

      expect(res.status).toBe(403);
    });
  });
});
