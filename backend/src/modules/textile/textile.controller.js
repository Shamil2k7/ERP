import * as textileService from "./textile.service.js";

const getEffectiveCompanyId = (req) => {
  return (
    req.headers["x-company-override"] ||
    req.companyId ||
    req.user?.companyId ||
    req.user?.company?.id ||
    "default_company"
  );
};

// GET /api/textile/dashboard
export const getTextileDashboard = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const dashboardData = await textileService.getTextileDashboard(companyId);
    return res.status(200).json({
      success: true,
      message: "Textile dashboard statistics retrieved successfully",
      data: dashboardData,
    });
  } catch (err) {
    console.error("Textile dashboard controller error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve textile dashboard statistics",
    });
  }
};

// GET /api/textile/production/overview
export const getProductionOverview = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const overview = await textileService.getProductionOverview(companyId, req.user);
    return res.status(200).json({
      success: true,
      message: "Production overview retrieved successfully",
      data: overview,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve production overview",
    });
  }
};

// Production Plans
export const getProductionPlans = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const plans = await textileService.getProductionPlans(companyId, req.query);
    return res.status(200).json({ success: true, data: plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createProductionPlan = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const plan = await textileService.createProductionPlan(companyId, req.body);
    return res.status(201).json({ success: true, message: "Production plan created successfully", data: plan });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const approveProductionPlan = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const result = await textileService.approveProductionPlan(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Production plan approved and batch scheduled", data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Production Batches & Orders
export const getProductionBatches = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const batches = await textileService.getProductionBatches(companyId, req.query, req.user);
    return res.status(200).json({ success: true, data: batches });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createProductionBatch = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const batch = await textileService.createProductionBatch(companyId, req.body);
    return res.status(201).json({ success: true, message: "Production batch scheduled successfully", data: batch });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateProductionBatch = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const batch = await textileService.updateProductionBatch(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Production batch updated successfully", data: batch });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const advanceProductionStage = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const batch = await textileService.advanceProductionStage(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Production batch advanced to next stage", data: batch });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteProductionBatch = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    await textileService.deleteProductionBatch(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Production batch deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Material Consumption
export const getMaterialConsumption = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const consumptions = await textileService.getMaterialConsumption(companyId, req.query);
    return res.status(200).json({ success: true, data: consumptions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const recordMaterialConsumption = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const consumption = await textileService.recordMaterialConsumption(companyId, req.body);
    return res.status(201).json({ success: true, message: "Material consumption recorded successfully", data: consumption });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Raw Materials
export const getRawMaterials = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const materials = await textileService.getRawMaterials(companyId, req.query);
    return res.status(200).json({ success: true, data: materials });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createRawMaterial = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const material = await textileService.createRawMaterial(companyId, req.body);
    return res.status(201).json({ success: true, message: "Raw material created successfully", data: material });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateRawMaterial = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const material = await textileService.updateRawMaterial(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Raw material updated successfully", data: material });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteRawMaterial = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    await textileService.deleteRawMaterial(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Raw material deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Quality Control
export const getQualityInspections = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const inspections = await textileService.getQualityInspections(companyId, req.query);
    return res.status(200).json({ success: true, data: inspections });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createQualityInspection = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const inspection = await textileService.createQualityInspection(companyId, req.body);
    return res.status(201).json({ success: true, message: "Quality inspection created successfully", data: inspection });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteQualityInspection = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    await textileService.deleteQualityInspection(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Quality inspection deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Stock Movements
export const getStockMovements = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const movements = await textileService.getStockMovements(companyId, req.query);
    return res.status(200).json({ success: true, data: movements });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getStockMovementsSummary = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const summary = await textileService.getStockMovementsSummary(companyId, req.query);
    return res.status(200).json({ success: true, data: summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getStockMovementById = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const movement = await textileService.getStockMovementById(companyId, req.params.id);
    return res.status(200).json({ success: true, data: movement });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const getStockMovementsFilters = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const filters = await textileService.getStockMovementsFilters(companyId);
    return res.status(200).json({ success: true, data: filters });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createStockMovement = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const movement = await textileService.createStockMovement(companyId, req.body);
    return res.status(201).json({ success: true, message: "Stock movement recorded successfully", data: movement });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Textile Products
export const getTextileProducts = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const products = await textileService.getTextileProducts(companyId, req.query);
    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTextileProductById = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const product = await textileService.getTextileProductById(companyId, req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Textile product not found" });
    }
    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createTextileProduct = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const product = await textileService.createTextileProduct(companyId, req.body);
    return res.status(201).json({ success: true, message: "Textile product created successfully", data: product });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateTextileProduct = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const product = await textileService.updateTextileProduct(companyId, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Textile product updated successfully", data: product });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteTextileProduct = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    await textileService.deleteTextileProduct(companyId, req.params.id);
    return res.status(200).json({ success: true, message: "Textile product deleted successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// Textile Customers Controller
export const getTextileCustomers = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const customers = await textileService.getTextileCustomers(companyId, req.query);
    return res.status(200).json({
      success: true,
      message: "Textile customers retrieved successfully",
      count: customers.length,
      data: customers,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTextileCustomerById = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const customer = await textileService.getTextileCustomerById(companyId, req.params.id);
    return res.status(200).json({ success: true, data: customer });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const createTextileCustomer = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const customer = await textileService.createTextileCustomer(companyId, req.body);
    return res.status(201).json({
      success: true,
      message: "Textile customer created successfully",
      data: customer,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateTextileCustomer = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const customer = await textileService.updateTextileCustomer(companyId, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Textile customer updated successfully",
      data: customer,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteTextileCustomer = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const result = await textileService.deleteTextileCustomer(companyId, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Textile customer deleted successfully",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ==========================================
// Textile Employees & Staff Controller
// ==========================================
export const getTextileEmployees = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const employees = await textileService.getTextileEmployees(companyId, req.query);
    return res.status(200).json({
      success: true,
      message: "Textile employees retrieved successfully",
      count: employees.length,
      data: employees,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTextileEmployeeById = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const employee = await textileService.getTextileEmployeeById(companyId, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Textile employee retrieved successfully",
      data: employee,
    });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const createTextileEmployee = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const employee = await textileService.createTextileEmployee(companyId, req.body);
    return res.status(201).json({
      success: true,
      message: "Textile employee created successfully",
      data: employee,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateTextileEmployee = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const employee = await textileService.updateTextileEmployee(companyId, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Textile employee updated successfully",
      data: employee,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteTextileEmployee = async (req, res) => {
  try {
    const companyId = getEffectiveCompanyId(req);
    const result = await textileService.deleteTextileEmployee(companyId, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Textile employee deleted successfully",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};


