import express from "express";
import {
  getGymMembersController,
  getGymMemberByIdController,
  createGymMemberController,
  updateGymMemberController,
  deleteGymMemberController,
  getGymPlansController,
  createGymPlanController,
  updateGymPlanController,
  deleteGymPlanController,
  getGymTrainersController,
  createGymTrainerController,
  updateGymTrainerController,
  deleteGymTrainerController,
  getGymAttendanceController,
  recordAttendanceController,
  updateAttendanceController,
  getGymPaymentsController,
  createGymPaymentController,
  getGymDashboardStatsController,
} from "./gym.controller.js";

import {
  createGymMemberValidation,
  updateGymMemberValidation,
} from "./gym.validation.js";
import validateRequest from "../../middlewares/validateRequest.js";

import { requireModuleAccess } from "../../middlewares/moduleAccess.middleware.js";

const router = express.Router();

// Dashboard Stats
router.get("/dashboard/stats", requireModuleAccess("DASHBOARD"), getGymDashboardStatsController);

// Members
router.get("/members", requireModuleAccess("MEMBERS"), getGymMembersController);
router.get("/members/:id", requireModuleAccess("MEMBERS"), getGymMemberByIdController);
router.post("/members", requireModuleAccess("MEMBERS"), createGymMemberValidation, validateRequest, createGymMemberController);
router.put("/members/:id", requireModuleAccess("MEMBERS"), updateGymMemberValidation, validateRequest, updateGymMemberController);
router.delete("/members/:id", requireModuleAccess("MEMBERS"), deleteGymMemberController);

// Membership Plans
router.get("/plans", requireModuleAccess("MEMBERSHIP_PLANS"), getGymPlansController);
router.post("/plans", requireModuleAccess("MEMBERSHIP_PLANS"), createGymPlanController);
router.put("/plans/:id", requireModuleAccess("MEMBERSHIP_PLANS"), updateGymPlanController);
router.delete("/plans/:id", requireModuleAccess("MEMBERSHIP_PLANS"), deleteGymPlanController);

// Trainers
router.get("/trainers", requireModuleAccess("TRAINERS"), getGymTrainersController);
router.post("/trainers", requireModuleAccess("TRAINERS"), createGymTrainerController);
router.put("/trainers/:id", requireModuleAccess("TRAINERS"), updateGymTrainerController);
router.delete("/trainers/:id", requireModuleAccess("TRAINERS"), deleteGymTrainerController);

// Attendance
router.get("/attendance", requireModuleAccess("ATTENDANCE"), getGymAttendanceController);
router.post("/attendance", requireModuleAccess("ATTENDANCE"), recordAttendanceController);
router.put("/attendance/:id", requireModuleAccess("ATTENDANCE"), updateAttendanceController);

// Payments
router.get("/payments", requireModuleAccess("PAYMENTS"), getGymPaymentsController);
router.post("/payments", requireModuleAccess("PAYMENTS"), createGymPaymentController);

export default router;
