import prisma from "../../config/prisma.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { normalizeTextileRole, TEXTILE_ROLE_ACCESS } from "../../config/textileRoles.js";
import { validatePhoneNumber, cleanPhoneNumber } from "../../utils/phoneValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../../../data/textile");

// Ensure tenant data directory exists
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const getTenantFilePath = (companyId, entity) => {
  ensureDataDir();
  const safeId = (companyId || "default_company").replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(DATA_DIR, `${safeId}_${entity}.json`);
};

const readTenantData = (companyId, entity, defaultValue = []) => {
  try {
    const filePath = getTenantFilePath(companyId, entity);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading tenant data for ${entity}:`, err);
  }
  return defaultValue;
};

const writeTenantData = (companyId, entity, data) => {
  try {
    const filePath = getTenantFilePath(companyId, entity);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing tenant data for ${entity}:`, err);
  }
};

export const PRODUCTION_STAGES_LIST = [
  { id: 1, name: "Yarn Spinning", code: "SPIN", leadTime: "2-3 Days", standardLoss: "1.5%", desc: "Raw cotton & polyester staple fibre drawn into spinning thread count." },
  { id: 2, name: "Loom Weaving", code: "WEAV", leadTime: "3-5 Days", standardLoss: "2.0%", desc: "Warp and weft yarn interlaced on high-speed air-jet looms." },
  { id: 3, name: "Dyeing & Washing", code: "DYE", leadTime: "1-2 Days", standardLoss: "1.0%", desc: "Batch jet dyeing with reactive colorants and hot wash softening." },
  { id: 4, name: "Printing & Finish", code: "PRINT", leadTime: "2-4 Days", standardLoss: "1.2%", desc: "Rotary screen / digital pigment printing, sanforizing, and heat curing." },
  { id: 5, name: "QC Inspection", code: "QC", leadTime: "1 Day", standardLoss: "0.5%", desc: "4-point defect grading, GSM measurement, tear strength testing." },
  { id: 6, name: "Finished Stock", code: "DONE", leadTime: "Immediate", standardLoss: "0.0%", desc: "Fabric roll packaging, barcode tagging, transfer to warehouse." },
];

// ==========================================
// 1. RAW MATERIALS REPOSITORY
// ==========================================

export const getRawMaterialsRepo = async (companyId, query = {}) => {
  const materials = readTenantData(companyId, "raw_materials", []);
  if (query.search) {
    const s = query.search.toLowerCase();
    return materials.filter(
      (m) =>
        m.name?.toLowerCase().includes(s) ||
        m.category?.toLowerCase().includes(s) ||
        m.supplier?.toLowerCase().includes(s) ||
        m.id?.toLowerCase().includes(s)
    );
  }
  return materials;
};

