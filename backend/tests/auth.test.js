import { jest } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import { User, Society, SocietyMembership, RefreshToken } from "../src/models/index.js";

jest.setTimeout(35000);

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

describe("Authentication & Account Lifecycle Tests", () => {
  let society;

  beforeEach(async () => {
    society = await Society.create({
      name: "Harmony Heights",
      registrationNumber: "SOC-PUN-001",
      address: "412 Link Road",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411057",
      secretaryName: "Rahul Patil",
      secretaryMobile: "9876543210",
      secretaryEmail: "rahul@harmony.com",
    });
  });

  test("should login successfully with valid credentials and return JWT & rotating refresh token", async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const user = await User.create({
      name: "Ananya Rao",
      email: "resident@test.com",
      passwordHash,
      role: "resident",
      status: "Active",
      societyId: society._id,
    });

    await SocietyMembership.create({
      userId: user._id,
      societyId: society._id,
      role: "resident",
      isDefault: true,
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "resident@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe("resident@test.com");
  });

  test("should reject login with invalid password (401)", async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    await User.create({
      name: "Ananya Rao",
      email: "resident@test.com",
      passwordHash,
      role: "resident",
      status: "Active",
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "resident@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("should reject login for inactive or suspended users (403)", async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    await User.create({
      name: "Suspended Resident",
      email: "suspended@test.com",
      passwordHash,
      role: "resident",
      status: "Suspended",
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "suspended@test.com", password: "password123" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("suspended");
  });

  test("should rotate refresh tokens and detect token reuse attacks", async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const user = await User.create({
      name: "Security Guard",
      email: "guard@test.com",
      passwordHash,
      role: "security",
      status: "Active",
      societyId: society._id,
    });

    await SocietyMembership.create({
      userId: user._id,
      societyId: society._id,
      role: "security",
      isDefault: true,
    });

    // Initial Login
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "guard@test.com", password: "password123" });

    const initialRefreshToken = loginRes.body.data.refreshToken;

    // First refresh: should succeed and rotate token
    const refreshRes1 = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: initialRefreshToken });

    expect(refreshRes1.status).toBe(200);
    expect(refreshRes1.body.data.token).toBeDefined();
    const rotatedRefreshToken = refreshRes1.body.data.refreshToken;
    expect(rotatedRefreshToken).not.toBe(initialRefreshToken);

    // Reuse attack: Re-using the old initialRefreshToken should be detected as reuse and fail!
    const reuseRes = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: initialRefreshToken });

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.message).toContain("reuse detected");
  });

  test("should restore session profile and active society context via GET /auth/me", async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const user = await User.create({
      name: "Secretary Rahul",
      email: "sec@harmony.com",
      passwordHash,
      role: "secretary",
      status: "Active",
      societyId: society._id,
    });

    await SocietyMembership.create({
      userId: user._id,
      societyId: society._id,
      role: "secretary",
      status: "Active",
      isDefault: true,
    });

    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "sec@harmony.com", password: "password123" });

    const token = loginRes.body.data.token;
    expect(token).toBeDefined();

    // Verify session restoration on startup / page refresh
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .set("X-Society-Id", society._id.toString());

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.id).toBe(user._id.toString());
    expect(meRes.body.data.user.role).toBe("secretary");
    expect(meRes.body.data.user.societyId).toBe(society._id.toString());
    expect(meRes.body.data.user.societyName).toBe("Harmony Heights");
    expect(meRes.body.data.user.membershipStatus).toBe("Active");
  });

  test("should reject /auth/me when token is missing (401)", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
