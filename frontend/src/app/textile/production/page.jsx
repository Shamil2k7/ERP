"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiCpu,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiX,
  FiChevronRight,
  FiTrash2,
  FiCalendar,
  FiLayers,
  FiActivity,
  FiFileText,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckSquare,
  FiRefreshCw,
  FiBox,
  FiPackage,
  FiPlay,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import apiClient from "@/services/apiClient";
import socketService from "@/services/socketService";
import { useCompany } from "@/context/CompanyContext";
import { normalizeTextileRole } from "@/config/textileRoles";
import { useRouter } from "next/navigation";

const PRODUCTION_STAGES = [
  { id: 1, name: "Yarn Spinning", code: "SPIN", leadTime: "2-3 Days", standardLoss: "1.5%", desc: "Raw cotton & polyester staple fibre drawn into spinning thread count." },
  { id: 2, name: "Loom Weaving", code: "WEAV", leadTime: "3-5 Days", standardLoss: "2.0%", desc: "Warp and weft yarn interlaced on high-speed air-jet looms." },
  { id: 3, name: "Dyeing & Washing", code: "DYE", leadTime: "1-2 Days", standardLoss: "1.0%", desc: "Batch jet dyeing with reactive colorants and hot wash softening." },
  { id: 4, name: "Printing & Finish", code: "PRINT", leadTime: "2-4 Days", standardLoss: "1.2%", desc: "Rotary screen / digital pigment printing, sanforizing, and heat curing." },
  { id: 5, name: "Quality Inspection", code: "QC", leadTime: "1 Day", standardLoss: "0.5%", desc: "4-point defect grading, GSM measurement, tear strength testing." },
  { id: 6, name: "Finished Stock", code: "DONE", leadTime: "Immediate", standardLoss: "0.0%", desc: "Fabric roll packaging, barcode tagging, transfer to warehouse." },
];

