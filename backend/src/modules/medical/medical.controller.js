import prisma from "../../config/prisma.js";
import * as medicalService from "./medical.service.js";
import { validatePhoneNumber, cleanPhoneNumber } from "../../utils/phoneValidator.js";


// ==========================================
// MEDICAL SHOPS (BRANCH OVERRIDES) CONTROLLER
// ==========================================

export const getMedicalShopsController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const shops = await prisma.branch.findMany({
      where: {
        companyId,
        type: "MEDICAL_SHOP"
      }
    });
    return res.status(200).json({ success: true, data: shops });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createMedicalShopController = async (req, res) => {
  try {

    const companyId = req.user?.companyId;
    let phone = null;
    if (req.body.phone) {
      phone = cleanPhoneNumber(req.body.phone);
      if (!validatePhoneNumber(phone, true)) {
        return res.status(400).json({ success: false, message: "Phone number must contain exactly 10 digits" });
      }
    }

    const shop = await prisma.branch.create({
      data: {
        companyId,
        name: req.body.name,
        code: req.body.code || `MED-${Date.now().toString().slice(-4)}`,
        address: req.body.address || null,
        city: req.body.city || null,
        state: req.body.state || null,
        phone,
        email: req.body.email || null,
        type: "MEDICAL_SHOP",
        isActive: true
      }
    });
    return res.status(201).json({ success: true, message: "Medical shop branch created successfully", data: shop });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};


// ==========================================
// MEDICINES CONTROLLER
// ==========================================

export const createMedicineController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const medicine = await medicalService.createMedicineService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Medicine profile registered successfully", data: medicine });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getMedicinesController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const medicines = await medicalService.getMedicinesService(companyId, req.query);
    return res.status(200).json({ success: true, data: medicines });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getMedicineByIdController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const medicine = await medicalService.getMedicineByIdService(companyId, req.params.id);
    return res.status(200).json({ success: true, data: medicine });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const updateMedicineController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const medicine = await medicalService.updateMedicineService(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Medicine profile updated successfully", data: medicine });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteMedicineController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    await medicalService.deleteMedicineService(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Medicine profile deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// MEDICINE BATCHES CONTROLLER
// ==========================================

export const createBatchController = async (req, res) => {
  try {
    const batch = await medicalService.createBatchService(req.body);
    return res.status(201).json({ success: true, message: "Medicine stock batch created successfully", data: batch });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getBatchesController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const batches = await medicalService.getBatchesService(companyId, req.query);
    return res.status(200).json({ success: true, data: batches });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getBatchByIdController = async (req, res) => {
  try {
    const batch = await medicalService.getBatchByIdService(req.params.id);
    return res.status(200).json({ success: true, data: batch });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const updateBatchController = async (req, res) => {
  try {
    const batch = await medicalService.updateBatchService(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Medicine batch updated successfully", data: batch });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteBatchController = async (req, res) => {
  try {
    await medicalService.deleteBatchService(req.params.id);
    return res.status(200).json({ success: true, message: "Medicine batch deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// POS BATCH STOCK DEDUCTION (FEFO) CONTROLLER
// ==========================================

export const deductStockFEFOController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const warehouseId = req.body.warehouseId || req.user?.branchId; // fallback
    if (!warehouseId) throw new Error("Warehouse ID/Branch ID is required");

    const result = await medicalService.deductStockFEFOService(companyId, warehouseId, req.body);
    return res.status(200).json({ success: true, message: "Stock deducted successfully using FEFO", data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// PRESCRIPTIONS CONTROLLER
// ==========================================

export const createPrescriptionController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const prescription = await medicalService.createPrescriptionService(companyId, req.body);
    return res.status(201).json({ success: true, message: "Prescription registered successfully", data: prescription });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getPrescriptionsController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const prescriptions = await medicalService.getPrescriptionsService(companyId, req.query);
    return res.status(200).json({ success: true, data: prescriptions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getPrescriptionByIdController = async (req, res) => {
  try {
    const prescription = await medicalService.getPrescriptionByIdService(req.params.id);
    return res.status(200).json({ success: true, data: prescription });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

// ==========================================
// MEDICAL DASHBOARD STATS CONTROLLER
// ==========================================

export const getMedicalDashboardStatsController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const stats = await medicalService.getMedicalDashboardStatsService(companyId);
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getMedicalReportsController = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const reports = await medicalService.getMedicalReportsService(companyId);
    return res.status(200).json({ success: true, data: reports });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