export const createRawMaterialRepo = async (companyId, data) => {
  const materials = readTenantData(companyId, "raw_materials", []);
  const initialStock = Number(data.stock || data.quantity || 0);
  const newMaterial = {
    id: `RM-${Math.floor(100 + Math.random() * 900)}`,
    companyId,
    name: data.name,
    category: data.category || "Yarn",
    stock: initialStock,
    quantity: initialStock,
    unit: data.unit || "KG",
    reorderLevel: Number(data.reorderLevel) || 500,
    costPerUnit: Number(data.costPerUnit) || 100,
    supplier: data.supplier || "General Supplier",
    status: initialStock <= (Number(data.reorderLevel) || 500) ? "LOW_STOCK" : "IN_STOCK",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  materials.unshift(newMaterial);
  writeTenantData(companyId, "raw_materials", materials);

  // Auto-record STOCK_IN / OPENING_STOCK movement if initialStock > 0
  if (initialStock > 0) {
    const movements = readTenantData(companyId, "stock_movements", []);
    const movCount = movements.length + 1;
    movements.unshift({
      id: `MOV-${String(movCount).padStart(6, "0")}`,
      reference: `INIT-${newMaterial.id}`,
      companyId,
      erpType: "TEXTILE",
      type: "STOCK_IN",
      item: newMaterial.name,
      sku: newMaterial.id,
      quantity: initialStock,
      unit: newMaterial.unit,
      source: newMaterial.supplier || "Vendor Inward Delivery",
      destination: "Main Raw Material Mill Depot",
      batchId: null,
      user: "Inventory Receiving Officer",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      reason: `Initial Stock Intake for ${newMaterial.name}`,
      createdAt: new Date().toISOString(),
    });
    writeTenantData(companyId, "stock_movements", movements);
  }

  return newMaterial;
};

export const updateRawMaterialRepo = async (companyId, id, data) => {
  const materials = readTenantData(companyId, "raw_materials", []);
  const index = materials.findIndex((m) => m.id === id);
  if (index === -1) return null;
  const updated = {
    ...materials[index],
    ...data,
    stock: data.stock !== undefined ? Number(data.stock) : materials[index].stock,
    quantity: data.quantity !== undefined ? Number(data.quantity) : materials[index].quantity,
    updatedAt: new Date().toISOString(),
  };
  materials[index] = updated;
  writeTenantData(companyId, "raw_materials", materials);
  return updated;
};

export const deleteRawMaterialRepo = async (companyId, id) => {
  const materials = readTenantData(companyId, "raw_materials", []);
  const filtered = materials.filter((m) => m.id !== id);
  writeTenantData(companyId, "raw_materials", filtered);
  return { success: true };
};

// ==========================================
// 2. PRODUCTION PLANS REPOSITORY
// ==========================================

export const getProductionPlansRepo = async (companyId, query = {}) => {
  const plans = readTenantData(companyId, "production_plans", []);
  if (query.search) {
    const s = query.search.toLowerCase();
    return plans.filter(
      (p) =>
        p.id?.toLowerCase().includes(s) ||
        p.lineName?.toLowerCase().includes(s) ||
        p.productName?.toLowerCase().includes(s)
    );
  }
  return plans;
};

export const createProductionPlanRepo = async (companyId, data) => {
  const plans = readTenantData(companyId, "production_plans", []);
  const planCount = plans.length + 1;
  const planNumber = `PLAN-${new Date().getFullYear()}-${String(planCount).padStart(3, "0")}`;

  const targetMeters = Number(data.targetMeters || data.plannedQty || data.quantity || 0);

  const newPlan = {
    id: data.id || planNumber,
    planNumber,
    companyId,
    productId: data.productId || null,
    productName: data.productName || data.fabricName || data.lineName || "Textile Fabric Line",
    lineName: data.lineName || "AirJet Loom Section",
    targetMeters,
    currentOutput: Number(data.currentOutput || 0),
    unit: data.unit || "Meters",
    shift: data.shift || "Morning Shift",
    efficiency: data.efficiency || null,
    priority: data.priority || "Normal",
    manufacturingUnit: data.manufacturingUnit || "Main Unit",
    plannedStartDate: data.plannedStartDate || data.startDate || new Date().toISOString().split("T")[0],
    plannedEndDate: data.plannedEndDate || data.targetDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    status: data.status || "PLANNED", // DRAFT, PLANNED, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  plans.unshift(newPlan);
  writeTenantData(companyId, "production_plans", plans);
  return newPlan;
};

export const approveProductionPlanRepo = async (companyId, id) => {
  const plans = readTenantData(companyId, "production_plans", []);
  const index = plans.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Production plan not found.");

  plans[index].status = "APPROVED";
  plans[index].updatedAt = new Date().toISOString();
  writeTenantData(companyId, "production_plans", plans);

  // Automatically spawn a production order/batch from approved plan
  const plan = plans[index];
  const newBatch = await createProductionBatchRepo(companyId, {
    planId: plan.id,
    batchName: plan.productName || plan.lineName,
    fabricType: plan.productName || "Textile Fabric",
    material: plan.productName || "Standard Fabric Blend",
    targetMeters: plan.targetMeters,
    unit: plan.unit || "Meters",
    operator: "Assigned Line Lead",
    startDate: plan.plannedStartDate,
    targetDate: plan.plannedEndDate,
  });

  return { plan: plans[index], batch: newBatch };
};

// ==========================================
// 3. PRODUCTION ORDERS & BATCHES REPOSITORY
// ==========================================

export const getProductionBatchesRepo = async (companyId, query = {}, user = null) => {
  let batches = readTenantData(companyId, "production_batches", []);

  // Role-based operational data filtering
  if (user) {
    const roleStr = user.role || user.designation || "";
    const normRole = normalizeTextileRole(roleStr);
    const uName = (user.name || user.fullName || user.username || "").toLowerCase();

    if (normRole === "WEAVER") {
      batches = batches.filter((b) => {
        const stageStr = (b.stage || b.currentStage || "").toLowerCase();
        const op = (b.operator || "").toLowerCase();
        return (
          b.currentStageIndex === 1 ||
          stageStr.includes("weav") ||
          stageStr.includes("loom") ||
          (uName && op.includes(uName))
        );
      });
    } else if (normRole === "DYER") {
      batches = batches.filter((b) => {
        const stageStr = (b.stage || b.currentStage || "").toLowerCase();
        const op = (b.operator || "").toLowerCase();
        return (
          b.currentStageIndex === 2 ||
          stageStr.includes("dye") ||
          stageStr.includes("wash") ||
          (uName && op.includes(uName))
        );
      });
    } else if (normRole === "QUALITY_INSPECTOR") {
      batches = batches.filter((b) => {
        const stageStr = (b.stage || b.currentStage || "").toLowerCase();
        return (
          b.currentStageIndex === 4 ||
          stageStr.includes("qc") ||
          stageStr.includes("inspect") ||
          stageStr.includes("quality")
        );
      });
    }
  }

  if (query.search) {
    const s = query.search.toLowerCase();
    return batches.filter(
      (b) =>
        b.id?.toLowerCase().includes(s) ||
        b.batchName?.toLowerCase().includes(s) ||
        b.batchNumber?.toLowerCase().includes(s) ||
        b.operator?.toLowerCase().includes(s) ||
        b.fabricType?.toLowerCase().includes(s)
    );
  }
  return batches;
};

export const createProductionBatchRepo = async (companyId, data) => {
  const batches = readTenantData(companyId, "production_batches", []);
  const targetQty = Number(data.targetMeters || data.targetQty || data.targetOutput || 0);
  const batchNum = `PROD-${Math.floor(100 + Math.random() * 900)}`;

  const newBatch = {
    id: data.id || batchNum,
    batchNumber: data.batchNumber || batchNum,
    orderNumber: data.orderNumber || `ORD-${Math.floor(9000 + Math.random() * 1000)}`,
    companyId,
    planId: data.planId || null,
    productId: data.productId || null,
    customer: data.customer || "Internal Production Order",
    batchName: data.batchName || data.name || data.fabricType || "Textile Fabric Batch",
    fabricType: data.fabricType || data.material || "100% Cotton",
    material: data.material || data.fabricType || "100% Cotton",
    fabricComposition: data.fabricComposition || data.material || "100% Cotton",
    targetQty,
    targetOutput: targetQty,
    targetMeters: targetQty,
    completedQty: Number(data.completedQty || 0),
    completedMeters: Number(data.completedQty || 0),
    unit: data.unit || "Meters",
    currentStageIndex: 0,
    stage: "1. Yarn Spinning",
    currentStage: "1. Yarn Spinning",
    progress: 0,
    status: data.status || "IN_PROGRESS", // DRAFT, PLANNED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
    priority: data.priority || "Normal",
    manufacturingUnit: data.manufacturingUnit || "Main Loom Mill",
    operator: data.operator || "Loom Operator",
    startDate: data.startDate || new Date().toISOString().split("T")[0],
    targetDate: data.targetDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    stageHistory: [
      {
        stageIndex: 0,
        stageName: "1. Yarn Spinning",
        startedAt: new Date().toISOString(),
        operator: data.operator || "Loom Operator",
        status: "IN_PROGRESS",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  batches.unshift(newBatch);
  writeTenantData(companyId, "production_batches", batches);
  return newBatch;
};

export const updateProductionBatchRepo = async (companyId, id, data) => {
  const batches = readTenantData(companyId, "production_batches", []);
  const index = batches.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const STAGES = PRODUCTION_STAGES_LIST.map((s) => `${s.id}. ${s.name}`);

  let currentStageIndex = data.currentStageIndex !== undefined ? data.currentStageIndex : batches[index].currentStageIndex;
  if (data.advanceStage) {
    currentStageIndex = Math.min((batches[index].currentStageIndex || 0) + 1, STAGES.length - 1);
  }

  const isCompleted = currentStageIndex === STAGES.length - 1;
  const stageName = STAGES[currentStageIndex] || STAGES[0];
  const targetOutput = Number(data.targetOutput || data.targetMeters || batches[index].targetOutput || 0);
  
  let completedQty = data.completedQty !== undefined 
    ? Number(data.completedQty) 
    : isCompleted
    ? targetOutput
    : Math.round(targetOutput * ((currentStageIndex + 1) / STAGES.length));

  const progress = targetOutput > 0 ? Math.min(Math.round((completedQty / targetOutput) * 100), 100) : 0;

  const stageHistory = Array.isArray(batches[index].stageHistory) ? [...batches[index].stageHistory] : [];
  if (data.advanceStage || data.stageNote || data.outputQty) {
    stageHistory.push({
      stageIndex: currentStageIndex,
      stageName,
      completedAt: new Date().toISOString(),
      outputQty: Number(data.outputQty || completedQty),
      operator: data.operator || batches[index].operator || "Operator",
      notes: data.notes || data.stageNote || "Stage advanced",
      qcStatus: data.qcStatus || "PASS",
    });
  }

  const updated = {
    ...batches[index],
    ...data,
    currentStageIndex,
    stage: stageName,
    currentStage: stageName,
    targetOutput,
    targetMeters: targetOutput,
    targetQty: targetOutput,
    completedQty,
    completedMeters: completedQty,
    progress,
    status: isCompleted ? "COMPLETED" : data.status || batches[index].status || "IN_PROGRESS",
    stageHistory,
    updatedAt: new Date().toISOString(),
  };

  batches[index] = updated;
  writeTenantData(companyId, "production_batches", batches);

  // If completed and passed QC, integrate with finished products inventory and record stock movement
  if (isCompleted && (!data.qcStatus || data.qcStatus === "PASS") && completedQty > 0) {
    const movements = readTenantData(companyId, "stock_movements", []);
    const movCount = movements.length + 1;
    movements.unshift({
      id: `MOV-${String(movCount).padStart(6, "0")}`,
      reference: `PROD-OUT-${batches[index].id}`,
      companyId,
      erpType: "TEXTILE",
      type: "PRODUCTION_OUTPUT",
      item: batches[index].fabricType || batches[index].batchName || "Finished Fabric",
      sku: `FAB-${batches[index].id}`,
      quantity: completedQty,
      unit: batches[index].unit || "Meters",
      source: batches[index].manufacturingUnit || "Main Loom Mill",
      destination: "Finished Goods Central Depot",
      batchId: batches[index].id,
      user: data.operator || batches[index].operator || "Loom Master",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      reason: `Batch ${batches[index].id} Production Output Completion (${completedQty} Meters)`,
      createdAt: new Date().toISOString(),
    });
    writeTenantData(companyId, "stock_movements", movements);

    try {
      let warehouse = await prisma.warehouse.findFirst({
        where: { companyId: companyId || undefined },
      });

      if (warehouse && completedQty > 0) {
        await prisma.stockMovement.create({
          data: {
            companyId: companyId || null,
            warehouseId: warehouse.id,
            type: "IN",
            quantity: completedQty,
            referenceType: "PRODUCTION_OUTPUT",
            reason: `Batch ${batches[index].id} Finished Fabric Output`,
            date: new Date(),
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Soft notice on finished stock inventory movement:", e);
    }
  }

  return updated;
};

export const deleteProductionBatchRepo = async (companyId, id) => {
  const batches = readTenantData(companyId, "production_batches", []);
  const filtered = batches.filter((b) => b.id !== id);
  writeTenantData(companyId, "production_batches", filtered);
  return { success: true };
};

// ==========================================
// 4. MATERIAL CONSUMPTION REPOSITORY
// ==========================================

export const getMaterialConsumptionRepo = async (companyId, query = {}) => {
  const consumptions = readTenantData(companyId, "material_consumption", []);
  if (query.search) {
    const s = query.search.toLowerCase();
    return consumptions.filter(
      (c) =>
        c.id?.toLowerCase().includes(s) ||
        c.batchId?.toLowerCase().includes(s) ||
        c.material?.toLowerCase().includes(s)
    );
  }
  return consumptions;
};

export const recordMaterialConsumptionRepo = async (companyId, data) => {
  const consumptions = readTenantData(companyId, "material_consumption", []);
  const materials = readTenantData(companyId, "raw_materials", []);

  const alloc = Number(data.allocatedKg || data.allocatedQty || data.consumedKg || 0);
  const cons = Number(data.consumedKg || data.consumedQty || 0);

  if (cons <= 0) {
    throw new Error("Consumed quantity must be greater than zero.");
  }

  // Find matching raw material if exists
  const matIndex = materials.findIndex(
    (m) =>
      (data.rawMaterialId && m.id === data.rawMaterialId) ||
      (data.material && m.name.toLowerCase().trim() === data.material.toLowerCase().trim())
  );

  if (matIndex !== -1) {
    const currentStock = Number(materials[matIndex].stock || materials[matIndex].quantity || 0);
    if (currentStock < cons) {
      throw new Error(`Insufficient raw material stock! Available: ${currentStock} ${materials[matIndex].unit}, Required: ${cons}`);
    }
    // Deduct stock
    materials[matIndex].stock = Math.max(0, currentStock - cons);
    materials[matIndex].quantity = materials[matIndex].stock;
    materials[matIndex].status = materials[matIndex].stock <= (Number(materials[matIndex].reorderLevel) || 500) ? "LOW_STOCK" : "IN_STOCK";
    materials[matIndex].updatedAt = new Date().toISOString();
    writeTenantData(companyId, "raw_materials", materials);
  }

  // Record Tenant & Prisma Stock Movement
  const movements = readTenantData(companyId, "stock_movements", []);
  const movCount = movements.length + 1;
  movements.unshift({
    id: `MOV-${String(movCount).padStart(6, "0")}`,
    reference: `CONS-${data.batchId || "GEN"}`,
    companyId,
    erpType: "TEXTILE",
    type: "PRODUCTION_CONSUMPTION",
    item: data.material || "Raw Textile Material",
    sku: data.rawMaterialId || "RM-TEX",
    quantity: -cons,
    unit: data.unit || "KG",
    source: data.warehouse || "Main Raw Material Mill Depot",
    destination: `Production Batch (${data.batchId || "PROD-GEN"})`,
    batchId: data.batchId || null,
    user: data.operator || "Material Handler",
    date: new Date().toISOString().replace("T", " ").substring(0, 16),
    reason: `Material Consumption for Batch ${data.batchId || "PROD-GEN"}`,
    createdAt: new Date().toISOString(),
  });
  writeTenantData(companyId, "stock_movements", movements);

  try {
    let warehouse = await prisma.warehouse.findFirst({
      where: { companyId: companyId || undefined },
    });
    if (warehouse) {
      await prisma.stockMovement.create({
        data: {
          companyId: companyId || null,
          warehouseId: warehouse.id,
          type: "OUT",
          quantity: cons,
          referenceType: "PRODUCTION_CONSUMPTION",
          reason: `Consumed in Batch ${data.batchId || "PROD-GEN"} (${data.material || "Raw Material"})`,
          date: new Date(),
        },
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("Soft notice on material consumption stock movement:", err);
  }

  const diff = alloc > 0 ? ((cons - alloc) / alloc) * 100 : 0;
  const varianceStr = alloc > 0 
    ? `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}% (${diff <= 0 ? "Favorable" : "Unfavorable"})`
    : "Standard Consumption";

  const newConsumption = {
    id: `CON-${Math.floor(700 + Math.random() * 300)}`,
    companyId,
    batchId: data.batchId || "PROD-GENERAL",
    batchName: data.batchName || data.fabricType || "Textile Production",
    rawMaterialId: data.rawMaterialId || null,
    material: data.material || "Raw Textile Material",
    allocatedKg: alloc,
    consumedKg: cons,
    variance: varianceStr,
    unit: data.unit || "KG",
    warehouse: data.warehouse || "Raw Material Store",
    operator: data.operator || "Material Handler",
    consumptionDate: data.consumptionDate || new Date().toISOString().split("T")[0],
    status: "VERIFIED",
    createdAt: new Date().toISOString(),
  };

  consumptions.unshift(newConsumption);
  writeTenantData(companyId, "material_consumption", consumptions);
  return newConsumption;
};

// ==========================================
// 5. QUALITY CONTROL REPOSITORY
// ==========================================

export const getQualityInspectionsRepo = async (companyId, query = {}) => {
  const qcLogs = readTenantData(companyId, "qc_inspections", []);
  if (query.search) {
    const s = query.search.toLowerCase();
    return qcLogs.filter(
      (q) =>
        q.batchId?.toLowerCase().includes(s) ||
        q.fabricName?.toLowerCase().includes(s) ||
        q.inspector?.toLowerCase().includes(s) ||
        q.id?.toLowerCase().includes(s)
    );
  }
  return qcLogs;
};

export const createQualityInspectionRepo = async (companyId, data) => {
  const qcLogs = readTenantData(companyId, "qc_inspections", []);
  const inspectedMeters = Number(data.inspectedMeters || 0);
  const passedMeters = Number(data.passedMeters || inspectedMeters);
  const defectMeters = Number(data.defectMeters || 0);
  const grade = data.grade || "Grade A";
  const isRejected = grade === "Reject" || data.status === "REJECTED" || data.result === "FAIL";

  const newQC = {
    id: `QC-${Math.floor(900 + Math.random() * 100)}`,
    companyId,
    batchId: data.batchId || "PROD-GEN",
    fabricName: data.fabricName || "Textile Fabric Inspection",
    inspectedMeters,
    passedMeters,
    defectMeters,
    defectType: data.defectType || "Minor Surface Imperfection",
    grade,
    inspector: data.inspector || "QC Inspector",
    date: data.date || new Date().toISOString().split("T")[0],
    status: isRejected ? "REJECTED" : grade === "Grade B" ? "PASSED_WITH_DEFECTS" : "PASSED",
    result: isRejected ? "FAIL" : "PASS",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  qcLogs.unshift(newQC);
  writeTenantData(companyId, "qc_inspections", qcLogs);

  // Auto-record ADJUSTMENT / WASTAGE movement if defect/rejected meters > 0
  if (isRejected || defectMeters > 0) {
    const movements = readTenantData(companyId, "stock_movements", []);
    const movCount = movements.length + 1;
    movements.unshift({
      id: `MOV-${String(movCount).padStart(6, "0")}`,
      reference: `QC-${newQC.id}`,
      companyId,
      erpType: "TEXTILE",
      type: "ADJUSTMENT",
      item: newQC.fabricName || "Inspected Fabric Roll",
      sku: `QC-${newQC.batchId}`,
      quantity: -defectMeters,
      unit: "Meters",
      source: "QC Inspection Hall 3",
      destination: isRejected ? "Waste / Salvage Disposal" : "B-Grade / Defect Hold",
      batchId: newQC.batchId,
      user: newQC.inspector || "QC Team Lead",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      reason: `QC Inspection: ${newQC.defectType} (${grade})`,
      createdAt: new Date().toISOString(),
    });
    writeTenantData(companyId, "stock_movements", movements);
  }

  return newQC;
};

export const deleteQualityInspectionRepo = async (companyId, id) => {
  const qcLogs = readTenantData(companyId, "qc_inspections", []);
  const filtered = qcLogs.filter((q) => q.id !== id);
  writeTenantData(companyId, "qc_inspections", filtered);
  return { success: true };
};

// ==========================================
// 6. STOCK MOVEMENTS REPOSITORY
// ==========================================

export const getStockMovementsRepo = async (companyId, query = {}) => {
  const movements = readTenantData(companyId, "stock_movements", []);
  let filtered = movements.filter((m) => !m.companyId || m.companyId === companyId);

  // Filter by Movement Type
  if (query.movementType && query.movementType !== "ALL") {
    const typeUpper = query.movementType.toUpperCase();
    if (typeUpper === "STOCK_IN") {
      filtered = filtered.filter((m) => ["STOCK_IN", "PURCHASE_RECEIPT", "OPENING_STOCK", "CUSTOMER_RETURN"].includes(m.type));
    } else if (typeUpper === "STOCK_OUT") {
      filtered = filtered.filter((m) => ["STOCK_OUT"].includes(m.type));
    } else if (typeUpper === "PRODUCTION_CONSUMPTION") {
      filtered = filtered.filter((m) => ["PRODUCTION_CONSUMPTION", "PRODUCTION_ISSUE"].includes(m.type));
    } else if (typeUpper === "PRODUCTION_OUTPUT") {
      filtered = filtered.filter((m) => ["PRODUCTION_OUTPUT"].includes(m.type));
    } else if (typeUpper === "SALES_DEDUCTION") {
      filtered = filtered.filter((m) => ["SALES_DEDUCTION", "SALES_DISPATCH", "EXPORT_DISPATCH"].includes(m.type));
    } else if (typeUpper === "ADJUSTMENT") {
      filtered = filtered.filter((m) => ["ADJUSTMENT", "STOCK_ADJUSTMENT", "WASTAGE", "DAMAGE"].includes(m.type));
    } else if (typeUpper === "TRANSFER") {
      filtered = filtered.filter((m) => ["TRANSFER", "WAREHOUSE_TRANSFER", "MANUFACTURING_UNIT_TRANSFER"].includes(m.type));
    } else {
      filtered = filtered.filter((m) => m.type === query.movementType);
    }
  }

  // Date Range Filtering
  if (query.startDate) {
    const start = new Date(query.startDate).getTime();
    filtered = filtered.filter((m) => new Date(m.date || m.createdAt).getTime() >= start);
  }
  if (query.endDate) {
    const end = new Date(query.endDate).setHours(23, 59, 59, 999);
    filtered = filtered.filter((m) => new Date(m.date || m.createdAt).getTime() <= end);
  }

  // Search Filter
  if (query.search) {
    const s = query.search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.item?.toLowerCase().includes(s) ||
        m.sku?.toLowerCase().includes(s) ||
        m.id?.toLowerCase().includes(s) ||
        m.reference?.toLowerCase().includes(s) ||
        m.source?.toLowerCase().includes(s) ||
        m.destination?.toLowerCase().includes(s) ||
        m.reason?.toLowerCase().includes(s) ||
        m.user?.toLowerCase().includes(s) ||
        m.batchId?.toLowerCase().includes(s)
    );
  }

  // Sort by latest first
  filtered.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  // Pagination support if requested
  if (query.page && query.limit) {
    const page = Math.max(1, parseInt(query.page));
    const limit = Math.max(1, parseInt(query.limit));
    const total = filtered.length;
    const items = filtered.slice((page - 1) * limit, page * limit);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  return filtered;
};

export const getStockMovementsSummaryRepo = async (companyId, query = {}) => {
  // Compute summary strictly from the filtered dataset
  const movements = await getStockMovementsRepo(companyId, { ...query, page: undefined, limit: undefined });
  const list = Array.isArray(movements) ? movements : movements.items || [];

  // Helper to group quantities by unit
  const groupByUnit = (items) => {
    const breakdown = {};
    items.forEach((m) => {
      const u = m.unit || "Meters";
      const q = Math.abs(Number(m.quantity || 0));
      breakdown[u] = (breakdown[u] || 0) + q;
    });
    return breakdown;
  };

  const formatUnitBreakdown = (breakdown, defaultUnit = "KG") => {
    const keys = Object.keys(breakdown);
    if (keys.length === 0) return `0 ${defaultUnit}`;
    return keys.map((u) => `${breakdown[u].toLocaleString()} ${u}`).join(" + ");
  };

  // 1. Total Received (Inflow)
  const inflowItems = list.filter((m) =>
    ["STOCK_IN", "PURCHASE_RECEIPT", "OPENING_STOCK", "PRODUCTION_OUTPUT", "CUSTOMER_RETURN"].includes(m.type)
  );
  const inflowBreakdown = groupByUnit(inflowItems);
  const totalInflowFormatted = formatUnitBreakdown(inflowBreakdown, "KG");
  const inflowSubtitle = inflowItems.length > 0
    ? `${inflowItems.length} Inflow & Receipt ${inflowItems.length === 1 ? "Event" : "Events"}`
    : "No Inflow Activity Recorded";

  // 2. Production Issued
  const prodIssuedItems = list.filter((m) =>
    ["PRODUCTION_CONSUMPTION", "PRODUCTION_ISSUE"].includes(m.type)
  );
  const prodIssuedBreakdown = groupByUnit(prodIssuedItems);
  const totalProdIssuedFormatted = formatUnitBreakdown(prodIssuedBreakdown, "KG");
  const distinctBatches = new Set(prodIssuedItems.map((m) => m.batchId || m.reference).filter(Boolean)).size;
  const prodIssuedSubtitle = distinctBatches > 0
    ? `Issued to ${distinctBatches} Active Production ${distinctBatches === 1 ? "Batch" : "Batches"}`
    : prodIssuedItems.length > 0
    ? `Issued across ${prodIssuedItems.length} Production Events`
    : "No Material Issued to Production";

  // 3. Sales Dispatches
  const salesItems = list.filter((m) =>
    ["SALES_DEDUCTION", "SALES_DISPATCH", "EXPORT_DISPATCH"].includes(m.type)
  );
  const salesBreakdown = groupByUnit(salesItems);
  const totalSalesFormatted = formatUnitBreakdown(salesBreakdown, "Meters");
  const distinctInvoices = new Set(salesItems.map((m) => m.reference || m.destination).filter(Boolean)).size;
  const salesSubtitle = salesItems.length > 0
    ? `Fabric Dispatched across ${distinctInvoices} ${distinctInvoices === 1 ? "Order" : "Orders"}`
    : "No Fabric Dispatches Recorded";

  // 4. Unit Transfers
  const transferItems = list.filter((m) =>
    ["TRANSFER", "WAREHOUSE_TRANSFER", "MANUFACTURING_UNIT_TRANSFER"].includes(m.type)
  );
  const totalTransfersCount = transferItems.length;
  const transferSubtitle = totalTransfersCount > 0
    ? `${totalTransfersCount} Completed Transfer ${totalTransfersCount === 1 ? "Event" : "Events"}`
    : "No Warehouse Transfers Recorded";

  return {
    totalReceived: {
      formatted: totalInflowFormatted,
      breakdown: inflowBreakdown,
      count: inflowItems.length,
      subtitle: inflowSubtitle,
    },
    productionIssued: {
      formatted: totalProdIssuedFormatted,
      breakdown: prodIssuedBreakdown,
      count: prodIssuedItems.length,
      batchCount: distinctBatches,
      subtitle: prodIssuedSubtitle,
    },
    salesDispatches: {
      formatted: totalSalesFormatted,
      breakdown: salesBreakdown,
      count: salesItems.length,
      subtitle: salesSubtitle,
    },
    unitTransfers: {
      count: totalTransfersCount,
      subtitle: transferSubtitle,
    },
  };
};

export const createStockMovementRepo = async (companyId, data) => {
  const movements = readTenantData(companyId, "stock_movements", []);
  const rawMaterials = readTenantData(companyId, "raw_materials", []);
  
  const quantityNum = Math.abs(Number(data.quantity || 0));
  if (quantityNum <= 0) {
    throw new Error("Movement quantity must be greater than zero.");
  }

  const type = (data.type || "STOCK_IN").toUpperCase();
  const itemName = (data.item || data.material || data.name || "Textile Material").trim();
  const unit = data.unit || "KG";

  // Check inventory stock and update atomically
  if (["STOCK_OUT", "PRODUCTION_CONSUMPTION", "SALES_DEDUCTION"].includes(type)) {
    const matIndex = rawMaterials.findIndex(
      (m) =>
        (data.rawMaterialId && m.id === data.rawMaterialId) ||
        (m.name.toLowerCase().trim() === itemName.toLowerCase().trim())
    );

    if (matIndex !== -1) {
      const available = Number(rawMaterials[matIndex].stock || rawMaterials[matIndex].quantity || 0);
      if (available < quantityNum) {
        throw new Error(`Insufficient inventory stock! Available: ${available} ${rawMaterials[matIndex].unit}, Requested: ${quantityNum} ${unit}`);
      }
      rawMaterials[matIndex].stock = Math.max(0, available - quantityNum);
      rawMaterials[matIndex].quantity = rawMaterials[matIndex].stock;
      rawMaterials[matIndex].status = rawMaterials[matIndex].stock <= (Number(rawMaterials[matIndex].reorderLevel) || 500) ? "LOW_STOCK" : "IN_STOCK";
      rawMaterials[matIndex].updatedAt = new Date().toISOString();
      writeTenantData(companyId, "raw_materials", rawMaterials);
    }
  } else if (["STOCK_IN", "PURCHASE_RECEIPT", "OPENING_STOCK"].includes(type)) {
    const matIndex = rawMaterials.findIndex(
      (m) =>
        (data.rawMaterialId && m.id === data.rawMaterialId) ||
        (m.name.toLowerCase().trim() === itemName.toLowerCase().trim())
    );
    if (matIndex !== -1) {
      const current = Number(rawMaterials[matIndex].stock || rawMaterials[matIndex].quantity || 0);
      rawMaterials[matIndex].stock = current + quantityNum;
      rawMaterials[matIndex].quantity = rawMaterials[matIndex].stock;
      rawMaterials[matIndex].status = rawMaterials[matIndex].stock <= (Number(rawMaterials[matIndex].reorderLevel) || 500) ? "LOW_STOCK" : "IN_STOCK";
      rawMaterials[matIndex].updatedAt = new Date().toISOString();
      writeTenantData(companyId, "raw_materials", rawMaterials);
    }
  }

  // Determine sign
  const isNegative = ["STOCK_OUT", "PRODUCTION_CONSUMPTION", "SALES_DEDUCTION", "WASTAGE", "DAMAGE"].includes(type);
  const finalQty = isNegative ? -quantityNum : quantityNum;

  const movCount = movements.length + 1;
  const newMov = {
    id: data.id || `MOV-${String(movCount).padStart(6, "0")}`,
    reference: data.reference || data.referenceNumber || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
    companyId,
    erpType: "TEXTILE",
    type,
    item: itemName,
    sku: data.sku || "TEX-GEN-01",
    quantity: finalQty,
    unit,
    source: data.source || "Mill Storage",
    destination: data.destination || "Warehouse Section",
    batchId: data.batchId || data.productionOrderId || null,
    user: data.user || data.officer || "Inventory Officer",
    date: data.date || data.movementDate || new Date().toISOString().replace("T", " ").substring(0, 16),
    reason: data.reason || data.notes || "Operational Stock Movement",
    createdAt: new Date().toISOString(),
  };

  movements.unshift(newMov);
  writeTenantData(companyId, "stock_movements", movements);
  return newMov;
};

export const getStockMovementByIdRepo = async (companyId, id) => {
  const movements = readTenantData(companyId, "stock_movements", []);
  const movement = movements.find((m) => m.id === id && (!m.companyId || m.companyId === companyId));
  if (!movement) {
    throw new Error("Stock movement record not found or does not belong to your company.");
  }
  return movement;
};

export const getStockMovementsFiltersRepo = async (companyId) => {
  const rawMaterials = readTenantData(companyId, "raw_materials", []);
  const products = readTenantData(companyId, "products", []);
  const batches = readTenantData(companyId, "production_batches", []);

  return {
    rawMaterials: rawMaterials.map((r) => ({ id: r.id, name: r.name, unit: r.unit, stock: r.stock })),
    products: products.map((p) => ({ id: p.id, name: p.name, sku: p.sku })),
    batches: batches.map((b) => ({ id: b.id, name: b.batchName || b.fabricType, stage: b.stage })),
    warehouses: [
      { id: "W-MAIN", name: "Main Raw Material Mill Depot" },
      { id: "W-WEAVING", name: "Weaving & Loom Store" },
      { id: "W-DYEING", name: "Dyeing & Processing Unit" },
      { id: "W-FINISHED", name: "Finished Goods Central Depot" },
      { id: "W-EXPORT", name: "Export Dispatch Warehouse" },
      { id: "W-WASTE", name: "Waste / Salvage Disposal" },
    ],
  };
};

// ==========================================
// 7. TEXTILE PRODUCTS REPOSITORY
// ==========================================

export const getTextileProductsRepo = async (companyId, query = {}) => {
  const where = {};
  if (companyId) where.companyId = companyId;
  where.isTextile = true;

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { sku: { contains: query.search, mode: "insensitive" } },
    ];
  }

  try {
    return await prisma.product.findMany({
      where,
      include: {
        category: true,
        unit: true,
        brand: true,
        inventories: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Error querying textile products:", err);
    return [];
  }
};

export const getTextileProductByIdRepo = async (companyId, id) => {
  const where = { id, isTextile: true };
  if (companyId) where.companyId = companyId;

  return await prisma.product.findFirst({
    where,
    include: {
      category: true,
      unit: true,
      brand: true,
      inventories: true,
      variants: true,
    },
  });
};

export const createTextileProductRepo = async (data) => {
  return await prisma.product.create({
    data,
    include: {
      category: true,
      unit: true,
      brand: true,
      inventories: true,
      variants: true,
    },
  });
};

export const updateTextileProductRepo = async (companyId, id, data) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.product.update({
    where,
    data,
    include: {
      category: true,
      unit: true,
      brand: true,
      inventories: true,
      variants: true,
    },
  });
};

export const deleteTextileProductRepo = async (companyId, id) => {
  const where = { id };
  if (companyId) where.companyId = companyId;

  return await prisma.product.delete({
    where,
  });
};

// ==========================================
// 8. PRODUCTION MANAGEMENT OVERVIEW REPO
// ==========================================

export const getProductionOverviewRepo = async (companyId, user = null) => {
  const batches = await getProductionBatchesRepo(companyId, {}, user);
  const plans = await getProductionPlansRepo(companyId);
  const consumptions = await getMaterialConsumptionRepo(companyId);

  // Active batches (exclude COMPLETED and CANCELLED)
  const activeBatchesList = batches.filter(
    (b) =>
      b.status !== "COMPLETED" &&
      b.status !== "CANCELLED" &&
      b.status !== "FINISHED" &&
      (b.progress || 0) < 100
  );

  // Dynamic active stages calculation
  const stageUnitCounts = {};
  activeBatchesList.forEach((b) => {
    const stageStr = (b.stage || b.currentStage || "").toLowerCase();
    const idx = b.currentStageIndex !== undefined ? b.currentStageIndex : -1;
    let category = "Processing";

    if (idx === 0 || stageStr.includes("spin")) category = "Spinning Units";
    else if (idx === 1 || stageStr.includes("weav") || stageStr.includes("loom")) category = "Loom Units";
    else if (idx === 2 || stageStr.includes("dye") || stageStr.includes("wash")) category = "Dye Units";
    else if (idx === 3 || stageStr.includes("print") || stageStr.includes("finish")) category = "Printing Units";
    else if (idx === 4 || stageStr.includes("qc") || stageStr.includes("inspect")) category = "QC Inspection";

    stageUnitCounts[category] = (stageUnitCounts[category] || 0) + 1;
  });

  const distinctStageCategories = Object.keys(stageUnitCounts);
  let activeStageSubtitle = "● No Active Batches";
  if (distinctStageCategories.length === 1) {
    activeStageSubtitle = `● On ${distinctStageCategories[0]}`;
  } else if (distinctStageCategories.length > 1) {
    activeStageSubtitle = `● Active Across ${distinctStageCategories.length} Production Stages`;
  }

  // Target production & Completed output aggregation by unit
  const unitMap = {};
  let totalTargetMeters = 0;
  let totalCompletedMeters = 0;

  activeBatchesList.forEach((b) => {
    const unit = b.unit || "Meters";
    const target = Number(b.targetOutput || b.targetMeters || b.targetQty || 0);
    const completed = Number(b.completedQty || b.completedMeters || 0);

    if (!unitMap[unit]) {
      unitMap[unit] = { unit, target: 0, completed: 0 };
    }
    unitMap[unit].target += target;
    unitMap[unit].completed += completed;

    if (unit.toLowerCase().includes("meter") || unit.toLowerCase() === "m") {
      totalTargetMeters += target;
      totalCompletedMeters += completed;
    }
  });

  const unitBreakdown = Object.values(unitMap);
  const primaryTargetOutput = totalTargetMeters || (unitBreakdown[0]?.target || 0);
  const primaryCompletedOutput = totalCompletedMeters || (unitBreakdown[0]?.completed || 0);
  const primaryUnit = unitBreakdown[0]?.unit || "Meters";

  const completionPercentage = primaryTargetOutput > 0
    ? Math.round((primaryCompletedOutput / primaryTargetOutput) * 100)
    : 0;

  // Average Line Efficiency Calculation
  // Preferred formula: actualOutput / expectedOutput * 100
  const batchesWithEfficiency = batches.filter(
    (b) => Number(b.targetOutput || b.targetMeters || 0) > 0 && (Number(b.completedQty || 0) > 0 || b.status === "COMPLETED")
  );

  let averageEfficiency = null;
  if (batchesWithEfficiency.length > 0) {
    const totalTargetEff = batchesWithEfficiency.reduce((s, b) => s + Number(b.targetOutput || b.targetMeters || 0), 0);
    const totalCompEff = batchesWithEfficiency.reduce((s, b) => s + Number(b.completedQty || b.completedMeters || b.targetOutput || 0), 0);
    if (totalTargetEff > 0) {
      averageEfficiency = Number(Math.min(Math.round((totalCompEff / totalTargetEff) * 100 * 10) / 10, 100).toFixed(1));
    }
  }

  // Monthly efficiency comparison
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const currentMonthBatches = batches.filter((b) => (b.createdAt || "").startsWith(currentMonthStr));
  const prevMonthBatches = batches.filter((b) => (b.createdAt || "").startsWith(prevMonthStr));

  let efficiencyDiff = null;
  if (currentMonthBatches.length > 0 && prevMonthBatches.length > 0) {
    const curTot = currentMonthBatches.reduce((s, b) => s + Number(b.targetOutput || 1), 0);
    const curComp = currentMonthBatches.reduce((s, b) => s + Number(b.completedQty || 0), 0);
    const curEff = (curComp / curTot) * 100;

    const prevTot = prevMonthBatches.reduce((s, b) => s + Number(b.targetOutput || 1), 0);
    const prevComp = prevMonthBatches.reduce((s, b) => s + Number(b.completedQty || 0), 0);
    const prevEff = (prevComp / prevTot) * 100;

    const diff = Number((curEff - prevEff).toFixed(1));
    efficiencyDiff = diff >= 0 ? `+${diff}%` : `${diff}%`;
  }

  // Enrich stages list with active counts
  const stages = PRODUCTION_STAGES_LIST.map((st) => {
    const countInStage = activeBatchesList.filter((b) => {
      const idx = b.currentStageIndex !== undefined ? b.currentStageIndex : -1;
      const sName = (b.stage || b.currentStage || "").toLowerCase();
      return idx === st.id - 1 || sName.includes(st.name.toLowerCase()) || sName.includes(st.code.toLowerCase());
    }).length;

    return {
      ...st,
      activeBatches: countInStage,
      status: countInStage > 0 ? "Active" : "Idle",
    };
  });

  return {
    metrics: {
      activeBatches: activeBatchesList.length,
      activeStageSubtitle,
      targetProduction: primaryTargetOutput,
      targetUnit: primaryUnit,
      completedOutput: primaryCompletedOutput,
      completionPercentage,
      averageEfficiency, // null if no data
      efficiencyDiff, // null if no comparison data
      unitBreakdown,
    },
    batches,
    plans,
    orders: batches, // production orders share the single-source batch state
    consumptions,
    stages,
  };
};

// ==========================================
// 9. MAIN TEXTILE DASHBOARD REPOSITORY
// ==========================================

export const getTextileDashboardRepo = async (companyId) => {
  // 1. Raw Materials calculations
  const rawMaterials = await getRawMaterialsRepo(companyId);
  let totalRawQty = 0;
  let yarnStockQty = 0;
  let dyeStockQty = 0;
  let lowStockCount = 0;
  let totalStockValuation = 0;

  const unitMap = {};

  rawMaterials.forEach((item) => {
    const qty = Number(item.stock || item.quantity || 0);
    const u = item.unit || "KG";
    const cat = (item.category || "").toLowerCase();

    totalRawQty += qty;
    unitMap[u] = (unitMap[u] || 0) + qty;

    if (cat.includes("yarn") || cat.includes("cotton") || cat.includes("fibre") || cat.includes("fiber")) {
      yarnStockQty += qty;
    } else if (cat.includes("dye") || cat.includes("chemical") || cat.includes("color")) {
      dyeStockQty += qty;
    }

    if (qty <= (Number(item.reorderLevel) || 500)) {
      lowStockCount += 1;
    }

    totalStockValuation += qty * (Number(item.costPerUnit) || 100);
  });

  const unitBreakdown = Object.entries(unitMap).map(([unit, quantity]) => ({ unit, quantity }));
  const primaryRawUnit = unitBreakdown.length === 1 ? unitBreakdown[0].unit : "KG";

  // 2. Active batches & Stage breakdown
  const batchesList = await getProductionBatchesRepo(companyId);

  const activeBatchesList = batchesList.filter(
    (b) =>
      b.status !== "COMPLETED" &&
      b.status !== "CANCELLED" &&
      b.status !== "FINISHED" &&
      (b.progress || 0) < 100
  );

  let spinningCount = 0;
  let weavingCount = 0;
  let dyeingCount = 0;
  let printingCount = 0;
  let qcCount = 0;

  activeBatchesList.forEach((b) => {
    const stageStr = (b.stage || b.currentStage || "").toLowerCase();
    const idx = b.currentStageIndex !== undefined ? b.currentStageIndex : -1;

    if (idx === 0 || stageStr.includes("spin")) {
      spinningCount += 1;
    } else if (idx === 1 || stageStr.includes("weav") || stageStr.includes("loom")) {
      weavingCount += 1;
    } else if (idx === 2 || stageStr.includes("dye") || stageStr.includes("wash")) {
      dyeingCount += 1;
    } else if (idx === 3 || stageStr.includes("print") || stageStr.includes("finish")) {
      printingCount += 1;
    } else if (idx === 4 || stageStr.includes("qc") || stageStr.includes("inspect") || stageStr.includes("quality")) {
      qcCount += 1;
    }
  });

  // 3. Quality Pass Rate calculation
  const qcLogs = await getQualityInspectionsRepo(companyId);
  const passedInspections = qcLogs.filter(
    (q) => q.status === "PASSED" || q.result === "PASS" || q.grade === "Grade A"
  ).length;
  const failedInspections = qcLogs.filter(
    (q) => q.status === "REJECTED" || q.result === "FAIL" || q.grade === "Reject"
  ).length;
  const pendingInspections = qcLogs.filter(
    (q) => q.status === "PENDING" || q.grade === "Pending"
  ).length;

  const totalCompletedQC = passedInspections + failedInspections;
  let passRate = 0;
  let hasQcData = false;

  if (totalCompletedQC > 0) {
    passRate = Number(((passedInspections / totalCompletedQC) * 100).toFixed(1));
    hasQcData = true;
  }

  // 4. Finished Fabrics calculation
  const completedBatches = batchesList.filter((b) => b.status === "COMPLETED" || (b.progress || 0) >= 100);
  const completedMetersFromBatches = completedBatches.reduce(
    (sum, b) => sum + (Number(b.completedQty) || Number(b.targetQty) || Number(b.targetOutput) || 0),
    0
  );

  let dbProducts = [];
  try {
    const where = { isTextile: true };
    if (companyId) where.companyId = companyId;
    dbProducts = await prisma.product.findMany({
      where,
      include: { inventories: true },
    });
  } catch (err) {
    dbProducts = [];
  }

  const finishedProductsList = dbProducts.filter((p) => {
    const sku = (p.sku || "").toUpperCase();
    const cat = (p.category?.name || "").toLowerCase();
    return (
      !sku.startsWith("RAW-") &&
      !sku.startsWith("RM-") &&
      !cat.includes("raw") &&
      !cat.includes("yarn") &&
      !cat.includes("dye")
    );
  });

  const dbFinishedMeters = finishedProductsList.reduce((sum, p) => {
    const invTotal = (p.inventories || []).reduce((invSum, i) => invSum + Number(i.quantity || 0), 0);
    return sum + (invTotal || Number(p.initialStock || 0));
  }, 0);

  const totalFinishedMeters = completedMetersFromBatches + dbFinishedMeters;
  const finishedProductCount = finishedProductsList.length + completedBatches.length;

  // 5. Pipeline Stages
  const pipeline = [
    {
      stage: "1. Yarn Spinning",
      activeBatches: spinningCount,
      countLabel: `${spinningCount} Batches`,
      status: spinningCount > 0 ? "Active" : "Idle",
      bg: "#f0fdf4",
      color: "#166534",
    },
    {
      stage: "2. Loom Weaving",
      activeBatches: weavingCount,
      countLabel: `${weavingCount} Batches`,
      status: weavingCount > 0 ? "Active" : "Idle",
      bg: "#eff6ff",
      color: "#1e40af",
    },
    {
      stage: "3. Dyeing & Washing",
      activeBatches: dyeingCount,
      countLabel: `${dyeingCount} Batches`,
      status: dyeingCount > 0 ? "Active" : "Idle",
      bg: "#fdf4ff",
      color: "#86198f",
    },
    {
      stage: "4. Printing & Finish",
      activeBatches: printingCount,
      countLabel: `${printingCount} Batches`,
      status: printingCount > 0 ? "Active" : "Idle",
      bg: "#fff7ed",
      color: "#c2410c",
    },
    {
      stage: "5. QC Inspection",
      activeBatches: qcCount,
      countLabel: `${qcCount} Batches`,
      status: qcCount > 0 ? "Inspecting" : "Idle",
      bg: "#ecfdf5",
      color: "#047857",
    },
    {
      stage: "6. Finished Stock",
      activeBatches: completedBatches.length,
      countLabel: `${(totalFinishedMeters || 0).toLocaleString()} Meters`,
      status: totalFinishedMeters > 0 ? "Ready" : "Empty",
      bg: "#f8fafc",
      color: "#334155",
    },
  ];

  // 6. Ongoing Production Orders list (active only)
  const ongoingOrders = activeBatchesList.map((b) => ({
    id: b.id,
    batchId: b.id,
    fabricType: b.fabricType || b.material || "Textile Fabric",
    material: b.material || b.fabricType || "Textile Fabric",
    currentStage: b.stage || b.currentStage || "1. Yarn Spinning",
    stage: b.stage || b.currentStage || "1. Yarn Spinning",
    targetOutput: Number(b.targetOutput || b.targetQty || 0),
    targetQty: Number(b.targetOutput || b.targetQty || 0),
    completedQty: Number(b.completedQty || 0),
    unit: b.unit || "Meters",
    progress: Number(b.progress || 0),
    status: b.status || "IN_PROGRESS",
    operator: b.operator || "Operator",
    startDate: b.startDate || "",
    targetDate: b.targetDate || "",
  }));

  return {
    rawMaterials: {
      totalQuantity: totalRawQty,
      unit: primaryRawUnit,
      unitBreakdown,
      yarnStock: yarnStockQty,
      dyeStock: dyeStockQty,
      lowStockCount,
      totalStockValuation,
    },
    activeBatches: {
      total: activeBatchesList.length,
      spinning: spinningCount,
      weaving: weavingCount,
      dyeing: dyeingCount,
      printing: printingCount,
      qc: qcCount,
      stageSummary: `${spinningCount} Spinning, ${weavingCount} Weaving, ${dyeingCount} Dyeing, ${qcCount} QC`,
    },
    qualityControl: {
      passRate,
      hasQcData,
      passed: passedInspections,
      failed: failedInspections,
      pending: pendingInspections,
      totalCompleted: totalCompletedQC,
    },
    finishedFabrics: {
      totalQuantity: totalFinishedMeters,
      unit: "Meters",
      productCount: finishedProductCount,
    },
    pipeline,
    ongoingOrders,
  };
};

// ==========================================
// 10. TEXTILE CUSTOMERS REPOSITORY
// ==========================================

export const getTextileCustomersRepo = async (companyId, query = {}) => {
  const customers = readTenantData(companyId, "customers", []);
  // Ensure every returned customer is strictly isolated to this company and erpType = TEXTILE
  let filtered = customers.filter(
    (c) =>
      (!c.companyId || c.companyId === companyId) &&
      (c.erpType === "TEXTILE" || c.isTextile === true || c.category === "TEXTILE")
  );

  if (query.search) {
    const s = query.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name?.toLowerCase().includes(s) ||
        c.companyName?.toLowerCase().includes(s) ||
        c.phone?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.city?.toLowerCase().includes(s) ||
        c.gstNumber?.toLowerCase().includes(s)
    );
  }

  if (query.status && query.status !== "All" && query.status !== "ALL") {
    filtered = filtered.filter((c) => c.status === query.status);
  }

  return filtered;
};

export const getTextileCustomerByIdRepo = async (companyId, id) => {
  const customers = readTenantData(companyId, "customers", []);
  const customer = customers.find(
    (c) =>
      c.id === id &&
      (!c.companyId || c.companyId === companyId) &&
      (c.erpType === "TEXTILE" || c.isTextile === true || c.category === "TEXTILE")
  );
  if (!customer) {
    throw new Error("Textile customer not found or does not belong to your company.");
  }
  return customer;
};

export const createTextileCustomerRepo = async (companyId, data) => {
  const customers = readTenantData(companyId, "customers", []);
  
  const name = (data.name || data.companyName || "").trim();
  if (!name) {
    throw new Error("Customer / Buyer name is required.");
  }
  const phone = cleanPhoneNumber(data.phone || "");
  if (!validatePhoneNumber(phone, true)) {
    throw new Error("Phone number must contain exactly 10 digits");
  }

  const newCustomer = {
    id: `TEX-CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    companyId,
    erpType: "TEXTILE",
    isTextile: true,
    category: "TEXTILE",
    name,
    companyName: data.companyName || name,
    contactPerson: data.contactPerson ? String(data.contactPerson).trim() : null,
    phone,
    email: data.email && String(data.email).trim() !== "" ? String(data.email).trim() : null,
    customerType: data.customerType || "Garment Manufacturer", // Garment Manufacturer, Fabric Wholesaler, Export Buyer, Retail Brand
    address: data.address ? String(data.address).trim() : null,
    city: data.city ? String(data.city).trim() : null,
    state: data.state ? String(data.state).trim() : null,
    country: data.country ? String(data.country).trim() : "India",
    gstNumber: data.gstNumber || data.taxNumber || null,
    taxNumber: data.taxNumber || data.gstNumber || null,
    creditLimit: Number(data.creditLimit || 0),
    creditPeriod: data.creditPeriod || "30 Days",
    paymentTerms: data.paymentTerms || "Net 30",
    status: data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    totalOrders: 0,
    totalPurchasedMeters: 0,
    outstandingBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  customers.unshift(newCustomer);
  writeTenantData(companyId, "customers", customers);
  return newCustomer;
};

export const updateTextileCustomerRepo = async (companyId, id, data) => {
  const customers = readTenantData(companyId, "customers", []);
  const index = customers.findIndex(
    (c) =>
      c.id === id &&
      (!c.companyId || c.companyId === companyId) &&
      (c.erpType === "TEXTILE" || c.isTextile === true || c.category === "TEXTILE")
  );

  if (index === -1) {
    throw new Error("Textile customer not found or does not belong to your company.");
  }

  const existing = customers[index];
  const name = data.name !== undefined ? String(data.name).trim() : existing.name;
  if (!name) throw new Error("Customer name cannot be empty.");

  let phone = existing.phone;
  if (data.phone !== undefined) {
    phone = cleanPhoneNumber(data.phone);
    if (!validatePhoneNumber(phone, true)) {
      throw new Error("Phone number must contain exactly 10 digits");
    }
  }

  customers[index] = {
    ...existing,
    name,
    companyName: data.companyName !== undefined ? String(data.companyName).trim() : (data.name || existing.companyName),
    contactPerson: data.contactPerson !== undefined ? String(data.contactPerson).trim() : existing.contactPerson,
    phone,
    email: data.email !== undefined ? (String(data.email).trim() || null) : existing.email,
    customerType: data.customerType || existing.customerType,
    address: data.address !== undefined ? (String(data.address).trim() || null) : existing.address,
    city: data.city !== undefined ? (String(data.city).trim() || null) : existing.city,
    state: data.state !== undefined ? (String(data.state).trim() || null) : existing.state,
    country: data.country !== undefined ? (String(data.country).trim() || null) : existing.country,
    gstNumber: data.gstNumber !== undefined ? data.gstNumber : existing.gstNumber,
    taxNumber: data.taxNumber !== undefined ? data.taxNumber : existing.taxNumber,
    creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : existing.creditLimit,
    creditPeriod: data.creditPeriod || existing.creditPeriod,
    paymentTerms: data.paymentTerms || existing.paymentTerms,
    status: data.status ? (data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") : existing.status,
    companyId,
    erpType: "TEXTILE",
    isTextile: true,
    updatedAt: new Date().toISOString(),
  };

  writeTenantData(companyId, "customers", customers);
  return customers[index];
};

export const deleteTextileCustomerRepo = async (companyId, id) => {
  const customers = readTenantData(companyId, "customers", []);
  const index = customers.findIndex(
    (c) =>
      c.id === id &&
      (!c.companyId || c.companyId === companyId) &&
      (c.erpType === "TEXTILE" || c.isTextile === true || c.category === "TEXTILE")
  );

  if (index === -1) {
    throw new Error("Textile customer not found or does not belong to your company.");
  }

  const deleted = customers.splice(index, 1)[0];
  writeTenantData(companyId, "customers", customers);
  return { success: true, deletedId: id };
};

// ==========================================
// 11. TEXTILE EMPLOYEES & STAFF REPOSITORY
// ==========================================

const sanitizeEmployee = (user) => {
  if (!user) return null;
  const { passwordHash, plainPassword, verificationToken, verificationExpires, ...safe } = user;
  
  let parsedPerms = [];
  if (safe.permissions) {
    try {
      parsedPerms = typeof safe.permissions === "string" ? JSON.parse(safe.permissions) : safe.permissions;
    } catch {
      if (typeof safe.permissions === "string") {
        parsedPerms = safe.permissions.split(",").map((s) => s.trim().toUpperCase());
      }
    }
  }

  const normalized = normalizeTextileRole(safe.role || safe.roleRef?.name || "WEAVER");
  if ((!parsedPerms || parsedPerms.length === 0) && normalized && TEXTILE_ROLE_ACCESS[normalized]) {
    parsedPerms = TEXTILE_ROLE_ACCESS[normalized];
  }

  return {
    ...safe,
    permissions: parsedPerms,
    erpType: "TEXTILE",
    isTextile: true,
  };
};

export const getTextileEmployeesRepo = async (companyId, query = {}) => {
  let dbUsers = [];
  try {
    const whereConditions = [];

    if (companyId) {
      whereConditions.push({
        companyId,
        OR: [
          { type: "TEXTILE" },
          { type: null },
          { employeeId: { startsWith: "EMP" } },
        ],
      });
    } else {
      whereConditions.push({ type: "TEXTILE" });
    }

    dbUsers = await prisma.user.findMany({
      where: whereConditions.length > 0 ? { AND: whereConditions } : {},
      include: {
        branch: true,
        roleRef: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Database fetch error for textile employees:", err.message);
  }

  // Filter db users strictly for textile context
  const filteredDb = dbUsers.filter((u) => {
    if (companyId && u.companyId && u.companyId !== companyId) return false;
    if (u.type === "TEXTILE") return true;
    const roleStr = (u.role || u.roleRef?.name || "").toLowerCase();
    return (
      roleStr.includes("loom") ||
      roleStr.includes("weaver") ||
      roleStr.includes("spinning") ||
      roleStr.includes("dyeing") ||
      roleStr.includes("textile") ||
      roleStr.includes("mill") ||
      roleStr.includes("quality inspector") ||
      roleStr.includes("operator") ||
      u.employeeId?.startsWith("EMP-TEX")
    );
  });

  const jsonEmployees = readTenantData(companyId, "employees", []);

  // Merge database records with tenant json fallback to guarantee zero loss
  const mergedMap = new Map();

  filteredDb.forEach((u) => {
    const sanitized = sanitizeEmployee(u);
    if (sanitized?.id) mergedMap.set(sanitized.id, sanitized);
  });

  jsonEmployees.forEach((ju) => {
    if (ju?.id && !mergedMap.has(ju.id)) {
      mergedMap.set(ju.id, {
        ...ju,
        erpType: "TEXTILE",
        isTextile: true,
      });
    }
  });

  let allEmployees = Array.from(mergedMap.values());

  if (query.search) {
    const s = String(query.search).toLowerCase();
    allEmployees = allEmployees.filter(
      (e) =>
        e.fullName?.toLowerCase().includes(s) ||
        e.employeeId?.toLowerCase().includes(s) ||
        e.email?.toLowerCase().includes(s) ||
        e.phone?.toLowerCase().includes(s) ||
        e.role?.toLowerCase().includes(s)
    );
  }

  return allEmployees;
};

export const getTextileEmployeeByIdRepo = async (companyId, id) => {
  if (!id) {
    throw new Error("Employee ID is required.");
  }

  let dbUser = null;
  try {
    // Attempt lookup by uuid ID
    dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { employeeId: id },
        ],
      },
      include: {
        branch: true,
        roleRef: true,
      },
    });
  } catch (err) {
    console.error("Database lookup error for textile employee by id:", err.message);
  }

  if (dbUser) {
    // If companyId is passed, verify ownership
    if (companyId && dbUser.companyId && dbUser.companyId !== companyId) {
      throw new Error("Employee not found or does not belong to your company.");
    }
    return sanitizeEmployee(dbUser);
  }

  // Fallback to tenant json store
  const jsonEmployees = readTenantData(companyId, "employees", []);
  const jsonUser = jsonEmployees.find(
    (e) => (e.id === id || e.employeeId === id) && (!companyId || !e.companyId || e.companyId === companyId)
  );

  if (jsonUser) {
    return {
      ...jsonUser,
      erpType: "TEXTILE",
      isTextile: true,
    };
  }

  throw new Error("Textile employee not found.");
};

export const createTextileEmployeeRepo = async (companyId, data) => {
  const fullName = String(data.fullName || "").trim();
  const employeeId = String(data.employeeId || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const phone = cleanPhoneNumber(data.phone || "");
  const role = String(data.role || "Weaver").trim();
  const password = String(data.password || "123456").trim();
  const branchId = data.manufacturingUnitId || data.branchId || null;

  if (!fullName) throw new Error("Full name is required.");
  if (!employeeId) throw new Error("Employee ID is required.");
  if (!email) throw new Error("Email address is required.");
  if (!phone) throw new Error("Phone number is required.");
  if (!validatePhoneNumber(phone, true)) {
    throw new Error("Phone number must contain exactly 10 digits");
  }
  if (!role) throw new Error("Role / Designation is required.");


  const passwordHash = await bcrypt.hash(password, 12);

  // Check for uniqueness in prisma
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { employeeId }, { phone }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) throw new Error("Email already registered.");
    if (existingUser.employeeId === employeeId) throw new Error("Employee ID already exists.");
    if (existingUser.phone === phone) throw new Error("Phone number already registered.");
  }

  // Resolve or create role in Role table if present
  let roleId = null;
  try {
    let dbRole = await prisma.role.findFirst({
      where: { name: { equals: role, mode: "insensitive" } },
    });
    if (!dbRole) {
      dbRole = await prisma.role.create({ data: { name: role } });
    }
    roleId = dbRole?.id || null;
  } catch (rErr) {
    console.error("Role resolution error:", rErr.message);
  }

  // Resolve branch / manufacturing unit
  let resolvedBranchId = null;
  if (branchId) {
    try {
      const dbBranch = await prisma.branch.findFirst({
        where: {
          OR: [
            { id: branchId },
            { code: branchId },
            { name: { equals: branchId, mode: "insensitive" } },
          ],
        },
      });
      if (dbBranch) {
        resolvedBranchId = dbBranch.id;
      } else {
        const newBranch = await prisma.branch.create({
          data: {
            name: branchId.startsWith("mu-") ? "Main Textile Manufacturing Mill" : branchId,
            code: `MU-${Date.now().toString().slice(-4)}`,
            isActive: true,
          },
        });
        resolvedBranchId = newBranch.id;
      }
    } catch (bErr) {
      console.error("Branch resolution error:", bErr.message);
    }
  }

  let createdUser = null;
  try {
    createdUser = await prisma.user.create({
      data: {
        fullName,
        employeeId,
        email,
        phone,
        passwordHash,
        plainPassword: password,
        isVerified: true,
        firstLogin: false,
        role,
        roleId,
        branchId: resolvedBranchId,
        companyId: companyId || null,
        type: "TEXTILE",
        permissions: data.permissions ? (typeof data.permissions === "string" ? data.permissions : JSON.stringify(data.permissions)) : null,
      },
      include: {
        branch: true,
        roleRef: true,
      },
    });
  } catch (createErr) {
    console.error("Prisma user create error:", createErr.message);
    throw new Error(createErr.message || "Failed to create employee in database.");
  }

  const safe = sanitizeEmployee(createdUser);

  // Sync to tenant json store for backup persistence
  try {
    const jsonEmployees = readTenantData(companyId, "employees", []);
    jsonEmployees.unshift(safe);
    writeTenantData(companyId, "employees", jsonEmployees);
  } catch (jErr) {
    console.error("Failed to sync employee to tenant json:", jErr.message);
  }

  return safe;
};

export const updateTextileEmployeeRepo = async (companyId, id, data) => {
  if (!id) throw new Error("Employee ID is required.");

  const existing = await getTextileEmployeeByIdRepo(companyId, id);
  if (!existing) throw new Error("Textile employee not found.");

  const updatePayload = {};
  if (data.fullName !== undefined) updatePayload.fullName = String(data.fullName).trim();
  if (data.phone !== undefined) {
    const cleaned = cleanPhoneNumber(data.phone);
    if (!validatePhoneNumber(cleaned, true)) {
      throw new Error("Phone number must contain exactly 10 digits");
    }
    updatePayload.phone = cleaned;
  }
  if (data.email !== undefined) updatePayload.email = String(data.email).trim().toLowerCase();

  if (data.role !== undefined) updatePayload.role = String(data.role).trim();
  if (data.employeeId !== undefined) updatePayload.employeeId = String(data.employeeId).trim();
  if (data.manufacturingUnitId !== undefined || data.branchId !== undefined) {
    updatePayload.branchId = data.manufacturingUnitId || data.branchId || null;
  }
  if (data.permissions !== undefined) {
    updatePayload.permissions = typeof data.permissions === "string" ? data.permissions : JSON.stringify(data.permissions);
  }
  if (data.password && String(data.password).trim()) {
    updatePayload.passwordHash = await bcrypt.hash(String(data.password).trim(), 12);
    updatePayload.plainPassword = String(data.password).trim();
  }

  let updatedUser = null;
  try {
    updatedUser = await prisma.user.update({
      where: { id: existing.id },
      data: updatePayload,
      include: { branch: true, roleRef: true },
    });
  } catch (err) {
    console.error("Prisma employee update error:", err.message);
  }

  const safe = updatedUser ? sanitizeEmployee(updatedUser) : { ...existing, ...updatePayload };

  // Sync tenant json
  try {
    const jsonEmployees = readTenantData(companyId, "employees", []);
    const idx = jsonEmployees.findIndex((e) => e.id === existing.id || e.employeeId === existing.employeeId);
    if (idx !== -1) {
      jsonEmployees[idx] = { ...jsonEmployees[idx], ...safe };
    } else {
      jsonEmployees.unshift(safe);
    }
    writeTenantData(companyId, "employees", jsonEmployees);
  } catch (jErr) {
    console.error("Tenant json sync error on update:", jErr.message);
  }

  return safe;
};

export const deleteTextileEmployeeRepo = async (companyId, id) => {
  if (!id) throw new Error("Employee ID is required.");

  const existing = await getTextileEmployeeByIdRepo(companyId, id);
  if (!existing) throw new Error("Textile employee not found.");

  try {
    await prisma.user.delete({
      where: { id: existing.id },
    });
  } catch (err) {
    console.error("Prisma employee delete error:", err.message);
  }

  // Remove from tenant json
  try {
    const jsonEmployees = readTenantData(companyId, "employees", []);
    const filtered = jsonEmployees.filter((e) => e.id !== existing.id && e.employeeId !== existing.employeeId);
    writeTenantData(companyId, "employees", filtered);
  } catch (jErr) {
    console.error("Tenant json delete sync error:", jErr.message);
  }

  return { success: true, deletedId: existing.id };
};

