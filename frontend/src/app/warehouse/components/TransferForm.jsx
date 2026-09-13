"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import apiClient from "@/services/apiClient";

export default function TransferForm() {
  const { showSuccess, showWarning, showError } = useAlert();
  const { isGym, isTextile } = useCompany();

  const [form, setForm] = useState({
    fromWarehouseId: "",
    toWarehouseId: "",
    productId: "",
    quantity: "",
    remarks: "",
  });

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchTransfers = async () => {
    try {
      const [whRes, prodRes, transRes, invRes] = await Promise.all([
        apiClient.get("/warehouses"),
        apiClient.get("/products"),
        apiClient.get("/stock-transfers"),
        apiClient.get("/inventory"),
      ]);

      if (whRes.data?.success && whRes.data?.data) {
        setWarehouses(whRes.data.data);
      }
      if (prodRes.data?.success && prodRes.data?.data) {
        setProducts(prodRes.data.data);
      }
      if (invRes.data?.success && invRes.data?.data) {
        setInventories(invRes.data.data);
      } else if (Array.isArray(invRes.data)) {
        setInventories(invRes.data);
      }
      if (transRes.data?.success && transRes.data?.data) {
        const mapped = transRes.data.data.map((item) => ({
          id: item.id,
          date: new Date(item.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
          product: item.items?.[0]?.product?.name || "N/A",
          fromWarehouse: item.fromWarehouse?.name || "N/A",
          toWarehouse: item.toWarehouse?.name || "N/A",
          quantity: item.items?.[0]?.quantity || 0,
          status: item.status || "Completed",
        }));
        setHistory(mapped);
      }
    } catch (err) {
      console.error("Failed to load transfer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Filter warehouses based on active ERP context
  const availableWarehouses = warehouses.filter((w) => {
    const isTex =
      w.code?.startsWith("TEX-") ||
      w.name?.toLowerCase().includes("mill") ||
      w.name?.toLowerCase().includes("fabric") ||
      w.name?.toLowerCase().includes("dye") ||
      w.name?.toLowerCase().includes("spinning") ||
      w.name?.toLowerCase().includes("textile") ||
      w.address?.includes("[TEXTILE]");
    const isGymWh =
      w.code?.startsWith("GYM-") ||
      w.name?.toLowerCase().includes("fitness") ||
      w.name?.toLowerCase().includes("gym") ||
      w.address?.includes("[GYM]");

    if (isTextile) return isTex;
    if (isGym) return isGymWh;
    return !isTex && !isGymWh;
  });

  // Destination warehouses must exclude origin warehouse
  const destinationWarehouses = availableWarehouses.filter(
    (w) => w.id !== form.fromWarehouseId
  );

  const getSourceStock = (productId, warehouseId) => {
    if (!productId || !warehouseId) return 0;
    const targetProdId = String(productId);
    const targetWhId = String(warehouseId);

    const prod = products.find((p) => String(p.id) === targetProdId);

    // 1. Check embedded inventories array on product
    if (prod && Array.isArray(prod.inventories) && prod.inventories.length > 0) {
      const inv = prod.inventories.find(
        (i) => String(i.warehouseId) === targetWhId || String(i.warehouse?.id) === targetWhId
      );
      if (inv && inv.quantity !== undefined && inv.quantity !== null) {
        const parsed = parseFloat(inv.quantity);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    }

    // 2. Check dedicated /inventory collection
    const directInv = inventories.find(
      (i) =>
        (String(i.productId) === targetProdId || String(i.product?.id) === targetProdId) &&
        (String(i.warehouseId) === targetWhId || String(i.warehouse?.id) === targetWhId)
    );
    if (directInv && directInv.quantity !== undefined && directInv.quantity !== null) {
      const parsed = parseFloat(directInv.quantity);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }

    // 3. Fallback to product initialStock if this warehouse is the primary warehouse for the product
    if (prod && prod.initialStock !== undefined && prod.initialStock !== null) {
      const initStockNum = parseFloat(prod.initialStock);
      if (!isNaN(initStockNum) && initStockNum > 0) {
        // If product has no inventory record yet for other warehouses, default to primary
        const isPrimaryWh = availableWarehouses.length > 0 && String(availableWarehouses[0].id) === targetWhId;
        if (isPrimaryWh) return initStockNum;
      }
    }

    return 0;
  };


  const selectedProductAvailableStock =
    form.productId && form.fromWarehouseId
      ? getSourceStock(form.productId, form.fromWarehouseId)
      : null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // If user changes origin warehouse to the one currently selected as destination, clear destination
      if (name === "fromWarehouseId" && value === prev.toWarehouseId) {
        updated.toWarehouseId = "";
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fromWarehouseId) {
      showWarning("Missing Origin Warehouse", "Please select a source/origin warehouse.");
      return;
    }

    if (!form.toWarehouseId) {
      showWarning(
        "Missing Destination Warehouse",
        availableWarehouses.length < 2
          ? "Stock transfer requires at least two warehouses. Please create another warehouse first."
          : "Please select a destination warehouse."
      );
      return;
    }

    if (form.fromWarehouseId === form.toWarehouseId) {
      showWarning(
        "Invalid Selection",
        "Source and destination warehouses cannot be identical."
      );
      return;
    }

    if (!form.productId) {
      showWarning("Missing Product", "Please select a product to transfer.");
      return;
    }

    const qtyNum = parseInt(form.quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      showWarning("Invalid Quantity", "Please enter a valid transfer quantity greater than 0.");
      return;
    }

    if (
      selectedProductAvailableStock !== null &&
      qtyNum > selectedProductAvailableStock
    ) {
      showWarning(
        "Insufficient Stock",
        `Transfer quantity (${qtyNum}) exceeds available stock (${selectedProductAvailableStock} units) in the origin warehouse.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const transferNo = `TR-${Date.now().toString().slice(-8)}`;
      const payload = {
        transferNo,
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        status: "COMPLETED",
        remarks: form.remarks ? form.remarks.trim() : undefined,
        items: [
          {
            productId: form.productId,
            quantity: qtyNum,
          },
        ],
      };

      const res = await apiClient.post("/stock-transfers", payload);
      if (res.data?.success) {
        showSuccess(
          "Stock Transfer Executed",
          "Stock transfer approved and executed successfully."
        );
        setForm({
          fromWarehouseId: "",
          toWarehouseId: "",
          productId: "",
          quantity: "",
          remarks: "",
        });
        await fetchTransfers();
      }
    } catch (err) {
      console.error("Transfer error:", err);
      showError(
        "Transfer Failed",
        err.response?.data?.message || "Failed to execute stock transfer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        Loading stock transfer details...
      </div>
    );
  }

  const hasMultipleWarehouses = availableWarehouses.length >= 2;

  return (
    <div className="space-y-8">
      {/* Transfer Form Card */}
      <div className="transfer-form-card">
        <h2 className="form-card-title">
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{ marginRight: 8 }}
          >
            <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Initiate Stock Transfer
        </h2>

        {!hasMultipleWarehouses && (
          <div
            style={{
              padding: "16px 20px",
              marginBottom: "24px",
              borderRadius: "12px",
              background: "#fef3c7",
              border: "1px solid #fde68a",
              color: "#92400e",
              fontSize: "14px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "18px", marginTop: "1px" }}>⚠️</span>
            <div>
              <strong style={{ display: "block", marginBottom: "3px" }}>
                Stock transfer requires at least two warehouses.
              </strong>
              <span>
                Currently, only {availableWarehouses.length} warehouse is registered (
                {availableWarehouses[0]?.name || "Main Warehouse"}).{" "}
                <Link
                  href="/warehouse/add"
                  style={{
                    color: "#b45309",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  Create an additional warehouse
                </Link>{" "}
                to enable inter-warehouse transfers.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Origin Warehouse */}
            <div>
              <label
                className="form-group-label"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#334155",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                From Warehouse *
              </label>
              <select
                name="fromWarehouseId"
                value={form.fromWarehouseId}
                onChange={handleChange}
                className="form-control-pill"
              >
                <option value="">Select Origin Warehouse</option>
                {availableWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Warehouse (Excludes Origin Warehouse) */}
            <div>
              <label
                className="form-group-label"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#334155",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                To Warehouse *
              </label>
              <select
                name="toWarehouseId"
                value={form.toWarehouseId}
                onChange={handleChange}
                className="form-control-pill"
                disabled={!form.fromWarehouseId || destinationWarehouses.length === 0}
              >
                <option value="">
                  {!form.fromWarehouseId
                    ? "Select Origin Warehouse First"
                    : destinationWarehouses.length === 0
                    ? "No other warehouses available"
                    : "Select Destination Warehouse"}
                </option>
                {destinationWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selector */}
            <div>
              <label
                className="form-group-label"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#334155",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Product *
              </label>
              <select
                name="productId"
                value={form.productId}
                onChange={handleChange}
                className="form-control-pill"
              >
                <option value="">Select Product Item</option>
                {products.map((p) => {
                  const stock = form.fromWarehouseId
                    ? getSourceStock(p.id, form.fromWarehouseId)
                    : null;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {stock !== null ? ` — (Stock: ${stock})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Transfer Quantity */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <label
                  className="form-group-label"
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#334155",
                    margin: 0,
                  }}
                >
                  Transfer Quantity *
                </label>
                {selectedProductAvailableStock !== null && (
                  <span
                    style={{
                      fontSize: "12px",
                      color:
                        selectedProductAvailableStock > 0
                          ? "#059669"
                          : "#dc2626",
                      fontWeight: 600,
                    }}
                  >
                    Available Stock: {selectedProductAvailableStock} units
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={
                  selectedProductAvailableStock !== null
                    ? selectedProductAvailableStock
                    : undefined
                }
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter unit quantity"
                className="form-control-pill"
              />
            </div>
          </div>

          <div className="mt-6">
            <label
              className="form-group-label"
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#334155",
                display: "block",
                marginBottom: 6,
              }}
            >
              Transfer Remarks & Notes
            </label>
            <textarea
              rows={3}
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Add optional notes or authorization details..."
              className="form-control-pill"
              style={{ resize: "none" }}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn-action-primary"
              disabled={!hasMultipleWarehouses || submitting}
              style={{
                opacity: !hasMultipleWarehouses || submitting ? 0.6 : 1,
                cursor: !hasMultipleWarehouses || submitting ? "not-allowed" : "pointer",
              }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                style={{ marginRight: 8 }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              {submitting ? "Executing..." : "Execute Transfer"}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Transfers Table Card */}
      <div className="warehouse-table-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            padding: "0 4px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#18181b",
              margin: 0,
            }}
          >
            Recent Transfer History
          </h2>
          <span style={{ fontSize: "13px", color: "#71717a" }}>
            Showing last {history.length} transfer logs
          </span>
        </div>

        <table className="warehouse-table">
          <thead>
            <tr>
              <th>DATE & TIME</th>
              <th>PRODUCT</th>
              <th>FROM WAREHOUSE</th>
              <th>TO WAREHOUSE</th>
              <th style={{ textAlign: "center" }}>QTY</th>
              <th style={{ textAlign: "center" }}>STATUS</th>
            </tr>
          </thead>

          <tbody>
            {history.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#71717a",
                  }}
                >
                  No transfer history logged yet.
                </td>
              </tr>
            )}

            {history.map((item) => (
              <tr key={item.id}>
                <td style={{ fontSize: "13px", color: "#71717a" }}>
                  {item.date}
                </td>
                <td style={{ fontWeight: "600", color: "#0f172a" }}>
                  {item.product}
                </td>
                <td>{item.fromWarehouse}</td>
                <td>{item.toWarehouse}</td>
                <td style={{ textAlign: "center" }}>
                  <span
                    style={{
                      background: "#f3f4f6",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    {item.quantity}
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className="badge-status active">Completed</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}