import express from "express";
import { upload, handleFileUpload, serveFile } from "../controllers/fileController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Upload requires authentication
router.post("/upload", authenticateToken, upload.single("file"), handleFileUpload);

// Serve files
router.get("/:filename", serveFile);

export default router;
