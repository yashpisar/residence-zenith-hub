import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import crypto from "crypto";
import { sendSuccess, sendError } from "../utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust upload directory resolution that works whether launched from root or backend
const defaultUploadDir = path.resolve(__dirname, "../../uploads");
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.UPLOAD_DIR)
  : defaultUploadDir;

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration with random UUID filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter (mime types)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only JPEG, PNG, WEBP, and PDF documents are allowed."), false);
  }
};

const maxFileSizeMB = Number(process.env.MAX_FILE_SIZE_MB) || 15;

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024,
  },
});

/**
 * Helper to safely save a data-URI (base64) image to disk and return the server URL path.
 * If already a URL or invalid, returns the input string unchanged.
 */
export function saveBase64Image(dataString) {
  if (!dataString || typeof dataString !== "string") return "";
  if (!dataString.startsWith("data:image/")) return dataString;

  try {
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataString;

    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];
    let ext = ".jpg";
    if (mimeType === "image/png") ext = ".png";
    else if (mimeType === "image/webp") ext = ".webp";
    else if (mimeType === "image/gif") ext = ".gif";

    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
    return `/api/v1/files/${uniqueName}`;
  } catch (err) {
    console.error("[saveBase64Image] Error saving image:", err);
    return dataString;
  }
}

export async function handleFileUpload(req, res, next) {
  try {
    if (req.file) {
      const fileUrl = `/api/v1/files/${req.file.filename}`;
      return sendSuccess(res, {
        fileUrl,
        fileName: req.file.originalname,
        storedName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      }, "File uploaded successfully", 201);
    }

    const base64Data = req.body?.base64 || req.body?.image;
    if (base64Data) {
      const fileUrl = saveBase64Image(base64Data);
      return sendSuccess(res, {
        fileUrl,
        fileName: req.body?.fileName || "captured_photo.jpg",
      }, "File uploaded successfully", 201);
    }

    return sendError(res, "No file uploaded.", 400);
  } catch (error) {
    next(error);
  }
}

export async function serveFile(req, res, next) {
  try {
    const { filename } = req.params;
    // Prevent path traversal
    const safeFilename = path.basename(filename);
    
    // Primary path
    let filePath = path.join(uploadDir, safeFilename);

    // Fallback checks across potential working directory variations
    if (!fs.existsSync(filePath)) {
      const fallbackCandidates = [
        path.resolve(__dirname, "../../uploads", safeFilename),
        path.resolve(process.cwd(), "uploads", safeFilename),
        path.resolve(process.cwd(), "backend", "uploads", safeFilename),
      ];
      for (const altPath of fallbackCandidates) {
        if (fs.existsSync(altPath)) {
          filePath = altPath;
          break;
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      return sendError(res, "File not found", 404);
    }

    // Set CORS & caching headers for images
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");

    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}
