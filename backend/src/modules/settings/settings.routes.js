import express from "express";
import { requireRoles } from "../../middlewares/auth.middleware.js";
import * as controller from "./settings.controller.js";
import upload from "../../middlewares/upload.middleware.js";
import { validateSettingsInput } from "./settings.validation.js";

const router = express.Router();

// Get settings
router.get("/", controller.getSettings);

// Update settings (supports both JSON body or FormData with logo file)
router.put("/", requireRoles(["ADMIN", "OWNER"]), upload.single("companyLogo"), validateSettingsInput, controller.updateSettings);

// Separate endpoint for uploading company logo
router.post("/logo", requireRoles(["ADMIN", "OWNER"]), upload.single("companyLogo"), controller.uploadLogo);

// Reset settings to default
router.post("/reset", requireRoles(["ADMIN", "OWNER"]), controller.resetSettings);

export default router;

