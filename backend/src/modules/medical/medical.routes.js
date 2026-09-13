import { Router } from "express";
import * as medicalController from "./medical.controller.js";
import {
  createMedicineValidation,
  createBatchValidation,
  createPrescriptionValidation
} from "./medical.validation.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { requireModuleAccess } from "../../middlewares/moduleAccess.middleware.js";

const router = Router();

// Dashboard Stats
router.get("/dashboard/stats", requireModuleAccess("MEDICAL_SHOP"), medicalController.getMedicalDashboardStatsController);
router.get("/dashboard/reports", requireModuleAccess("MEDICAL_SHOP"), medicalController.getMedicalReportsController);

// Medical Shops (Branches of type MEDICAL_SHOP)
router.get("/shops", requireModuleAccess("MEDICAL_SHOP"), medicalController.getMedicalShopsController);
router.post("/shops", requireModuleAccess("MEDICAL_SHOP"), medicalController.createMedicalShopController);

// Medicines
router.post("/medicines", requireModuleAccess("MEDICAL_SHOP"), createMedicineValidation, validateRequest, medicalController.createMedicineController);
router.get("/medicines/list", requireModuleAccess("MEDICAL_SHOP"), medicalController.getMedicinesController);
router.get("/medicines/:id", requireModuleAccess("MEDICAL_SHOP"), medicalController.getMedicineByIdController);
router.put("/medicines/:id", requireModuleAccess("MEDICAL_SHOP"), createMedicineValidation, validateRequest, medicalController.updateMedicineController);
router.delete("/medicines/:id", requireModuleAccess("MEDICAL_SHOP"), medicalController.deleteMedicineController);

// Batches
router.post("/batches", requireModuleAccess("MEDICAL_SHOP"), createBatchValidation, validateRequest, medicalController.createBatchController);
router.get("/batches/list", requireModuleAccess("MEDICAL_SHOP"), medicalController.getBatchesController);
router.get("/batches/:id", requireModuleAccess("MEDICAL_SHOP"), medicalController.getBatchByIdController);
router.put("/batches/:id", requireModuleAccess("MEDICAL_SHOP"), createBatchValidation, validateRequest, medicalController.updateBatchController);
router.delete("/batches/:id", requireModuleAccess("MEDICAL_SHOP"), medicalController.deleteBatchController);

// POS Stock Deduction (FEFO)
router.post("/pos/deduct", requireModuleAccess("MEDICAL_SHOP"), medicalController.deductStockFEFOController);

// Prescriptions
router.post("/prescriptions", requireModuleAccess("MEDICAL_SHOP"), createPrescriptionValidation, validateRequest, medicalController.createPrescriptionController);
router.get("/prescriptions/list", requireModuleAccess("MEDICAL_SHOP"), medicalController.getPrescriptionsController);
router.get("/prescriptions/:id", requireModuleAccess("MEDICAL_SHOP"), medicalController.getPrescriptionByIdController);

export default router;
