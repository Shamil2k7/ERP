import * as textileRepo from "./textile.repository.js";
import { emitDashboardUpdate } from "../../config/socket.js";

// Main Dashboard
export const getTextileDashboard = async (companyId) => {
  return await textileRepo.getTextileDashboardRepo(companyId);
};

// Production Overview
export const getProductionOverview = async (companyId, user = null) => {
  return await textileRepo.getProductionOverviewRepo(companyId, user);
};

// Production Plans
export const getProductionPlans = async (companyId, query) => {
  return await textileRepo.getProductionPlansRepo(companyId, query);
};

export const createProductionPlan = async (companyId, data) => {
  const result = await textileRepo.createProductionPlanRepo(companyId, data);
  emitDashboardUpdate(companyId, "textile.production.updated", { action: "plan_created", id: result.id });
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "plan_created" });
  return result;
};

export const approveProductionPlan = async (companyId, id) => {
  const result = await textileRepo.approveProductionPlanRepo(companyId, id);
  emitDashboardUpdate(companyId, "textile.production.updated", { action: "plan_approved", id });
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "batch_created" });
  return result;
};

// Raw Materials
export const getRawMaterials = async (companyId, query) => {
  return await textileRepo.getRawMaterialsRepo(companyId, query);
};

export const createRawMaterial = async (companyId, data) => {
  const result = await textileRepo.createRawMaterialRepo(companyId, data);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "raw_material_created", id: result.id });
  return result;
};

export const updateRawMaterial = async (companyId, id, data) => {
  const result = await textileRepo.updateRawMaterialRepo(companyId, id, data);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "raw_material_updated", id });
  return result;
};

export const deleteRawMaterial = async (companyId, id) => {
  const result = await textileRepo.deleteRawMaterialRepo(companyId, id);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "raw_material_deleted", id });
  return result;
};

// Production Batches & Orders
export const getProductionBatches = async (companyId, query, user = null) => {
  return await textileRepo.getProductionBatchesRepo(companyId, query, user);
};

export const createProductionBatch = async (companyId, data) => {
  const result = await textileRepo.createProductionBatchRepo(companyId, data);
  emitDashboardUpdate(companyId, "textile.production.updated", { action: "batch_created", id: result.id });
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "batch_created", id: result.id });
  return result;
};

export const updateProductionBatch = async (companyId, id, data) => {
  const result = await textileRepo.updateProductionBatchRepo(companyId, id, data);
  emitDashboardUpdate(companyId, "textile.production.updated", { action: "batch_updated", id });
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "batch_updated", id });
  return result;
};

export const advanceProductionStage = async (companyId, id, data) => {
  const result = await textileRepo.updateProductionBatchRepo(companyId, id, { ...data, advanceStage: true });
  emitDashboardUpdate(companyId, "textile.production.updated", { action: "stage_advanced", id });
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "stage_advanced", id });
  return result;
};

export const deleteProductionBatch = async (companyId, id) => {
  const result = await textileRepo.deleteProductionBatchRepo(companyId, id);
  emitDashboardUpdate(companyId, "textile.production.updated", { action: "batch_deleted", id });
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "batch_deleted", id });
  return result;
};

// Material Consumption
export const getMaterialConsumption = async (companyId, query) => {
  return await textileRepo.getMaterialConsumptionRepo(companyId, query);
};

export const recordMaterialConsumption = async (companyId, data) => {
  const result = await textileRepo.recordMaterialConsumptionRepo(companyId, data);
  emitDashboardUpdate(companyId, "textile.production.updated", { action: "material_consumed", id: result.id });
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "material_consumed" });
  return result;
};

// Quality Control
export const getQualityInspections = async (companyId, query) => {
  return await textileRepo.getQualityInspectionsRepo(companyId, query);
};

export const createQualityInspection = async (companyId, data) => {
  const result = await textileRepo.createQualityInspectionRepo(companyId, data);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "qc_created", id: result.id });
  return result;
};

export const deleteQualityInspection = async (companyId, id) => {
  const result = await textileRepo.deleteQualityInspectionRepo(companyId, id);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "qc_deleted", id });
  return result;
};

// Stock Movements
export const getStockMovements = async (companyId, query) => {
  return await textileRepo.getStockMovementsRepo(companyId, query);
};

export const getStockMovementsSummary = async (companyId, query) => {
  return await textileRepo.getStockMovementsSummaryRepo(companyId, query);
};

export const getStockMovementById = async (companyId, id) => {
  return await textileRepo.getStockMovementByIdRepo(companyId, id);
};

export const getStockMovementsFilters = async (companyId) => {
  return await textileRepo.getStockMovementsFiltersRepo(companyId);
};

export const createStockMovement = async (companyId, data) => {
  const result = await textileRepo.createStockMovementRepo(companyId, data);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "stock_movement_created", id: result.id });
  return result;
};

// Textile Products
export const getTextileProducts = async (companyId, query) => {
  return await textileRepo.getTextileProductsRepo(companyId, query);
};

export const getTextileProductById = async (companyId, id) => {
  return await textileRepo.getTextileProductByIdRepo(companyId, id);
};

export const createTextileProduct = async (companyId, data) => {
  const result = await textileRepo.createTextileProductRepo({ ...data, companyId });
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "product_created", id: result.id });
  return result;
};

export const updateTextileProduct = async (companyId, id, data) => {
  const result = await textileRepo.updateTextileProductRepo(companyId, id, data);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "product_updated", id });
  return result;
};

export const deleteTextileProduct = async (companyId, id) => {
  const result = await textileRepo.deleteTextileProductRepo(companyId, id);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "product_deleted", id });
  return result;
};

// Textile Customers
export const getTextileCustomers = async (companyId, query) => {
  return await textileRepo.getTextileCustomersRepo(companyId, query);
};

export const getTextileCustomerById = async (companyId, id) => {
  return await textileRepo.getTextileCustomerByIdRepo(companyId, id);
};

export const createTextileCustomer = async (companyId, data) => {
  const result = await textileRepo.createTextileCustomerRepo(companyId, data);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "customer_created", id: result.id });
  return result;
};

export const updateTextileCustomer = async (companyId, id, data) => {
  const result = await textileRepo.updateTextileCustomerRepo(companyId, id, data);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "customer_updated", id });
  return result;
};

export const deleteTextileCustomer = async (companyId, id) => {
  const result = await textileRepo.deleteTextileCustomerRepo(companyId, id);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "customer_deleted", id });
  return result;
};

// ==========================================
// Textile Employees & Staff Service
// ==========================================
export const getTextileEmployees = async (companyId, query) => {
  return await textileRepo.getTextileEmployeesRepo(companyId, query);
};

export const getTextileEmployeeById = async (companyId, id) => {
  return await textileRepo.getTextileEmployeeByIdRepo(companyId, id);
};

export const createTextileEmployee = async (companyId, data) => {
  const result = await textileRepo.createTextileEmployeeRepo(companyId, data);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "employee_created", id: result.id });
  return result;
};

export const updateTextileEmployee = async (companyId, id, data) => {
  const result = await textileRepo.updateTextileEmployeeRepo(companyId, id, data);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "employee_updated", id });
  return result;
};

export const deleteTextileEmployee = async (companyId, id) => {
  const result = await textileRepo.deleteTextileEmployeeRepo(companyId, id);
  emitDashboardUpdate(companyId, "textile.dashboard.updated", { action: "employee_deleted", id });
  return result;
};


