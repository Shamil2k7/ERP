"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";
import { Loader2 } from "lucide-react";
import {
  FiArrowLeft,
  FiSave,
  FiTag,
  FiPackage,
  FiDollarSign,
  FiTruck,
  FiPlus,
  FiX,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import apiClient from "@/services/apiClient";
import { restaurantService } from "@/services/restaurantService";
import Swal, { showSuccess, showError, showWarning } from "@/utils/swal";

const DEFAULT_UNITS = [
  { id: "pcs", name: "Piece / Pcs", code: "pcs" },
  { id: "kg", name: "Kilogram (KG)", code: "kg" },
  { id: "gm", name: "Gram (g)", code: "gm" },
  { id: "liter", name: "Liter (L)", code: "liter" },
  { id: "ml", name: "Milliliter (ml)", code: "ml" },
  { id: "box", name: "Box", code: "box" },
  { id: "pack", name: "Pack / Packet", code: "pack" },
  { id: "carton", name: "Carton / Case", code: "carton" },
  { id: "bottle", name: "Bottle", code: "bottle" },
  { id: "can", name: "Can / Tin", code: "can" },
  { id: "bag", name: "Bag / Sack", code: "bag" },
  { id: "bundle", name: "Bundle", code: "bundle" },
  { id: "dozen", name: "Dozen (12 pcs)", code: "dozen" },
  { id: "portion", name: "Portion / Serving", code: "portion" },
  { id: "plate", name: "Plate", code: "plate" },
  { id: "set", name: "Set", code: "set" },
  { id: "meter", name: "Meter (m)", code: "meter" },
  { id: "unit", name: "Unit", code: "unit" },
];

export default function RestaurantIngredientEdit({ ingredientId }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [product, setProduct] = useState({
    id: "",
    name: "",
    sku: "",
    description: "",
    status: "ACTIVE",
    baseUnitId: "",
    currentStock: 0,
    minimumStock: "5",
    reorderQuantity: "20",
    costPrice: "0",
    averageCost: "0",
    lastPurchaseCost: "0",
    supplierId: "",
    restaurantOutletId: "",
    defaultStorageLocation: "Main Store",
    storageType: "Dry Storage",
    isPerishable: false,
    isExpiryTracking: false,
    isBatchTracking: false,
  });

  // Dropdown States
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [suppliers, setSuppliers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  // Modals
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitForm, setNewUnitForm] = useState({ name: "", code: "" });
  const [savingUnit, setSavingUnit] = useState(false);

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
  });
  const [savingSupplier, setSavingSupplier] = useState(false);

  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockForm, setAddStockForm] = useState({
    quantity: "",
    unitCost: "",
    remarks: "",
  });
  const [savingStock, setSavingStock] = useState(false);

  useEffect(() => {
    if (ingredientId) {
      loadInitialData();
    }
  }, [ingredientId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [unitRes, suppRes, restRes, ingRes] = await Promise.allSettled([
        apiClient.get("/units"),
        apiClient.get("/suppliers"),
        restaurantService.getRestaurants(),
        restaurantService.getIngredientById(ingredientId),
      ]);

      // 1. Units
      if (unitRes.status === "fulfilled" && unitRes.value.data?.data?.length > 0) {
        const fetchedUnits = unitRes.value.data.data;
        const combined = [...fetchedUnits];
        DEFAULT_UNITS.forEach((du) => {
          if (!combined.some((u) => u.name?.toLowerCase() === du.name.toLowerCase() || u.code?.toLowerCase() === du.code.toLowerCase())) {
            combined.push(du);
          }
        });
        setUnits(combined);
      } else {
        setUnits(DEFAULT_UNITS);
      }

      // 2. Suppliers
      if (suppRes.status === "fulfilled") {
        const rawSupp = suppRes.value.data?.data || suppRes.value.data || [];
        setSuppliers(Array.isArray(rawSupp) ? rawSupp : []);
      }

      // 3. Restaurants / Outlets
      if (restRes.status === "fulfilled") {
        const rawRest = restRes.value.data || restRes.value || [];
        setRestaurants(Array.isArray(rawRest) ? rawRest : []);
      }

      // 4. Ingredient Data
      if (ingRes.status === "fulfilled" && ingRes.value) {
        const ing = ingRes.value.data || ingRes.value;
        const invStock = (ing.inventories || []).reduce(
          (sum, inv) => sum + (parseFloat(inv.quantity) || 0),
          0
        );
        const effectiveStock = ing.currentStock !== undefined && ing.currentStock !== null
          ? parseFloat(ing.currentStock)
          : (ing.inventories && ing.inventories.length > 0 ? invStock : (parseFloat(ing.initialStock) || 0));

        setProduct({
          id: ing.id,
          name: ing.name || "",
          sku: ing.sku || ing.barcode || "",
          description: ing.description || "",
          status: ing.status || "ACTIVE",
          baseUnitId: ing.unitId || ing.baseUnitId || ing.unit?.id || "",
          currentStock: effectiveStock,
          minimumStock: ing.minimumStock !== undefined && ing.minimumStock !== null ? String(ing.minimumStock) : "5",
          reorderQuantity: ing.reorderQuantity !== undefined && ing.reorderQuantity !== null ? String(ing.reorderQuantity) : "20",
          costPrice: ing.costPrice !== undefined && ing.costPrice !== null ? String(ing.costPrice) : "0",
          averageCost: ing.averageCost !== undefined && ing.averageCost !== null ? String(ing.averageCost) : (ing.costPrice ? String(ing.costPrice) : "0"),
          lastPurchaseCost: ing.lastPurchaseCost !== undefined && ing.lastPurchaseCost !== null ? String(ing.lastPurchaseCost) : (ing.costPrice ? String(ing.costPrice) : "0"),
          supplierId: ing.supplierId || "",
          restaurantOutletId: ing.restaurantOutletId || "",
          defaultStorageLocation: ing.defaultStorageLocation || ing.warehouseLocation || "Main Store",
          storageType: ing.storageType || "Dry Storage",
          isPerishable: Boolean(ing.isPerishable),
          isExpiryTracking: Boolean(ing.isExpiryTracking),
          isBatchTracking: Boolean(ing.isBatchTracking),
        });
      } else {
        throw new Error("Unable to find the requested raw material / ingredient.");
      }
    } catch (err) {
      console.error("Error loading ingredient edit data:", err);
      showError("Ingredient Not Found", err.response?.data?.message || err.message || "Failed to load ingredient details.");
      setTimeout(() => {
        router.push("/admin/products/view");
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    if (!newUnitForm.name.trim()) {
      showWarning("Unit Name Required", "Please enter a unit name.");
      return;
    }
    try {
      setSavingUnit(true);
      const res = await apiClient.post("/units", {
        name: newUnitForm.name.trim(),
        code: (newUnitForm.code || newUnitForm.name).trim().toLowerCase().slice(0, 10),
      });
      const createdUnit = res.data?.data || res.data;
      if (createdUnit) {
        setUnits((prev) => [createdUnit, ...prev]);
        setProduct((prev) => ({ ...prev, baseUnitId: createdUnit.id }));
        toast.success(`Unit "${createdUnit.name}" added!`);
      }
      setNewUnitForm({ name: "", code: "" });
      setShowAddUnitModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add unit.");
    } finally {
      setSavingUnit(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierForm.companyName.trim()) {
      toast.error("Supplier Company Name is required");
      return;
    }
    if (newSupplierForm.phone && !isValidPhoneNumber(newSupplierForm.phone, true)) {
      toast.error("Phone number must contain exactly 10 digits");
      return;
    }
    try {
      setSavingSupplier(true);
      const res = await apiClient.post("/suppliers", {
        companyName: newSupplierForm.companyName.trim(),
        contactPerson: newSupplierForm.contactPerson.trim() || undefined,
        phone: newSupplierForm.phone ? newSupplierForm.phone.trim() : undefined,
        email: newSupplierForm.email.trim() || undefined,
      });
      const createdSup = res.data?.data || res.data;
      if (createdSup) {
        setSuppliers((prev) => [createdSup, ...prev]);
        setProduct((prev) => ({ ...prev, supplierId: createdSup.id }));
        toast.success(`Supplier "${createdSup.companyName}" added!`);
      }
      setNewSupplierForm({ companyName: "", contactPerson: "", phone: "", email: "" });
      setShowAddSupplierModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add supplier.");
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    const qty = parseFloat(addStockForm.quantity);
    if (!qty || qty <= 0) {
      showWarning("Valid Quantity Required", "Please enter a positive stock quantity to add.");
      return;
    }
    try {
      setSavingStock(true);
      const res = await restaurantService.addIngredientStock(ingredientId, {
        quantity: qty,
        unitCost: addStockForm.unitCost ? parseFloat(addStockForm.unitCost) : undefined,
        remarks: addStockForm.remarks.trim() || "Stock In from Edit Page",
      });

      const updated = res.data || res;
      if (updated) {
        setProduct((prev) => ({
          ...prev,
          currentStock: updated.currentStock !== undefined ? updated.currentStock : (prev.currentStock + qty),
          costPrice: updated.costPrice !== undefined ? String(updated.costPrice) : prev.costPrice,
          averageCost: updated.averageCost !== undefined ? String(updated.averageCost) : prev.averageCost,
          lastPurchaseCost: updated.lastPurchaseCost !== undefined ? String(updated.lastPurchaseCost) : prev.lastPurchaseCost,
        }));
        showSuccess("Stock Added", `Successfully added ${qty} to ${product.name}!`);
      }
      setAddStockForm({ quantity: "", unitCost: "", remarks: "" });
      setShowAddStockModal(false);
    } catch (err) {
      showError("Stock Addition Failed", err.response?.data?.message || err.message || "Failed to add stock.");
    } finally {
      setSavingStock(false);
    }
  };

  const validateForm = () => {
    if (!product.name || !product.name.trim()) {
      showWarning("Validation Required", "Ingredient Name is required.");
      return false;
    }
    if (!product.sku || !product.sku.trim()) {
      showWarning("Validation Required", "Ingredient Code / SKU is required.");
      return false;
    }
    if (!product.status) {
      showWarning("Validation Required", "Status is required.");
      return false;
    }
    if (!product.baseUnitId) {
      showWarning("Validation Required", "Base Unit is required.");
      return false;
    }
    if (product.minimumStock === "" || product.minimumStock === null || Number(product.minimumStock) < 0) {
      showWarning("Validation Required", "Valid Minimum Stock Level is required.");
      return false;
    }
    if (product.costPrice === "" || product.costPrice === null || Number(product.costPrice) < 0) {
      showWarning("Validation Required", "Valid Purchase Cost (₹) is required.");
      return false;
    }
    if (!product.restaurantOutletId) {
      showWarning("Validation Required", "Restaurant Outlet is required.");
      return false;
    }
    if (!product.defaultStorageLocation || !product.defaultStorageLocation.trim()) {
      showWarning("Validation Required", "Default Storage Location is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: product.name.trim(),
        ingredientName: product.name.trim(),
        sku: product.sku.trim(),
        ingredientCode: product.sku.trim(),
        description: product.description ? product.description.trim() : "",
        status: product.status || "ACTIVE",
        baseUnitId: product.baseUnitId || "",
        minimumStockLevel: product.minimumStock || "0",
        minimumStock: product.minimumStock || "0",
        reorderQuantity: product.reorderQuantity || "0",
        purchaseCost: product.costPrice || "0",
        costPrice: product.costPrice || "0",
        supplierId: product.supplierId || null,
        preferredSupplierId: product.supplierId || null,
        restaurantOutletId: product.restaurantOutletId || null,
        defaultStorageLocation: product.defaultStorageLocation.trim(),
        warehouseLocation: product.defaultStorageLocation.trim(),
        storageType: product.storageType || "Dry Storage",
        isPerishable: Boolean(product.isPerishable),
        expiryTracking: Boolean(product.isExpiryTracking),
        isExpiryTracking: Boolean(product.isExpiryTracking),
        batchTracking: Boolean(product.isBatchTracking),
        isBatchTracking: Boolean(product.isBatchTracking),
      };

      await restaurantService.updateIngredient(ingredientId, payload);

      showSuccess("Ingredient Updated", `Raw Material / Ingredient "${product.name}" updated successfully!`);
      setTimeout(() => {
        router.push("/admin/products/view");
      }, 700);
    } catch (err) {
      console.error("Error updating ingredient:", err);
      showError("Update Failed", err.response?.data?.message || err.message || "Failed to update ingredient.");
    } finally {
      setSubmitting(false);
    }
  };

  // Selected Unit Name
  const selectedUnitObj = units.find((u) => u.id === product.baseUnitId);
  const selectedUnitName = selectedUnitObj?.name || selectedUnitObj?.code || "Units";

  // Dynamic Cost Summary Values
  const numericCost = parseFloat(product.costPrice) || 0;
  const numericAvg = parseFloat(product.averageCost) || numericCost;
  const numericLast = parseFloat(product.lastPurchaseCost) || numericCost;
  const currentStockVal = parseFloat(product.currentStock) || 0;
  const totalStockValue = currentStockVal * (numericAvg > 0 ? numericAvg : numericCost);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
        <Loader2 className="animate-spin" size={40} color="#2563eb" />
        <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>Loading ingredient details...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Toaster position="top-right" />

      <form onSubmit={handleSubmit} style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "48px" }}>
        {/* PAGE HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "16px",
            background: "#ffffff",
            padding: "20px 24px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin/products/view")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                color: "#2563eb",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                padding: "0",
                marginBottom: "8px",
              }}
            >
              <FiArrowLeft size={16} /> Back to Ingredients
            </button>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
              Edit Raw Material / Ingredient
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
              Manage ingredient details, stock levels, supplier information and storage settings.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => router.push("/admin/products/view")}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: submitting ? "#93c5fd" : "#2563eb",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "14px",
                cursor: submitting ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              <FiSave size={16} />
              {submitting ? "Updating..." : "Update Ingredient"}
            </button>
          </div>
        </div>

        {/* 2-COLUMN RESPONSIVE FORM GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: "24px" }}>
          {/* 1. BASIC INFORMATION */}
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                <FiTag />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Basic Information
              </h3>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Ingredient Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  placeholder="e.g. Chicken Breast, Rice, Cheese"
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Ingredient Code / SKU <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={product.sku}
                    onChange={handleChange}
                    placeholder="ING-001"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Status <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    name="status"
                    value={product.status}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  placeholder="Enter ingredient notes, specifications, or details..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    minHeight: "85px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>

          {/* 2. UNIT & STOCK */}
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                <FiPackage />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Unit & Stock
              </h3>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", margin: 0 }}>
                    Base Unit <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddUnitModal(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      padding: "0",
                    }}
                  >
                    + Add Unit
                  </button>
                </div>
                <select
                  name="baseUnitId"
                  value={product.baseUnitId}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    fontSize: "14px",
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select Base Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* READ-ONLY CURRENT STOCK WITH ADD STOCK BUTTON */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  background: "#f0fdf4",
                  borderRadius: "10px",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Current Stock (Read-Only)
                  </span>
                  <div style={{ fontSize: "20px", fontWeight: "800", color: "#15803d", marginTop: "2px" }}>
                    {product.currentStock} <span style={{ fontSize: "14px", fontWeight: "600", color: "#166534" }}>{selectedUnitName}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#4ade80", fontWeight: "500" }}>
                    Opening stock cannot be directly overwritten
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(true)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)",
                  }}
                >
                  <FiPlus size={15} /> Add Stock
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Minimum Stock Level <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="minimumStock"
                    value={product.minimumStock}
                    onChange={handleChange}
                    placeholder="5"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Reorder Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="reorderQuantity"
                    value={product.reorderQuantity}
                    onChange={handleChange}
                    placeholder="20"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. COST INFORMATION */}
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                <FiDollarSign />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Cost Information
              </h3>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Purchase Cost (₹) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="costPrice"
                    value={product.costPrice}
                    onChange={handleChange}
                    placeholder="300.00"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155", margin: 0 }}>
                      Preferred Supplier
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddSupplierModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        padding: "0",
                      }}
                    >
                      + Add Supplier
                    </button>
                  </div>
                  <select
                    name="supplierId"
                    value={product.supplierId}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.companyName || sup.name || sup.contactPerson}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DYNAMIC COST SUMMARY PANEL */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "12px" }}>
                  Cost Summary
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Average Cost</span>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                      ₹{numericAvg.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Last Purchase</span>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>
                      ₹{numericLast.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div style={{ paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Stock Value</span>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#16a34a", marginTop: "2px" }}>
                    ₹{totalStockValue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. STORAGE & TRACKING */}
          <div
            style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                <FiTruck />
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Storage & Tracking
              </h3>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Restaurant Outlet <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    name="restaurantOutletId"
                    value={product.restaurantOutletId}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Select Outlet</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Default Storage Location <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="defaultStorageLocation"
                    value={product.defaultStorageLocation}
                    onChange={handleChange}
                    placeholder="e.g. Main Store, Freezer #1"
                    style={{
                      width: "100%",
                      height: "44px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#0f172a",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Storage Type
                </label>
                <select
                  name="storageType"
                  value={product.storageType}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    fontSize: "14px",
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select Storage Type</option>
                  <option value="Dry Storage">Dry Storage</option>
                  <option value="Refrigerated">Refrigerated</option>
                  <option value="Freezer">Freezer</option>
                  <option value="Cold Storage">Cold Storage</option>
                  <option value="Kitchen Storage">Kitchen Storage</option>
                  <option value="Ambient">Ambient</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Tracking Options
                </label>
                <div
                  style={{
                    padding: "14px 16px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#334155", fontWeight: "500" }}>
                    <input
                      type="checkbox"
                      name="isPerishable"
                      checked={product.isPerishable}
                      onChange={handleChange}
                      style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                    />
                    Perishable Item (Fresh vegetables, meats, dairy)
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#334155", fontWeight: "500" }}>
                    <input
                      type="checkbox"
                      name="isExpiryTracking"
                      checked={product.isExpiryTracking}
                      onChange={handleChange}
                      style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                    />
                    Expiry Tracking
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#334155", fontWeight: "500" }}>
                    <input
                      type="checkbox"
                      name="isBatchTracking"
                      checked={product.isBatchTracking}
                      onChange={handleChange}
                      style={{ width: "18px", height: "18px", accentColor: "#2563eb", cursor: "pointer" }}
                    />
                    Batch Tracking
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* MODAL: ADD UNIT */}
      {showAddUnitModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "440px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Add New Unit</h3>
              <button type="button" onClick={() => setShowAddUnitModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUnit}>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Unit Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newUnitForm.name}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, name: e.target.value })}
                    placeholder="e.g. Kilogram, Litre, Portion"
                    style={{ width: "100%", height: "42px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Short Code (e.g. kg, l, pcs)
                  </label>
                  <input
                    type="text"
                    value={newUnitForm.code}
                    onChange={(e) => setNewUnitForm({ ...newUnitForm, code: e.target.value })}
                    placeholder="kg"
                    style={{ width: "100%", height: "42px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowAddUnitModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: "600", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingUnit} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>
                  {savingUnit ? "Saving..." : "Save Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {showAddSupplierModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Add New Supplier</h3>
              <button type="button" onClick={() => setShowAddSupplierModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Company Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newSupplierForm.companyName}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, companyName: e.target.value })}
                    placeholder="e.g. Fresh Meat & Poultry Ltd"
                    style={{ width: "100%", height: "42px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newSupplierForm.contactPerson}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactPerson: e.target.value })}
                    placeholder="e.g. John Doe"
                    style={{ width: "100%", height: "42px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={newSupplierForm.phone}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: sanitizePhoneInput(e.target.value) })}
                      placeholder="10-digit Phone Number"
                      style={{ width: "100%", height: "42px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                    />
                    {newSupplierForm.phone && getPhoneValidationError(newSupplierForm.phone, false) && (
                      <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                        ⚠ {getPhoneValidationError(newSupplierForm.phone, false)}
                      </span>
                    )}

                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={newSupplierForm.email}
                      onChange={(e) => setNewSupplierForm({ ...newSupplierForm, email: e.target.value })}
                      placeholder="supplier@example.com"
                      style={{ width: "100%", height: "42px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowAddSupplierModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: "600", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingSupplier} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>
                  {savingSupplier ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STOCK */}
      {showAddStockModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", width: "100%", maxWidth: "460px", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Add Stock In</h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>Ingredient: {product.name}</p>
              </div>
              <button type="button" onClick={() => setShowAddStockModal(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStock}>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Quantity to Add ({selectedUnitName}) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={addStockForm.quantity}
                    onChange={(e) => setAddStockForm({ ...addStockForm, quantity: e.target.value })}
                    placeholder="e.g. 10"
                    style={{ width: "100%", height: "42px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Unit Purchase Cost (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={addStockForm.unitCost}
                    onChange={(e) => setAddStockForm({ ...addStockForm, unitCost: e.target.value })}
                    placeholder={product.costPrice ? `Current: ₹${product.costPrice}` : "e.g. 300"}
                    style={{ width: "100%", height: "42px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                    Remarks / Purchase Receipt Ref
                  </label>
                  <input
                    type="text"
                    value={addStockForm.remarks}
                    onChange={(e) => setAddStockForm({ ...addStockForm, remarks: e.target.value })}
                    placeholder="e.g. Weekly Kitchen Stock Replenishment"
                    style={{ width: "100%", height: "42px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setShowAddStockModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#475569", fontWeight: "600", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingStock} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#16a34a", color: "#ffffff", fontWeight: "700", cursor: "pointer" }}>
                  {savingStock ? "Adding Stock..." : "Confirm Stock In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
