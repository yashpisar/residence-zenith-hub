import request from "supertest";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createApp } from "../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import {
  User,
  Society,
  SocietyMembership,
  Flat,
  Staff,
  Invitation,
  AuditLog,
  Notification,
} from "../src/models/index.js";
import { generateAccessToken, hashString } from "../src/utils/token.js";

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

describe("Comprehensive Registration System & Security Matrix Tests", () => {
  let societyA;
  let societyB;
  let flatA1;
  let secretaryA;
  let tokenSecretaryA;

  beforeEach(async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    // 1. Create Societies
    societyA = await Society.create({
      name: "Harmony Heights",
      registrationNumber: "SOC-HH-001",
      address: "Link Road",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411057",
      secretaryName: "Rahul Patil",
      secretaryMobile: "9876543210",
      secretaryEmail: "rahul@harmony.com",
    });

    societyB = await Society.create({
      name: "Green Valley Residency",
      registrationNumber: "SOC-GV-002",
      address: "MG Road",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400001",
      secretaryName: "Sanjay Mehta",
      secretaryMobile: "9876543211",
      secretaryEmail: "sanjay@greenvalley.com",
    });

    // 2. Create Flats in Society A
    flatA1 = await Flat.create({
      societyId: societyA._id,
      wing: "A",
      flatNumber: "101",
      floor: 1,
      occupancyStatus: "Vacant",
      residentIds: [],
      totalResidents: 0,
    });

    // 3. Create Verified Secretary for Society A
    secretaryA = await User.create({
      name: "Rahul Patil",
      email: "secretary@harmony.com",
      passwordHash,
      role: "secretary",
      status: "Active",
      societyId: societyA._id,
    });

    await SocietyMembership.create({
      userId: secretaryA._id,
      societyId: societyA._id,
      role: "secretary",
      status: "Active",
      isDefault: true,
    });

    tokenSecretaryA = generateAccessToken({
      userId: secretaryA._id,
      email: secretaryA.email,
      role: "secretary",
      societyId: societyA._id,
    });
  });

  // TEST 1: Resident registration without invitation -> Pending
  test("1. Resident registration without invitation creates account with Pending membership", async () => {
    const res = await request(app).post("/api/v1/auth/register/resident").send({
      name: "Ananya Rao",
      email: "ananya@test.com",
      phone: "9876543220",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
      residentType: "Owner",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.membershipStatus).toBe("Pending");

    // Database check
    const membership = await SocietyMembership.findOne({
      societyId: societyA._id,
      wing: "A",
      flatNumber: "101",
    });
    expect(membership).toBeDefined();
    expect(membership.status).toBe("Pending");

    // Flat should still be Vacant since application is pending
    const flat = await Flat.findById(flatA1._id);
    expect(flat.occupancyStatus).toBe("Vacant");
    expect(flat.residentIds.length).toBe(0);
  });

  // TEST 2: Duplicate Email Registration in the same society -> 409 Conflict
  test("2. Duplicate email registration within the same society rejected with 409 Conflict", async () => {
    await request(app).post("/api/v1/auth/register/resident").send({
      name: "Ananya Rao",
      email: "ananya@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
    });

    const duplicateRes = await request(app).post("/api/v1/auth/register/resident").send({
      name: "Ananya Rao Clone",
      email: "ananya@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
    });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });

  // TEST 3: Concurrent same-email registrations handled cleanly
  test("3. Concurrent same-email registrations ensure only one succeeds without crashing", async () => {
    const req1 = request(app).post("/api/v1/auth/register/resident").send({
      name: "Fast User 1",
      email: "fast@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
    });

    const req2 = request(app).post("/api/v1/auth/register/resident").send({
      name: "Fast User 2",
      email: "fast@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
    });

    const [res1, res2] = await Promise.all([req1, req2]);
    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);
  });

  // TEST 4: Single-use invitation generation, hash storage & redemption
  test("4. Single-use invitation token is hashed, stored securely, and enables instant Active membership", async () => {
    // Secretary generates an invitation
    const inviteRes = await request(app)
      .post("/api/v1/invitations")
      .set("Authorization", `Bearer ${tokenSecretaryA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({
        role: "resident",
        residentType: "Tenant",
        wing: "A",
        flatNumber: "101",
        expiresDays: 7,
      });

    expect(inviteRes.status).toBe(201);
    const rawToken = inviteRes.body.data.invitationToken;
    expect(rawToken).toBeDefined();

    // Verify token is NOT stored as plaintext in DB
    const tokenRecord = await Invitation.findById(inviteRes.body.data.invitationId);
    expect(tokenRecord.tokenHash).not.toBe(rawToken);
    expect(tokenRecord.tokenHash).toBe(hashString(rawToken));

    // Resident registers with this valid token
    const regRes = await request(app).post("/api/v1/auth/register/resident").send({
      name: "Tenant User",
      email: "tenant@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
      residentType: "Tenant",
      invitationToken: rawToken,
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.membershipStatus).toBe("Active");

    // Token should now have usedCount = 1
    const updatedToken = await Invitation.findById(tokenRecord._id);
    expect(updatedToken.usedCount).toBe(1);

    // Flat should now be Occupied
    const flat = await Flat.findById(flatA1._id);
    expect(flat.occupancyStatus).toBe("Occupied");
    expect(flat.residentIds.length).toBe(1);
  });

  // TEST 5: Redeeming already-used single-use token rejected
  test("5. Redeeming an already-used invitation token is atomically rejected", async () => {
    const rawToken = "invite_token_sample_123";
    const tokenHash = hashString(rawToken);

    await Invitation.create({
      societyId: societyA._id,
      invitedBy: secretaryA._id,
      role: "resident",
      tokenHash,
      usageLimit: 1,
      usedCount: 1, // Already used
      expiresAt: new Date(Date.now() + 86400000),
      isRevoked: false,
    });

    const res = await request(app).post("/api/v1/auth/register/resident").send({
      name: "Late User",
      email: "late@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
      invitationToken: rawToken,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // TEST 6: Expired invitation token rejected with 400 Bad Request
  test("6. Expired invitation token rejected with 400 Bad Request", async () => {
    const rawToken = "expired_token_123";
    const tokenHash = hashString(rawToken);

    await Invitation.create({
      societyId: societyA._id,
      invitedBy: secretaryA._id,
      role: "resident",
      tokenHash,
      usageLimit: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
      isRevoked: false,
    });

    const res = await request(app).post("/api/v1/auth/register/resident").send({
      name: "Expired User",
      email: "expired@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
      invitationToken: rawToken,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  // TEST 7: Revoked invitation token rejected with 400 Bad Request
  test("7. Revoked invitation token is rejected", async () => {
    const rawToken = "revoked_token_123";
    const tokenHash = hashString(rawToken);

    await Invitation.create({
      societyId: societyA._id,
      invitedBy: secretaryA._id,
      role: "resident",
      tokenHash,
      usageLimit: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 86400000),
      isRevoked: true,
    });

    const res = await request(app).post("/api/v1/auth/register/resident").send({
      name: "Revoked User",
      email: "revoked@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
      invitationToken: rawToken,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/revoked/i);
  });

  // TEST 8: Cross-society invitation token mismatch rejected
  test("8. Cross-society invitation token mismatch is strictly rejected", async () => {
    const rawToken = "society_b_token_123";
    const tokenHash = hashString(rawToken);

    // Created for Society B
    await Invitation.create({
      societyId: societyB._id,
      invitedBy: secretaryA._id,
      role: "resident",
      tokenHash,
      usageLimit: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 86400000),
      isRevoked: false,
    });

    // Attempted use in Society A
    const res = await request(app).post("/api/v1/auth/register/resident").send({
      name: "Cross User",
      email: "cross@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
      invitationToken: rawToken,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/different society/i);
  });

  // TEST 9: Recipient email binding on invitation enforced
  test("9. Recipient email binding on invitation token is strictly enforced", async () => {
    const rawToken = "bound_email_token_123";
    const tokenHash = hashString(rawToken);

    await Invitation.create({
      societyId: societyA._id,
      invitedBy: secretaryA._id,
      role: "resident",
      recipientEmail: "vip@test.com",
      tokenHash,
      usageLimit: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 86400000),
      isRevoked: false,
    });

    const res = await request(app).post("/api/v1/auth/register/resident").send({
      name: "Imposter User",
      email: "imposter@test.com", // Mismatch
      password: "password123",
      societyId: societyA._id.toString(),
      wing: "A",
      flatNumber: "101",
      invitationToken: rawToken,
    });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/restricted to/i);
  });

  // TEST 10: Unauthorized Secretary Registration without token rejected
  test("10. Secretary registration for existing society without valid token rejected (400/403)", async () => {
    const res = await request(app).post("/api/v1/auth/register/secretary").send({
      name: "Fake Secretary",
      email: "fake_sec@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      invitationToken: "",
    });

    expect([400, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  // TEST 11: Pending Resident Access Denial
  test("11. User with Pending membership is denied access to complaints and maintenance (403)", async () => {
    // Create pending user & membership
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const pendingUser = await User.create({
      name: "Pending User",
      email: "pending@test.com",
      passwordHash,
      role: "resident",
      status: "Active",
      societyId: societyA._id,
    });

    await SocietyMembership.create({
      userId: pendingUser._id,
      societyId: societyA._id,
      role: "resident",
      status: "Pending",
      wing: "A",
      flatNumber: "101",
    });

    const tokenPending = generateAccessToken({
      userId: pendingUser._id,
      email: pendingUser.email,
      role: "resident",
      societyId: societyA._id,
    });

    // Try accessing protected complaints
    const compRes = await request(app)
      .get("/api/v1/complaints")
      .set("Authorization", `Bearer ${tokenPending}`)
      .set("X-Society-Id", societyA._id.toString());

    expect(compRes.status).toBe(403);
    expect(compRes.body.message).toMatch(/pending approval/i);
  });

  // TEST 12: Secretary Approval Workflow & Flat Occupancy
  test("12. Secretary approving membership request updates status to Active and marks Flat Occupied", async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const applicant = await User.create({
      name: "Applicant Resident",
      email: "applicant@test.com",
      passwordHash,
      role: "resident",
      status: "Active",
      societyId: societyA._id,
      wing: "A",
      flatNumber: "101",
    });

    const membership = await SocietyMembership.create({
      userId: applicant._id,
      societyId: societyA._id,
      role: "resident",
      residentType: "Owner",
      flatId: flatA1._id,
      wing: "A",
      flatNumber: "101",
      status: "Pending",
    });

    // Secretary approves
    const approveRes = await request(app)
      .patch(`/api/v1/membership-requests/${membership._id}/approve`)
      .set("Authorization", `Bearer ${tokenSecretaryA}`)
      .set("X-Society-Id", societyA._id.toString());

    expect(approveRes.status).toBe(200);

    // Verify membership is now Active
    const updatedMem = await SocietyMembership.findById(membership._id);
    expect(updatedMem.status).toBe("Active");

    // Verify Flat is now Occupied and residentId is attached
    const flat = await Flat.findById(flatA1._id);
    expect(flat.occupancyStatus).toBe("Occupied");
    expect(flat.residentIds.map((id) => id.toString())).toContain(applicant._id.toString());

    // Verify DB Notification was persisted
    const notif = await Notification.findOne({
      recipientId: applicant._id,
      type: "membership",
    });
    expect(notif).toBeDefined();
    expect(notif.title).toMatch(/Approved/i);

    // Verify AuditLog record
    const audit = await AuditLog.findOne({
      action: "MEMBERSHIP_APPROVED",
      targetId: membership._id.toString(),
    });
    expect(audit).toBeDefined();
  });

  // TEST 13: Multiple residents in one flat & partial departure consistency
  test("13. Multiple residents in one flat; removing one resident preserves Occupied state if others remain", async () => {
    const user1 = await User.create({
      name: "Owner 1",
      email: "owner1@test.com",
      passwordHash: "hash",
      role: "resident",
      status: "Active",
    });

    const user2 = await User.create({
      name: "Tenant 2",
      email: "tenant2@test.com",
      passwordHash: "hash",
      role: "resident",
      status: "Active",
    });

    // Attach both users to Flat A-101
    flatA1.residentIds = [user1._id, user2._id];
    flatA1.occupancyStatus = "Occupied";
    flatA1.totalResidents = 2;
    await flatA1.save();

    const mem2 = await SocietyMembership.create({
      userId: user2._id,
      societyId: societyA._id,
      role: "resident",
      flatId: flatA1._id,
      status: "Active",
    });

    // Reject or remove Tenant 2
    const rejectRes = await request(app)
      .patch(`/api/v1/membership-requests/${mem2._id}/reject`)
      .set("Authorization", `Bearer ${tokenSecretaryA}`)
      .set("X-Society-Id", societyA._id.toString())
      .send({ reason: "Lease expired" });

    expect(rejectRes.status).toBe(200);

    // Flat should STILL be Occupied because user1 is still a resident!
    const updatedFlat = await Flat.findById(flatA1._id);
    expect(updatedFlat.residentIds.length).toBe(1);
    expect(updatedFlat.occupancyStatus).toBe("Occupied");
  });

  // TEST 14: Privacy-safe public flats endpoint does not leak owner info
  test("14. Public flats endpoint strictly strips owner details, phones, and emails", async () => {
    // Populate sensitive flat data
    flatA1.ownerName = "Secret Owner";
    flatA1.ownerPhone = "9999999999";
    flatA1.ownerEmail = "secret@private.com";
    flatA1.intercomNumber = "1019";
    await flatA1.save();

    const res = await request(app).get(`/api/v1/societies/${societyA._id}/flats`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const firstFlat = res.body.data[0];
    expect(firstFlat.wing).toBe("A");
    expect(firstFlat.flatNumber).toBe("101");
    expect(firstFlat.occupancyStatus).toBeDefined();

    // Sensitive fields must be completely undefined in public projection
    expect(firstFlat.ownerName).toBeUndefined();
    expect(firstFlat.ownerPhone).toBeUndefined();
    expect(firstFlat.ownerEmail).toBeUndefined();
    expect(firstFlat.intercomNumber).toBeUndefined();
    expect(firstFlat.residentIds).toBeUndefined();
  });

  // TEST 15: Security guard registration creates linked Staff record
  test("15. Security guard registration creates linked User, SocietyMembership and Staff records", async () => {
    const res = await request(app).post("/api/v1/auth/register/guard").send({
      name: "Ramesh Guard",
      email: "ramesh@guard.com",
      phone: "9876543230",
      password: "password123",
      societyId: societyA._id.toString(),
      staffId: "SEC-G-101",
      shift: "Morning",
    });

    expect(res.status).toBe(201);

    // Verify linked Staff record
    const staff = await Staff.findOne({
      societyId: societyA._id,
      staffId: "SEC-G-101",
    });
    expect(staff).toBeDefined();
    expect(staff.name).toBe("Ramesh Guard");
    expect(staff.role).toBe("Security Guard");
  });

  // TEST 16: Duplicate staffId in same society rejected
  test("16. Duplicate guard staff ID in the same society is rejected with 409 Conflict", async () => {
    await request(app).post("/api/v1/auth/register/guard").send({
      name: "Guard One",
      email: "guard1@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      staffId: "SEC-DUP-01",
    });

    const res2 = await request(app).post("/api/v1/auth/register/guard").send({
      name: "Guard Two",
      email: "guard2@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
      staffId: "SEC-DUP-01",
    });

    expect(res2.status).toBe(409);
    expect(res2.body.message).toMatch(/already assigned/i);
  });

  // TEST 17: Atomic Society Onboarding with Flats & Creator Secretary
  test("17. Atomic society onboarding creates Society, generated Flats, Creator User, and active Secretary session", async () => {
    const res = await request(app).post("/api/v1/societies/register").send({
      name: "Silver Oaks Society",
      registrationNumber: "SOC-SO-999",
      address: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400050",
      creatorName: "Vikram Malhotra",
      creatorEmail: "vikram@silveroaks.com",
      creatorPhone: "9876543299",
      creatorPassword: "password123",
      wings: [
        { name: "A", floors: 2, flatsPerFloor: 2 },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.society).toBeDefined();
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe("secretary");

    const newSocietyId = res.body.data.society.id;

    // Generated Flats check (2 floors * 2 flats = 4 flats)
    const generatedFlats = await Flat.find({ societyId: newSocietyId });
    expect(generatedFlats.length).toBe(4);
    expect(generatedFlats.map((f) => f.flatNumber)).toEqual(
      expect.arrayContaining(["A-101", "A-102", "A-201", "A-202"])
    );

    // Creator membership check
    const membership = await SocietyMembership.findOne({
      societyId: newSocietyId,
      role: "secretary",
    });
    expect(membership).toBeDefined();
    expect(membership.status).toBe("Active");
  });

  // TEST 18: Duplicate society registration number rejected with 409
  test("18. Registering society with duplicate registration number rejected with 409 Conflict", async () => {
    const res = await request(app).post("/api/v1/societies/register").send({
      name: "Another Society",
      registrationNumber: "SOC-HH-001", // Duplicate of societyA
      address: "Some address",
      city: "Pune",
      state: "MH",
      pinCode: "411001",
      creatorName: "Test Sec",
      creatorEmail: "test@sec.com",
      creatorPassword: "password123",
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // TEST 19: Switching active society updates context and issues new token
  test("19. User belonging to multiple societies can switch active society context", async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const multiUser = await User.create({
      name: "Multi Society User",
      email: "multi@test.com",
      passwordHash,
      role: "resident",
      status: "Active",
      societyId: societyA._id,
    });

    await SocietyMembership.create([
      { userId: multiUser._id, societyId: societyA._id, role: "resident", status: "Active", isDefault: true },
      { userId: multiUser._id, societyId: societyB._id, role: "resident", status: "Active", isDefault: false },
    ]);

    const tokenA = generateAccessToken({
      userId: multiUser._id,
      email: multiUser.email,
      role: "resident",
      societyId: societyA._id,
    });

    const switchRes = await request(app)
      .post("/api/v1/auth/switch-society")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ societyId: societyB._id.toString() });

    expect(switchRes.status).toBe(200);
    expect(switchRes.body.success).toBe(true);
    expect(switchRes.body.data.token).toBeDefined();
    expect(switchRes.body.data.society.name).toBe("Green Valley Residency");
  });

  // TEST 20: Rejected applicant login informs user and denies protected access
  test("20. Rejected applicant can log in to check status, but receives 403 on society protected endpoints", async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const rejectedUser = await User.create({
      name: "Rejected Applicant",
      email: "rejected@test.com",
      passwordHash,
      role: "resident",
      status: "Active",
    });

    await SocietyMembership.create({
      userId: rejectedUser._id,
      societyId: societyA._id,
      role: "resident",
      status: "Rejected",
      approvalNotes: "Did not submit registered sale agreement",
    });

    // Login response provides status
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "rejected@test.com",
      password: "password123",
      societyId: societyA._id.toString(),
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.membershipStatus).toBe("Rejected");

    // But calling protected complaints is blocked
    const token = loginRes.body.data.token;
    const compRes = await request(app)
      .get("/api/v1/complaints")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Society-Id", societyA._id.toString());

    expect(compRes.status).toBe(403);
    expect(compRes.body.message).toMatch(/rejected/i);
  });
});
