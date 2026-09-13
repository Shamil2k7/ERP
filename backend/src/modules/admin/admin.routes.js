import express from "express";

import {
  createAdminController,
  getAllAdminsController,
  getAdminByIdController,
  deleteAdminController,
} from "./admin.controller.js";

import {
  attachUserIfAuthenticated,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Create Admin
router.post(
  "/",
  attachUserIfAuthenticated,
  createAdminController
);

// Get All Admins
router.get(
  "/",
  attachUserIfAuthenticated,
  getAllAdminsController
);

// Get Admin By ID
router.get(
  "/:id",
  attachUserIfAuthenticated,
  getAdminByIdController
);

// Delete Admin
router.delete(
  "/:id",
  attachUserIfAuthenticated,
  deleteAdminController
);

export default router;