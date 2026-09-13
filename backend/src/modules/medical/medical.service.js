import * as medicalRepository from "./medical.repository.js";

// ==========================================
// MEDICINES SERVICE
// ==========================================

export const createMedicineService = async (companyId, data) => {
  if (!companyId) throw new Error("Company ID is required");
  return await medicalRepository.createMedicineRepo(companyId, data);
};

export const getMedicinesService = async (companyId, query) => {
  return await medicalRepository.getMedicinesRepo(companyId, query);
};

export const getMedicineByIdService = async (companyId, id) => {
  const medicine = await medicalRepository.getMedicineByIdRepo(companyId, id);
  if (!medicine) throw new Error("Medicine not found");
  return medicine;
};

export const updateMedicineService = async (companyId, id, data) => {
  return await medicalRepository.updateMedicineRepo(companyId, id, data);
};

export const deleteMedicineService = async (companyId, id) => {
  return await medicalRepository.deleteMedicineRepo(companyId, id);
};

// ==========================================
// MEDICINE BATCHES SERVICE
// ==========================================

export const createBatchService = async (data) => {
  return await medicalRepository.createBatchRepo(data);
};

export const getBatchesService = async (companyId, query) => {
  return await medicalRepository.getBatchesRepo(companyId, query);
};

export const getBatchByIdService = async (id) => {
  const batch = await medicalRepository.getBatchByIdRepo(id);
  if (!batch) throw new Error("Medicine batch not found");
  return batch;
};

export const updateBatchService = async (id, data) => {
  return await medicalRepository.updateBatchRepo(id, data);
};

export const deleteBatchService = async (id) => {
  return await medicalRepository.deleteBatchRepo(id);
};

// ==========================================
// BATCH STOCK DEDUCTION (FEFO)
// ==========================================

export const deductStockFEFOService = async (companyId, warehouseId, payload) => {
  const { productId, quantity, referenceNo, remarks } = payload;
  return await medicalRepository.deductBatchStockFEFO(
    companyId,
    warehouseId,
    productId,
    parseInt(quantity),
    referenceNo,
    remarks
  );
};

// ==========================================
// PRESCRIPTIONS SERVICE
// ==========================================

export const createPrescriptionService = async (companyId, payload) => {
  const { customerId, doctorName, prescriptionNumber, notes, items } = payload;
  const data = { customerId, doctorName, prescriptionNumber, notes };
  return await medicalRepository.createPrescriptionRepo(companyId, data, items);
};

export const getPrescriptionsService = async (companyId, query) => {
  return await medicalRepository.getPrescriptionsRepo(companyId, query);
};

export const getPrescriptionByIdService = async (id) => {
  const prescription = await medicalRepository.getPrescriptionByIdRepo(id);
  if (!prescription) throw new Error("Prescription not found");
  return prescription;
};

// ==========================================
// MEDICAL STATS & ALERTS SERVICE
// ==========================================

export const getMedicalDashboardStatsService = async (companyId) => {
  return await medicalRepository.getMedicalDashboardStatsRepo(companyId);
};

export const getMedicalReportsService = async (companyId) => {
  return await medicalRepository.getMedicalReportsRepo(companyId);
};
