import express from "express";
import upload from "./landing.upload.js";

import {
  getLandingPage,
  updateLandingPage,
} from "./landing.controller.js";

const router = express.Router();

// GET landing page
router.get("/", getLandingPage);

// UPDATE landing page
router.put(
  "/",
 upload.fields([
  { name: "heroImage", maxCount: 1 },
  { name: "heroBackgroundImage", maxCount: 1 },
  { name: "aboutImage1", maxCount: 1 },
  { name: "aboutImage2", maxCount: 1 },
  { name: "aboutImage3", maxCount: 1 },
  { name: "aboutImage4", maxCount: 1 },
]),
  updateLandingPage
);

export default router;