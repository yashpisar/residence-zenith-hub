import jwt from "jsonwebtoken";
import crypto from "crypto";

export function generateAccessToken(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || "harmony_jwt_access_secret_key_change_in_production_89412",
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );
}

export function generateRefreshTokenPayload() {
  const rawToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

export function hashString(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

export function verifyAccessToken(token) {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET || "harmony_jwt_access_secret_key_change_in_production_89412"
  );
}
