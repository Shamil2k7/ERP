"use client";

import { useEffect, useState } from "react";
import { createInventory, updateInventory } from "@/services/inventoryService";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import apiClient from "@/services/apiClient";

export default function StockModal({
  isOpen,
  onClose,
  onSave,
  item = null,
  products: initialProducts = [],
  warehouses: initialWarehouses = [],
}) {
  const { showSuccess, showError } = useAlert();
  const { isTextile } = useCompany();
  const isEdit = !!item;

  const [products, setProducts] = useState(initialProducts);
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    warehouseId: "",
    quantity: 0,
    minimumStock: 10,
    maximumStock: 1000,
    reorderLevel: 20,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync initial props
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  useEffect(() => {
    if (initialWarehouses && initialWarehouses.length > 0) {
      setWarehouses(initialWarehouses);
    }
  }, [initialWarehouses]);

  // When modal opens, fetch fresh active products & warehouses directly from backend
  useEffect(() => {
    if (isOpen) {
      async function fetchFreshData() {
        try {
          setLoadingProducts(true);
          const [pRes, wRes] = await Promise.allSettled([
            isTextile ? apiClient.get("/textile/products") : apiClient.get("/products"),
            apiClient.get("/warehouses"),
          ]);

          if (pRes.status === "fulfilled") {
            const rawP = pRes.value.data?.data || pRes.value.data;
            const pData = Array.isArray(rawP) ? rawP : [];
            const filtered = pData.filter((p) => {
              if (isTextile) return p.isTextile === true || p.category === "TEXTILE" || isTextile;
              return !p.isTextile && !p.sku?.startsWith("TEX-") && !p.sku?.startsWith("GYM-");
            });
            setProducts(filtered);
          }

          if (wRes.status === "fulfilled") {
            const rawW = wRes.value.data?.data || wRes.value.data;
            const wData = Array.isArray(rawW) ? rawW : [];
            setWarehouses(wData);
          }
        } catch (e) {
          console.warn("Could not refetch products on modal open:", e);
        } finally {
          setLoadingProducts(false);
        }
      }
      fetchFreshData();
    }
  }, [isOpen, isTextile]);

  useEffect(() => {
    if (item) {
      setForm({
        productId: item.productId || "",
        warehouseId: item.warehouseId || "",
        quantity: item.quantity ?? 0,
        minimumStock: item.minimumStock ?? 10,
        maximumStock: item.maximumStock ?? 1000,
        reorderLevel: item.reorderLevel ?? 20,
      });
    } else {
      setForm({
        productId: "",
        warehouseId: "",
        quantity: 0,
        minimumStock: 10,
        maximumStock: 1000,
        reorderLevel: 20,
      });
    }
    setError("");
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "productId" || name === "warehouseId" ? value : Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.productId) {
      setError("Product is required");
      return;
    }
    if (!form.warehouseId) {
      setError("Warehouse is required");
      return;
    }
    if (form.quantity < 0) {
      setError("Quantity cannot be negative");
      return;
    }
    if (form.minimumStock < 0) {
      setError("Minimum stock cannot be negative");
      return;
    }
    if (form.maximumStock <= 0) {
      setError("Maximum stock must be greater than 0");
      return;
    }
    if (form.reorderLevel < 0) {
      setError("Reorder level cannot be negative");
      return;
    }
    if (form.minimumStock > form.maximumStock) {
      setError("Minimum stock cannot be greater than Maximum stock");
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        // Edit Mode: update inventory
        await updateInventory(item.id, {
          quantity: form.quantity,
          minimumStock: form.minimumStock,
          maximumStock: form.maximumStock,
          reorderLevel: form.reorderLevel,
        });
        showSuccess("Inventory Updated", "Stock item levels updated successfully.");
      } else {
        // Add Mode: create inventory
        await createInventory(form);
        showSuccess("Inventory Created", "New product stock mapped successfully.");
      }
      onSave();
      onClose();
    } catch (err) {
      console.error("Save stock error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save stock record. Make sure product doesn't already exist in the warehouse."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="modal-content-card">
        <div className="modal-card-header">
          <h2>{isEdit ? "Edit Stock Levels" : isTextile ? "Add Textile Fabric Stock to Warehouse" : "Add Product to Warehouse"}</h2>
          <button className="modal-close-x-btn" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-card-body">
          {error && <div className="modal-error-pill">{error}</div>}

          <div className="modal-grid-cols">
            {/* Product Select */}
            <div className="modal-field-group">
              <label className="form-group-label">{isTextile ? "Textile Fabric Product Item *" : "Product Item *"}</label>
              <select
                name="productId"
                value={form.productId}
                onChange={handleChange}
                disabled={isEdit}
                className="form-control-pill"
                required
              >
                <option value="">
                  {loadingProducts
                    ? "Loading products..."
                    : products.length === 0
                    ? isTextile
                      ? "No Textile products found. Please create a Textile Product first."
                      : "No products available. Please add a product first."
                    : "Select a Product"}
                </option>
                {products.map((p) => {
                  const pName = p.name || p.productName || "Product";
                  const pSku = p.sku || p.productCode || "No SKU";
                  const currentStock = p.inventories?.reduce((acc, inv) => acc + Number(inv.quantity || 0), 0) ?? (p.initialStock !== undefined && p.initialStock !== null ? Number(p.initialStock) : 0);
                  return (
                    <option key={p.id} value={p.id}>
                      {pName} ({pSku}) — Stock: {currentStock}
                    </option>
                  );
                })}
              </select>
              {products.length === 0 && !loadingProducts && (
                <div style={{ marginTop: "6px", fontSize: "12px", color: "#ef4444" }}>
                  <span>No products found for this company. </span>
                  <a
                    href={isTextile ? "/textile/products/add" : "/admin/products/add"}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#2563eb", fontWeight: "700", textDecoration: "underline" }}
                  >
                    + Add Product First
                  </a>
                </div>
              )}
            </div>

            {/* Warehouse Select */}
            <div className="modal-field-group">
              <label className="form-group-label">Warehouse Location *</label>
              <select
                name="warehouseId"
                value={form.warehouseId}
                onChange={handleChange}
                disabled={isEdit}
                className="form-control-pill"
                required
              >
                <option value="">{warehouses.length === 0 ? "No warehouses available" : "Select a Warehouse"}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.code ? `(${w.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="modal-field-group">
              <label className="form-group-label">Initial Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter stock quantity"
                min="0"
                className="form-control-pill"
              />
            </div>

            {/* Reorder Level */}
            <div className="modal-field-group">
              <label className="form-group-label">Reorder Level</label>
              <input
                type="number"
                name="reorderLevel"
                value={form.reorderLevel}
                onChange={handleChange}
                min="0"
                className="form-control-pill"
              />
            </div>

            {/* Minimum Stock */}
            <div className="modal-field-group">
              <label className="form-group-label">Minimum Stock Alert Threshold</label>
              <input
                type="number"
                name="minimumStock"
                value={form.minimumStock}
                onChange={handleChange}
                min="0"
                className="form-control-pill"
              />
            </div>

            {/* Maximum Capacity */}
            <div className="modal-field-group">
              <label className="form-group-label">Maximum Storage Capacity</label>
              <input
                type="number"
                name="maximumStock"
                value={form.maximumStock}
                onChange={handleChange}
                min="1"
                className="form-control-pill"
              />
            </div>
          </div>

          <div className="modal-card-actions">
            <button type="button" className="btn-cancel-pill" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit-pill"
              disabled={loading}
              style={isTextile ? { background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)" } : undefined}
            >
              {loading ? "Processing..." : isEdit ? "Update Stock Record" : isTextile ? "Add Fabric Stock Record" : "Save Stock Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