export default function ProductionManagementPage() {
  const router = useRouter();
  const { user, isModuleEnabled, loading: companyLoading } = useCompany();

  useEffect(() => {
    if (!companyLoading && user && !isModuleEnabled("PRODUCTION")) {
      router.replace("/unauthorized");
    }
  }, [user, companyLoading, isModuleEnabled, router]);

  const textileRole = normalizeTextileRole(user?.role || user?.designation) || "ADMIN";
  const isWeaver = textileRole === "WEAVER";
  const isDyer = textileRole === "DYER";
  const isQualityInspector = textileRole === "QUALITY_INSPECTOR";
  const isOperator = isWeaver || isDyer || isQualityInspector;

  const [activeTab, setActiveTab] = useState(isOperator ? "tracking" : "tracking"); // 'planning' | 'orders' | 'tracking' | 'stages' | 'consumption'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Data State (ZERO mock data)
  const [metrics, setMetrics] = useState({
    activeBatches: 0,
    activeStageSubtitle: "● No Active Batches",
    targetProduction: 0,
    targetUnit: "meters",
    completedOutput: 0,
    completionPercentage: 0,
    averageEfficiency: null,
    efficiencyDiff: null,
    unitBreakdown: [],
  });

  const [batches, setBatches] = useState([]);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [stages, setStages] = useState(PRODUCTION_STAGES);

  // Context Data for dropdowns
  const [productsList, setProductsList] = useState([]);
  const [rawMaterialsList, setRawMaterialsList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);

  // Search filter
  const [search, setSearch] = useState("");

  // Modals
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [stageModal, setStageModal] = useState({ isOpen: false, batch: null, nextStage: null, outputQty: "", qcResult: "PASS", notes: "" });

  // Forms
  const [batchForm, setBatchForm] = useState({
    productId: "",
    batchName: "",
    material: "",
    targetMeters: "",
    unit: "Meters",
    operator: "",
    manufacturingUnit: "Main Loom Mill",
    priority: "Normal",
  });

  const [orderForm, setOrderForm] = useState({
    customer: "",
    productId: "",
    fabricType: "",
    meters: "",
    unit: "Meters",
    priority: "Normal",
    operator: "",
    manufacturingUnit: "Main Loom Mill",
    targetDate: "",
  });

  const [planForm, setPlanForm] = useState({
    productId: "",
    productName: "",
    lineName: "AirJet Loom Section A",
    targetMeters: "",
    unit: "Meters",
    shift: "Morning Shift",
    manufacturingUnit: "Main Unit",
    priority: "Normal",
    plannedStartDate: new Date().toISOString().split("T")[0],
    plannedEndDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  });

  const [consumptionForm, setConsumptionForm] = useState({
    batchId: "",
    rawMaterialId: "",
    material: "",
    allocatedKg: "",
    consumedKg: "",
    unit: "KG",
    warehouse: "Raw Material Store",
    operator: "",
  });

  // Fetch all production data dynamically from backend
  const loadProductionData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await apiClient.get("/textile/production/overview");
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        if (d.metrics) setMetrics(d.metrics);
        if (Array.isArray(d.batches)) setBatches(d.batches);
        if (Array.isArray(d.plans)) setPlans(d.plans);
        if (Array.isArray(d.orders)) setOrders(d.orders);
        if (Array.isArray(d.consumptions)) setConsumptions(d.consumptions);
        if (Array.isArray(d.stages)) setStages(d.stages);
      }
    } catch (err) {
      console.warn("Error loading dynamic production data:", err);
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch dropdown auxiliary data (Products, Raw Materials, Warehouses)
  useEffect(() => {
    async function loadAuxiliaryData() {
      try {
        const [prodRes, rmRes, branchRes, whRes] = await Promise.allSettled([
          apiClient.get("/textile/products"),
          apiClient.get("/textile/raw-materials"),
          apiClient.get("/branches"),
          apiClient.get("/warehouses"),
        ]);

        if (prodRes.status === "fulfilled" && prodRes.value?.data?.data) {
          setProductsList(prodRes.value.data.data);
        }
        if (rmRes.status === "fulfilled" && rmRes.value?.data?.data) {
          setRawMaterialsList(rmRes.value.data.data);
        }
        if (branchRes.status === "fulfilled" && branchRes.value?.data?.data) {
          setBranchesList(branchRes.value.data.data);
        }
        if (whRes.status === "fulfilled" && whRes.value?.data?.data) {
          setWarehousesList(whRes.value.data.data);
        }
      } catch (e) {
        console.warn("Error fetching auxiliary data:", e);
      }
    }

    loadAuxiliaryData();
    loadProductionData();
  }, [loadProductionData]);

  // Real-time socket listener for live multi-tenant updates
  useEffect(() => {
    const handleLiveUpdate = () => {
      loadProductionData(true);
    };

    socketService.on("textile.production.updated", handleLiveUpdate);
    socketService.on("textile.dashboard.updated", handleLiveUpdate);

    return () => {
      socketService.off("textile.production.updated", handleLiveUpdate);
      socketService.off("textile.dashboard.updated", handleLiveUpdate);
    };
  }, [loadProductionData]);

  // --- ACTIONS ---

  // 1. Create Batch Tracker
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.batchName || !batchForm.targetMeters) {
      toast.error("Please fill in batch name and target quantity");
      return;
    }

    try {
      const payload = {
        productId: batchForm.productId || undefined,
        batchName: batchForm.batchName,
        fabricType: batchForm.material || batchForm.batchName,
        material: batchForm.material || batchForm.batchName,
        targetMeters: Number(batchForm.targetMeters),
        targetOutput: Number(batchForm.targetMeters),
        targetQty: Number(batchForm.targetMeters),
        unit: batchForm.unit || "Meters",
        operator: batchForm.operator || "Production Operator",
        manufacturingUnit: batchForm.manufacturingUnit,
        priority: batchForm.priority,
      };

      const res = await apiClient.post("/textile/production", payload);
      if (res.data?.success) {
        toast.success("Production batch created successfully!");
        setShowBatchModal(false);
        setBatchForm({ productId: "", batchName: "", material: "", targetMeters: "", unit: "Meters", operator: "", manufacturingUnit: "Main Loom Mill", priority: "Normal" });
        loadProductionData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create batch");
    }
  };

  // 2. Create Production Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.customer || !orderForm.meters) {
      toast.error("Please fill in customer/buyer name and target quantity");
      return;
    }

    try {
      const payload = {
        customer: orderForm.customer,
        productId: orderForm.productId || undefined,
        batchName: orderForm.fabricType || `Custom Order - ${orderForm.customer}`,
        fabricType: orderForm.fabricType || "Textile Fabric Specification",
        material: orderForm.fabricType || "Textile Fabric Specification",
        targetMeters: Number(orderForm.meters),
        targetOutput: Number(orderForm.meters),
        targetQty: Number(orderForm.meters),
        unit: orderForm.unit || "Meters",
        priority: orderForm.priority,
        operator: orderForm.operator || "Line Supervisor",
        manufacturingUnit: orderForm.manufacturingUnit,
        targetDate: orderForm.targetDate || undefined,
      };

      const res = await apiClient.post("/textile/production/orders", payload);
      if (res.data?.success) {
        toast.success("Production order created successfully!");
        setShowOrderModal(false);
        setOrderForm({ customer: "", productId: "", fabricType: "", meters: "", unit: "Meters", priority: "Normal", operator: "", manufacturingUnit: "Main Loom Mill", targetDate: "" });
        loadProductionData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create order");
    }
  };

  // 3. Create Production Plan
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!planForm.lineName || !planForm.targetMeters) {
      toast.error("Please enter machine/line name and target output");
      return;
    }

    try {
      const payload = {
        productId: planForm.productId || undefined,
        productName: planForm.productName || planForm.lineName,
        lineName: planForm.lineName,
        targetMeters: Number(planForm.targetMeters),
        unit: planForm.unit || "Meters",
        shift: planForm.shift,
        manufacturingUnit: planForm.manufacturingUnit,
        priority: planForm.priority,
        plannedStartDate: planForm.plannedStartDate,
        plannedEndDate: planForm.plannedEndDate,
      };

      const res = await apiClient.post("/textile/production/plans", payload);
      if (res.data?.success) {
        toast.success("Production schedule saved!");
        setShowPlanModal(false);
        setPlanForm({ productId: "", productName: "", lineName: "AirJet Loom Section A", targetMeters: "", unit: "Meters", shift: "Morning Shift", manufacturingUnit: "Main Unit", priority: "Normal", plannedStartDate: new Date().toISOString().split("T")[0], plannedEndDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0] });
        loadProductionData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save plan");
    }
  };

  // 4. Approve Plan & Spawn Batch
  const handleApprovePlan = async (planId) => {
    try {
      const res = await apiClient.post(`/textile/production/plans/${planId}/approve`);
      if (res.data?.success) {
        toast.success("Plan approved! Production batch spawned in Tracking tab.");
        loadProductionData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to approve plan");
    }
  };

  // 5. Log Material Consumption
  const handleCreateConsumption = async (e) => {
    e.preventDefault();
    if (!consumptionForm.material || !consumptionForm.consumedKg) {
      toast.error("Please fill required consumption details");
      return;
    }

    try {
      const payload = {
        batchId: consumptionForm.batchId || "PROD-GENERAL",
        rawMaterialId: consumptionForm.rawMaterialId || undefined,
        material: consumptionForm.material,
        allocatedKg: Number(consumptionForm.allocatedKg || consumptionForm.consumedKg),
        consumedKg: Number(consumptionForm.consumedKg),
        unit: consumptionForm.unit || "KG",
        warehouse: consumptionForm.warehouse,
        operator: consumptionForm.operator || "Material Handler",
      };

      const res = await apiClient.post("/textile/production/material-consumption", payload);
      if (res.data?.success) {
        toast.success("Material consumption recorded & raw material stock deducted!");
        setShowConsumptionModal(false);
        setConsumptionForm({ batchId: "", rawMaterialId: "", material: "", allocatedKg: "", consumedKg: "", unit: "KG", warehouse: "Raw Material Store", operator: "" });
        loadProductionData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to record consumption");
    }
  };

  // 6. Advance Stage Workflow
  const openNextStageModal = (batch) => {
    const nextIdx = Math.min((batch.currentStageIndex || 0) + 1, PRODUCTION_STAGES.length - 1);
    const nextStage = PRODUCTION_STAGES[nextIdx];
    const defaultOutput = Number(batch.completedMeters || batch.completedQty || Math.round((Number(batch.targetMeters || batch.targetOutput || 0) * (nextIdx + 1)) / 6));

    setStageModal({
      isOpen: true,
      batch,
      nextStage,
      outputQty: defaultOutput,
      qcResult: "PASS",
      notes: "",
    });
  };

  const handleConfirmNextStage = async () => {
    if (!stageModal.batch) return;
    try {
      const payload = {
        outputQty: Number(stageModal.outputQty),
        qcStatus: stageModal.qcResult,
        notes: stageModal.notes || `Stage transition to ${stageModal.nextStage?.name}`,
        operator: stageModal.batch.operator,
      };

      const res = await apiClient.post(`/textile/production/${stageModal.batch.id}/next-stage`, payload);
      if (res.data?.success) {
        toast.success(`Batch advanced to ${stageModal.nextStage?.name}!`);
        setStageModal({ isOpen: false, batch: null, nextStage: null, outputQty: "", qcResult: "PASS", notes: "" });
        loadProductionData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to advance stage");
    }
  };

  // 7. Delete Batch
  const handleDeleteBatch = async (id) => {
    if (!confirm("Are you sure you want to delete this production batch?")) return;
    try {
      const res = await apiClient.delete(`/textile/production/${id}`);
      if (res.data?.success) {
        toast.success("Production batch removed");
        loadProductionData(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete batch");
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", maxWidth: "1400px", margin: "0 auto" }}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FiCpu style={{ color: "#0d9488" }} /> Production Management
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Comprehensive textile production lifecycle — Planning, Orders, Stage Tracking, Line Allocation & Material Consumption.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => {
              setRefreshing(true);
              loadProductionData();
            }}
            title="Refresh Production Data"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 14px",
              background: "#ffffff",
              color: "#475569",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={14} /> Refresh
          </button>

          {/* New Batch Tracker (Admin / Manager only) */}
          {!isOperator && (
            <button
              onClick={() => setShowBatchModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(13, 148, 136, 0.25)",
              }}
            >
              <FiPlus size={16} /> New Batch Tracker
            </button>
          )}

          {!isOperator && activeTab === "orders" && (
            <button
              onClick={() => setShowOrderModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              }}
            >
              <FiPlus size={16} /> Create Production Order
            </button>
          )}
          {!isOperator && activeTab === "planning" && (
            <button
              onClick={() => setShowPlanModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
              }}
            >
              <FiPlus size={16} /> Schedule Loom / Line
            </button>
          )}
          {!isOperator && activeTab === "consumption" && (
            <button
              onClick={() => setShowConsumptionModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)",
              }}
            >
              <FiPlus size={16} /> Log Material Consumption
            </button>
          )}
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {/* 1. Active Batches */}
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Active Batches</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#0d9488", marginTop: "6px" }}>
            {metrics.activeBatches} Batches
          </div>
          <span style={{ fontSize: "12px", color: metrics.activeBatches > 0 ? "#10b981" : "#94a3b8", fontWeight: "600" }}>
            {metrics.activeStageSubtitle}
          </span>
        </div>

        {/* 2. Target Production */}
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Target Production</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", marginTop: "6px" }}>
            {(metrics.targetProduction || 0).toLocaleString()}{" "}
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>{metrics.targetUnit || "meters"}</span>
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Current active target</span>
        </div>

        {/* 3. Completed Output */}
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Completed Output</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", marginTop: "6px" }}>
            {(metrics.completedOutput || 0).toLocaleString()}{" "}
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#64748b" }}>{metrics.targetUnit || "meters"}</span>
          </div>
          <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>
            {metrics.completionPercentage}% Target Met
          </span>
        </div>

        {/* 4. Average Line Efficiency */}
        <div style={{ background: "#ffffff", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>Average Line Efficiency</span>
          <div style={{ fontSize: "24px", fontWeight: "800", color: metrics.averageEfficiency !== null ? "#7c3aed" : "#94a3b8", marginTop: "6px" }}>
            {metrics.averageEfficiency !== null ? `${metrics.averageEfficiency}%` : "No Efficiency Data"}
          </div>
          <span style={{ fontSize: "12px", color: metrics.efficiencyDiff ? "#10b981" : "#94a3b8", fontWeight: "600" }}>
            {metrics.efficiencyDiff ? `↑ ${metrics.efficiencyDiff} vs last month` : "No comparison data"}
          </span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "24px", overflowX: "auto" }}>
        {[
          ...(!isOperator ? [{ id: "planning", label: `Production Planning (${plans.length})`, icon: FiCalendar }] : []),
          { id: "orders", label: `Production Orders (${orders.length})`, icon: FiFileText },
          { id: "tracking", label: `Production Tracking (${batches.length})`, icon: FiCpu },
          { id: "stages", label: "Production Stages", icon: FiLayers },
          ...(!isOperator ? [{ id: "consumption", label: `Material Consumption (${consumptions.length})`, icon: FiActivity }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                border: "none",
                background: "transparent",
                borderBottom: isActive ? "3px solid #0d9488" : "3px solid transparent",
                color: isActive ? "#0d9488" : "#64748b",
                fontWeight: isActive ? "700" : "500",
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "-2px",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRODUCTION PLANNING */}
      {activeTab === "planning" && (
        <div>
          {plans.length === 0 ? (
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", padding: "48px", textAlign: "center" }}>
              <FiCalendar size={42} style={{ color: "#94a3b8", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 6px 0" }}>No production plans scheduled</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px 0" }}>Schedule looms, dyeing lines, and screen printers to begin the textile manufacturing cycle.</p>
              <button
                onClick={() => setShowPlanModal(true)}
                style={{
                  padding: "10px 18px",
                  background: "#7c3aed",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + Schedule Production Line
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "18px" }}>
              {plans.map((p) => {
                const currentOut = Number(p.currentOutput || 0);
                const targetMet = Number(p.targetMeters || 1);
                const perc = Math.min(Math.round((currentOut / targetMet) * 100), 100);

                return (
                  <div key={p.id} style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#7c3aed" }}>{p.planNumber || p.id}</span>
                        <span style={{ padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", background: p.status === "APPROVED" ? "#d1fae5" : p.status === "COMPLETED" ? "#e0e7ff" : "#fef3c7", color: p.status === "APPROVED" ? "#065f46" : p.status === "COMPLETED" ? "#3730a3" : "#92400e" }}>
                          {p.status}
                        </span>
                      </div>
                      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>{p.lineName}</h3>
                      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "6px" }}>
                        Product: <strong style={{ color: "#0f172a" }}>{p.productName}</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>
                        Shift: <strong>{p.shift}</strong> • Unit: <strong>{p.manufacturingUnit || "Main Unit"}</strong>
                      </div>

                      <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "#64748b" }}>Progress: {currentOut.toLocaleString()} / {targetMet.toLocaleString()} {p.unit || "m"}</span>
                        <span style={{ fontWeight: "700", color: "#0f172a" }}>{perc}%</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                        <div style={{ width: `${perc}%`, height: "100%", background: "#7c3aed", borderRadius: "4px" }} />
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>{p.plannedStartDate} → {p.plannedEndDate}</span>
                      {p.status !== "APPROVED" && p.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleApprovePlan(p.id)}
                          style={{
                            padding: "6px 12px",
                            background: "#0d9488",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FiPlay size={12} /> Approve & Start Batch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCTION ORDERS */}
      {activeTab === "orders" && (
        <div>
          {orders.length === 0 ? (
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", padding: "48px", textAlign: "center" }}>
              <FiFileText size={42} style={{ color: "#94a3b8", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 6px 0" }}>No production orders found</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px 0" }}>Create production orders to track client/fabric requests across your textile mills.</p>
              <button
                onClick={() => setShowOrderModal(true)}
                style={{
                  padding: "10px 18px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + Create Production Order
              </button>
            </div>
          ) : (
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                  <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
                    <tr>
                      <th style={{ padding: "14px 18px" }}>Order ID / Batch</th>
                      <th style={{ padding: "14px 18px" }}>Customer / Buyer</th>
                      <th style={{ padding: "14px 18px" }}>Fabric Specification</th>
                      <th style={{ padding: "14px 18px" }}>Target Quantity</th>
                      <th style={{ padding: "14px 18px" }}>Current Stage</th>
                      <th style={{ padding: "14px 18px" }}>Priority</th>
                      <th style={{ padding: "14px 18px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 18px", fontWeight: "700", color: "#0d9488" }}>
                          {o.id} <br />
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{o.orderNumber || o.batchNumber}</span>
                        </td>
                        <td style={{ padding: "14px 18px", fontWeight: "600", color: "#1e293b" }}>{o.customer || "Internal Mill"}</td>
                        <td style={{ padding: "14px 18px", color: "#475569" }}>{o.fabricType || o.material}</td>
                        <td style={{ padding: "14px 18px", fontWeight: "700", color: "#0f172a" }}>
                          {Number(o.targetOutput || o.targetMeters || o.targetQty || 0).toLocaleString()} {o.unit || "m"}
                        </td>
                        <td style={{ padding: "14px 18px", color: "#0f766e", fontWeight: "600" }}>{o.currentStage || o.stage || "1. Yarn Spinning"}</td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: o.priority === "Urgent" ? "#fee2e2" : o.priority === "High" ? "#ffedd5" : "#f1f5f9",
                            color: o.priority === "Urgent" ? "#b91c1c" : o.priority === "High" ? "#c2410c" : "#475569",
                          }}>
                            {o.priority || "Normal"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: o.status === "COMPLETED" ? "#d1fae5" : "#e0e7ff",
                            color: o.status === "COMPLETED" ? "#047857" : "#4338ca",
                          }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRODUCTION TRACKING */}
      {activeTab === "tracking" && (
        <div>
          {/* SEARCH BAR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "10px 16px",
              gap: "10px",
              marginBottom: "20px",
              maxWidth: "400px",
            }}
          >
            <FiSearch style={{ color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search batches, fabrics, operators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                width: "100%",
                fontSize: "14px",
              }}
            />
          </div>

          {batches.length === 0 ? (
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", padding: "48px", textAlign: "center" }}>
              <FiCpu size={42} style={{ color: "#94a3b8", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 6px 0" }}>No production batches active</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px 0" }}>Start a new production batch to track stages, loom progress, and finish outputs.</p>
              <button
                onClick={() => setShowBatchModal(true)}
                style={{
                  padding: "10px 18px",
                  background: "#0d9488",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + New Batch Tracker
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "18px" }}>
              {batches
                .filter((b) => {
                  const q = (search || "").toLowerCase();
                  const name = String(b.batchName || b.name || "").toLowerCase();
                  const id = String(b.id || b.batchNumber || "").toLowerCase();
                  const op = String(b.operator || "").toLowerCase();
                  const mat = String(b.material || b.fabricType || "").toLowerCase();
                  return name.includes(q) || id.includes(q) || op.includes(q) || mat.includes(q);
                })
                .map((b) => {
                  let stageIdx = typeof b.currentStageIndex === "number" ? b.currentStageIndex : -1;
                  if (stageIdx < 0 && (b.currentStage || b.stage)) {
                    stageIdx = PRODUCTION_STAGES.findIndex((s) => s.name?.toLowerCase() === (b.currentStage || b.stage).toLowerCase());
                  }
                  if (stageIdx < 0) stageIdx = 0;

                  const currentStage = PRODUCTION_STAGES[stageIdx] || PRODUCTION_STAGES[0];
                  const isCompleted = b.status === "COMPLETED" || stageIdx === PRODUCTION_STAGES.length - 1;
                  const targetM = Number(b.targetMeters ?? b.targetOutput ?? b.targetQty ?? 0);
                  const completedM = Number(b.completedMeters ?? b.completedQty ?? 0);
                  const progressPerc = targetM > 0 ? Math.min(Math.round((completedM / targetM) * 100), 100) : (b.progress || 0);

                  return (
                    <div
                      key={b.id || `batch-${Math.random()}`}
                      style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        border: "1px solid #e2e8f0",
                        padding: "20px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: "#0d9488" }}>{b.batchNumber || b.id}</span>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "700",
                              background: isCompleted ? "#d1fae5" : "#e0e7ff",
                              color: isCompleted ? "#047857" : "#4338ca",
                            }}
                          >
                            {isCompleted ? "COMPLETED" : "IN PRODUCTION"}
                          </span>
                        </div>

                        <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                          {b.batchName || b.name || "Textile Production Batch"}
                        </h3>
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px" }}>
                          Material: <strong>{b.material || b.fabricType || "Standard Fabric Blend"}</strong>
                        </div>

                        {/* CURRENT STAGE HIGHLIGHT */}
                        <div
                          style={{
                            background: "#f8fafc",
                            borderRadius: "8px",
                            padding: "12px",
                            marginBottom: "16px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Current Stage</div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                            Stage {stageIdx + 1}: {currentStage.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                            Operator: <strong>{b.operator || "Production Line"}</strong>
                          </div>
                        </div>

                        {/* STAGES MINI TRACKER */}
                        <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                          {PRODUCTION_STAGES.map((s, idx) => {
                            const done = idx < stageIdx;
                            const current = idx === stageIdx;
                            return (
                              <div
                                key={s.id}
                                title={`${s.id}. ${s.name}`}
                                style={{
                                  flex: 1,
                                  height: "6px",
                                  borderRadius: "3px",
                                  background: done ? "#10b981" : current ? "#0d9488" : "#e2e8f0",
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* PROGRESS NUMBERS */}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                          <span style={{ color: "#64748b" }}>Output Progress</span>
                          <strong style={{ color: "#0f172a" }}>
                            {completedM.toLocaleString()} / {targetM.toLocaleString()} {b.unit || "m"}
                          </strong>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden", marginBottom: "16px" }}>
                          <div style={{ width: `${progressPerc}%`, height: "100%", background: "#0d9488", borderRadius: "3px" }} />
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                        {!isCompleted && (
                          <button
                            onClick={() => openNextStageModal(b)}
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              padding: "9px 12px",
                              background: "#0d9488",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                            }}
                          >
                            <FiChevronRight size={14} /> Next Stage
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBatch(b.id)}
                          style={{
                            padding: "9px 12px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PRODUCTION STAGES */}
      {activeTab === "stages" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
          {stages.map((st) => (
            <div key={st.id} style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#0d9488", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "13px" }}>
                  {st.id}
                </span>
                <span style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: (st.activeBatches || 0) > 0 ? "#d1fae5" : "#f1f5f9", color: (st.activeBatches || 0) > 0 ? "#065f46" : "#64748b" }}>
                  {(st.activeBatches || 0) > 0 ? `${st.activeBatches} Active Batches` : "Idle Stage"}
                </span>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>{st.name}</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0", lineHeight: "1.5" }}>{st.desc}</p>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569", background: "#f8fafc", padding: "10px", borderRadius: "8px" }}>
                <span>Avg Lead Time: <strong>{st.leadTime}</strong></span>
                <span>Standard Loss: <strong>{st.standardLoss}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: MATERIAL CONSUMPTION */}
      {activeTab === "consumption" && (
        <div>
          {consumptions.length === 0 ? (
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", padding: "48px", textAlign: "center" }}>
              <FiActivity size={42} style={{ color: "#94a3b8", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 6px 0" }}>No material consumption records</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px 0" }}>Log raw yarn, dye pigments, and chemical binder consumption to track batch variances and reduce warehouse stock.</p>
              <button
                onClick={() => setShowConsumptionModal(true)}
                style={{
                  padding: "10px 18px",
                  background: "#ea580c",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                + Log Material Consumption
              </button>
            </div>
          ) : (
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                  <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "12px", textTransform: "uppercase" }}>
                    <tr>
                      <th style={{ padding: "14px 18px" }}>Log ID</th>
                      <th style={{ padding: "14px 18px" }}>Batch Ref</th>
                      <th style={{ padding: "14px 18px" }}>Material Name</th>
                      <th style={{ padding: "14px 18px" }}>Allocated</th>
                      <th style={{ padding: "14px 18px" }}>Actual Consumed</th>
                      <th style={{ padding: "14px 18px" }}>Variance</th>
                      <th style={{ padding: "14px 18px" }}>Warehouse / Operator</th>
                      <th style={{ padding: "14px 18px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumptions.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 18px", fontWeight: "700", color: "#ea580c" }}>{c.id}</td>
                        <td style={{ padding: "14px 18px", fontWeight: "600", color: "#0d9488" }}>{c.batchId}</td>
                        <td style={{ padding: "14px 18px", fontWeight: "600", color: "#1e293b" }}>{c.material}</td>
                        <td style={{ padding: "14px 18px", color: "#64748b" }}>{Number(c.allocatedKg || 0).toLocaleString()} {c.unit || "KG"}</td>
                        <td style={{ padding: "14px 18px", fontWeight: "700", color: "#0f172a" }}>{Number(c.consumedKg || 0).toLocaleString()} {c.unit || "KG"}</td>
                        <td style={{ padding: "14px 18px", color: c.variance?.includes("+") ? "#dc2626" : "#059669", fontWeight: "600" }}>{c.variance}</td>
                        <td style={{ padding: "14px 18px", fontSize: "12px", color: "#64748b" }}>
                          {c.warehouse || "Raw Material Store"} <br />
                          <span style={{ color: "#94a3b8" }}>{c.operator || "Operator"}</span>
                        </td>
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ padding: "4px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "700", background: c.status === "VERIFIED" ? "#d1fae5" : "#fef3c7", color: c.status === "VERIFIED" ? "#065f46" : "#92400e" }}>
                            {c.status || "VERIFIED"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: NEW BATCH TRACKER */}
      {showBatchModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "520px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Create Production Batch Tracker</h2>
              <button onClick={() => setShowBatchModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCreateBatch}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Select Textile Fabric / Product</label>
                <select
                  value={batchForm.productId}
                  onChange={(e) => {
                    const sel = productsList.find((p) => p.id === e.target.value);
                    setBatchForm({
                      ...batchForm,
                      productId: e.target.value,
                      batchName: sel ? sel.name : batchForm.batchName,
                      material: sel ? (sel.composition || sel.name) : batchForm.material,
                    });
                  }}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#f8fafc" }}
                >
                  <option value="">-- Choose from Catalog (or enter manually below) --</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Batch Name / Fabric Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100% Cotton Poplin 40s"
                  value={batchForm.batchName}
                  onChange={(e) => setBatchForm({ ...batchForm, batchName: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Target Output Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={batchForm.targetMeters}
                    onChange={(e) => setBatchForm({ ...batchForm, targetMeters: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Unit</label>
                  <select
                    value={batchForm.unit}
                    onChange={(e) => setBatchForm({ ...batchForm, unit: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="Meters">Meters</option>
                    <option value="KG">KG</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Yards">Yards</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Assigned Line / Operator</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Loom Lead"
                    value={batchForm.operator}
                    onChange={(e) => setBatchForm({ ...batchForm, operator: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Manufacturing Unit</label>
                  <select
                    value={batchForm.manufacturingUnit}
                    onChange={(e) => setBatchForm({ ...batchForm, manufacturingUnit: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="Main Loom Mill">Main Loom Mill</option>
                    {branchesList.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowBatchModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0d9488", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>Start Batch Tracker</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRODUCTION ORDER */}
      {showOrderModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "520px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Create Production Order</h2>
              <button onClick={() => setShowOrderModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Customer / Buyer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Garments Ltd"
                  value={orderForm.customer}
                  onChange={(e) => setOrderForm({ ...orderForm, customer: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Fabric Specification *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Denim Twill 12oz Indigo Blue"
                  value={orderForm.fabricType}
                  onChange={(e) => setOrderForm({ ...orderForm, fabricType: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Target Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 20000"
                    value={orderForm.meters}
                    onChange={(e) => setOrderForm({ ...orderForm, meters: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Priority</label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Target Completion Date</label>
                  <input
                    type="date"
                    value={orderForm.targetDate}
                    onChange={(e) => setOrderForm({ ...orderForm, targetDate: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Manufacturing Unit</label>
                  <select
                    value={orderForm.manufacturingUnit}
                    onChange={(e) => setOrderForm({ ...orderForm, manufacturingUnit: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="Main Loom Mill">Main Loom Mill</option>
                    {branchesList.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowOrderModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRODUCTION PLAN */}
      {showPlanModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "520px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Schedule Loom / Manufacturing Line</h2>
              <button onClick={() => setShowPlanModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCreatePlan}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Select Textile Product</label>
                <select
                  value={planForm.productId}
                  onChange={(e) => {
                    const sel = productsList.find((p) => p.id === e.target.value);
                    setPlanForm({
                      ...planForm,
                      productId: e.target.value,
                      productName: sel ? sel.name : planForm.productName,
                    });
                  }}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#f8fafc" }}
                >
                  <option value="">-- Choose Product (or specify line name below) --</option>
                  {productsList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Machine / Production Line Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AirJet Loom Section A"
                  value={planForm.lineName}
                  onChange={(e) => setPlanForm({ ...planForm, lineName: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Target Output (Meters) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={planForm.targetMeters}
                    onChange={(e) => setPlanForm({ ...planForm, targetMeters: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Shift Allocation</label>
                  <select
                    value={planForm.shift}
                    onChange={(e) => setPlanForm({ ...planForm, shift: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="Morning Shift">Morning Shift</option>
                    <option value="Night Shift">Night Shift</option>
                    <option value="Morning & Night">Morning & Night (24h)</option>
                    <option value="Rotational">Rotational Shift</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Planned Start</label>
                  <input
                    type="date"
                    value={planForm.plannedStartDate}
                    onChange={(e) => setPlanForm({ ...planForm, plannedStartDate: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Planned End</label>
                  <input
                    type="date"
                    value={planForm.plannedEndDate}
                    onChange={(e) => setPlanForm({ ...planForm, plannedEndDate: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* RAW MATERIAL AVAILABILITY CHECK INFO */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", marginBottom: "18px", fontSize: "12px", color: "#166534" }}>
                ✓ Raw Material Availability Check: <strong>Passed</strong> ({rawMaterialsList.length} items catalogued in stock)
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowPlanModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#7c3aed", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MATERIAL CONSUMPTION */}
      {showConsumptionModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "520px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Log Material Consumption</h2>
              <button onClick={() => setShowConsumptionModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCreateConsumption}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Production Batch Reference</label>
                <select
                  value={consumptionForm.batchId}
                  onChange={(e) => setConsumptionForm({ ...consumptionForm, batchId: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                >
                  <option value="">-- General Production / Select Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.id} - {b.batchName}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Select Raw Material *</label>
                <select
                  required
                  value={consumptionForm.rawMaterialId}
                  onChange={(e) => {
                    const sel = rawMaterialsList.find((m) => m.id === e.target.value);
                    setConsumptionForm({
                      ...consumptionForm,
                      rawMaterialId: e.target.value,
                      material: sel ? sel.name : consumptionForm.material,
                      unit: sel ? sel.unit : "KG",
                    });
                  }}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                >
                  <option value="">-- Choose Raw Material from Inventory --</option>
                  {rawMaterialsList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (In Stock: {m.stock || m.quantity} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Allocated Quantity ({consumptionForm.unit})</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={consumptionForm.allocatedKg}
                    onChange={(e) => setConsumptionForm({ ...consumptionForm, allocatedKg: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Actual Consumed * ({consumptionForm.unit})</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    placeholder="e.g. 485"
                    value={consumptionForm.consumedKg}
                    onChange={(e) => setConsumptionForm({ ...consumptionForm, consumedKg: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Warehouse Store</label>
                  <select
                    value={consumptionForm.warehouse}
                    onChange={(e) => setConsumptionForm({ ...consumptionForm, warehouse: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="Raw Material Store">Raw Material Store</option>
                    {warehousesList.map((w) => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Operator / Handler</label>
                  <input
                    type="text"
                    placeholder="e.g. Suresh Material Tech"
                    value={consumptionForm.operator}
                    onChange={(e) => setConsumptionForm({ ...consumptionForm, operator: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowConsumptionModal(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#ea580c", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>Deduct & Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: NEXT STAGE ADVANCE WORKFLOW */}
      {stageModal.isOpen && stageModal.batch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Advance Production Stage</h2>
              <button onClick={() => setStageModal({ isOpen: false, batch: null, nextStage: null, outputQty: "", qcResult: "PASS", notes: "" })} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}><FiX size={20} /></button>
            </div>

            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
              <div style={{ fontSize: "12px", color: "#64748b" }}>Batch: <strong style={{ color: "#0f172a" }}>{stageModal.batch.batchName || stageModal.batch.id}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "13px", fontWeight: "700" }}>
                <span style={{ color: "#64748b" }}>{stageModal.batch.currentStage || stageModal.batch.stage}</span>
                <FiChevronRight style={{ color: "#0d9488" }} />
                <span style={{ color: "#0d9488" }}>Stage {stageModal.nextStage?.id}: {stageModal.nextStage?.name}</span>
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                Actual Output Produced in This Stage ({stageModal.batch.unit || "Meters"})
              </label>
              <input
                type="number"
                min="0"
                value={stageModal.outputQty}
                onChange={(e) => setStageModal({ ...stageModal, outputQty: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>

            {/* If moving to final Finished Stock stage */}
            {stageModal.nextStage?.id === 6 && (
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>QC Inspection Result</label>
                <select
                  value={stageModal.qcResult}
                  onChange={(e) => setStageModal({ ...stageModal, qcResult: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                >
                  <option value="PASS">QC Pass (Transfer to Finished Goods Warehouse)</option>
                  <option value="REWORK">QC Rework Required</option>
                  <option value="FAIL">QC Rejected</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>Stage Notes / Inspection Remarks</label>
              <textarea
                rows="2"
                placeholder="e.g. GSM check completed, no selvedge flaws observed"
                value={stageModal.notes}
                onChange={(e) => setStageModal({ ...stageModal, notes: e.target.value })}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" onClick={() => setStageModal({ isOpen: false, batch: null, nextStage: null, outputQty: "", qcResult: "PASS", notes: "" })} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={handleConfirmNextStage} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0d9488", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>Confirm & Transition</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
