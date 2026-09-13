"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiX,
  FiPackage,
  FiEdit3,
} from "react-icons/fi";
import { getWarehouses } from "@/services/warehouseService";
import { getProducts } from "@/services/productService";
import { createPurchase, getPurchase, updatePurchase } from "@/services/purchaseService";
import { useAlert } from "@/context/AlertContext";
import SupplierSelect from "./SupplierSelect";

export default function PurchaseForm({ purchaseId, isEdit = false }) {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();

  // Master data state
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPurchase, setLoadingPurchase] = useState(isEdit && Boolean(purchaseId));

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [purchaseNo, setPurchaseNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState("PENDING");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(0);

  // Line items state
  const [items, setItems] = useState([
    {
      productId: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load master data (warehouses, products)
  useEffect(() => {
    async function loadMasterData() {
      try {
        setLoadingData(true);
        const [whRes, prodRes] = await Promise.allSettled([
          getWarehouses(),
          getProducts(),
        ]);

        if (whRes.status === "fulfilled") {
          const whData = whRes.value?.data || whRes.value || [];
          setWarehouses(Array.isArray(whData) ? whData : []);
          if (!isEdit && Array.isArray(whData) && whData.length > 0) {
            setWarehouseId(whData[0].id);
          }
        }

        if (prodRes.status === "fulfilled") {
          const prodData = prodRes.value?.data || prodRes.value || [];
          setProducts(Array.isArray(prodData) ? prodData : []);
        }
      } catch (err) {
        console.error("Failed to load purchase form master data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadMasterData();
  }, [isEdit]);

  // If in edit mode, load existing purchase order data
  useEffect(() => {
    if (!isEdit || !purchaseId) {
      if (!isEdit) {
        const randomSeq = Math.floor(100000 + Math.random() * 900000);
        setPurchaseNo(`PO-${randomSeq}`);
      }
      return;
    }

    async function loadExistingPurchase() {
      try {
        setLoadingPurchase(true);
        const res = await getPurchase(purchaseId);
        const data = res?.data || res;

        if (data) {
          setPurchaseNo(data.purchaseNo || "");
          setSupplierId(data.supplierId || data.supplier?.id || "");
          setWarehouseId(data.warehouseId || data.warehouse?.id || "");
          if (data.purchaseDate) {
            setPurchaseDate(new Date(data.purchaseDate).toISOString().split("T")[0]);
          }
          setStatus(data.status || "PENDING");
          setNotes(data.notes || "");
          setTaxRate(data.taxRate !== undefined && data.taxRate !== null ? Number(data.taxRate) : 0);

          if (Array.isArray(data.items) && data.items.length > 0) {
            const mappedItems = data.items.map((it) => {
              const qty = Number(it.quantity) || 1;
              const unitP = Number(it.unitPrice !== undefined ? it.unitPrice : (it.product?.costPrice || it.product?.sellingPrice || 0));
              const totP = Number(it.totalPrice !== undefined ? it.totalPrice : qty * unitP);
              return {
                productId: it.productId || it.product?.id || "",
                quantity: qty,
                unitPrice: unitP,
                totalPrice: totP,
              };
            });
            setItems(mappedItems);
          }
        }
      } catch (err) {
        console.error("Failed to load existing purchase order:", err);
        showError("Loading Error", "Failed to load purchase order details.");
      } finally {
        setLoadingPurchase(false);
      }
    }

    loadExistingPurchase();
  }, [isEdit, purchaseId]);

  // Update a single line item
  const updateItem = (index, field, value) => {
    const updated = [...items];
    const currentItem = { ...updated[index] };

    if (field === "productId") {
      currentItem.productId = value;
      const selectedProd = products.find((p) => String(p.id) === String(value));
      if (selectedProd) {
        const price = Number(selectedProd.costPrice || selectedProd.sellingPrice || 0);
        currentItem.unitPrice = price;
        currentItem.totalPrice = currentItem.quantity * price;
      } else {
        currentItem.unitPrice = 0;
        currentItem.totalPrice = 0;
      }
    } else if (field === "quantity") {
      const qty = Math.max(1, Number(value) || 1);
      currentItem.quantity = qty;
      currentItem.totalPrice = qty * currentItem.unitPrice;
    } else if (field === "unitPrice") {
      const price = Math.max(0, Number(value) || 0);
      currentItem.unitPrice = price;
      currentItem.totalPrice = currentItem.quantity * price;
    }

    updated[index] = currentItem;
    setItems(updated);
  };

  // Add new item row
  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  // Remove an item row
  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  const taxAmount = (subtotal * (Number(taxRate) || 0)) / 100;
  const grandTotal = subtotal + taxAmount;
  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validations
    if (!supplierId) {
      setErrorMessage("Please select a supplier.");
      return;
    }

    if (!warehouseId) {
      setErrorMessage("Please select a warehouse.");
      return;
    }

    const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0);
    if (invalidItems.length > 0) {
      setErrorMessage("Please select a valid product and quantity for all items.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        purchaseNo: purchaseNo.trim() || `PO-${Date.now()}`,
        supplierId,
        warehouseId,
        purchaseDate: new Date(purchaseDate).toISOString(),
        status,
        notes: notes.trim() || undefined,
        totalAmount: grandTotal,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      };

      if (isEdit && purchaseId) {
        await updatePurchase(purchaseId, payload);
        showSuccess("Purchase Updated", `Purchase order ${payload.purchaseNo} updated successfully!`);
      } else {
        await createPurchase(payload);
        showSuccess("Purchase Created", `Purchase order ${payload.purchaseNo} created successfully!`);
      }
      router.push("/purchases");
    } catch (err) {
      console.error(isEdit ? "Purchase update failed:" : "Purchase creation failed:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to save purchase. Please try again.";
      setErrorMessage(msg);
      showError("Submission Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPurchase) {
    return (
      <section className="addCard" style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
        <p style={{ fontSize: "16px", fontWeight: 600 }}>Loading purchase order details...</p>
      </section>
    );
  }

  return (
    <section className="addCard">
      {/* HEADER */}
      <div className="addHeader">
        <div>
          <h2>{isEdit ? "Edit Purchase Order" : "Add Purchase Order"}</h2>
          <p>
            {isEdit
              ? "Modify purchase order details, supplier, items, or status."
              : "Create a new purchase order for supplier inventory."}
          </p>
        </div>
        <button
          type="button"
          className="closeButton"
          onClick={() => router.push("/purchases")}
          title="Close"
        >
          <FiX size={16} />
        </button>
      </div>

      <form className="form" onSubmit={handleSubmit} noValidate>
        {errorMessage && (
          <div
            style={{
              gridColumn: "1 / -1",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "7px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {errorMessage}
          </div>
        )}

        <div className="formGroup">
          <label>
            Purchase Order No. <span>*</span>
          </label>
          <input
            type="text"
            required
            value={purchaseNo}
            onChange={(e) => setPurchaseNo(e.target.value)}
            placeholder="e.g. PO-891814"
            disabled={isEdit}
          />
        </div>

        <div className="formGroup">
          <label>
            Supplier <span>*</span>
          </label>
          <SupplierSelect
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label>
            Destination Warehouse <span>*</span>
          </label>
          <select
            required
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            disabled={loadingData}
          >
            <option value="">
              {loadingData ? "Loading warehouses..." : "Select Warehouse"}
            </option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name || w.code} {w.city ? `(${w.city})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="formGroup">
          <label>
            Purchase Date <span>*</span>
          </label>
          <input
            type="date"
            required
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>

        <div className="formGroup">
          <label>Order Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            <option value="PENDING">PENDING</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="formGroup">
          <label>Tax Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            placeholder="0"
          />
        </div>

        {/* Order Items Table Section */}
        <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <label
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "#1f344d",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FiPackage size={16} /> Order Items ({items.length})
            </label>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#71839a" }}>
              Total Qty: {totalQty}
            </span>
          </div>

          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "5fr 2fr 2fr 2fr 1fr",
              gap: "12px",
              background: "#f8fafc",
              border: "1px solid #e1e6ec",
              borderRadius: "7px",
              padding: "10px 14px",
              fontSize: "12px",
              fontWeight: 700,
              color: "#17304b",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            <div>Product Name</div>
            <div style={{ textAlign: "center" }}>Quantity</div>
            <div style={{ textAlign: "right" }}>Unit Price (₹)</div>
            <div style={{ textAlign: "right" }}>Total (₹)</div>
            <div style={{ textAlign: "center" }}>Action</div>
          </div>

          {/* Item Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "5fr 2fr 2fr 2fr 1fr",
                  gap: "12px",
                  alignItems: "center",
                  background: "#ffffff",
                  border: "1px solid #dce2e8",
                  borderRadius: "7px",
                  padding: "8px 14px",
                }}
              >
                <div>
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => updateItem(index, "productId", e.target.value)}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #dce2e8",
                      fontSize: "13px",
                      outline: "none",
                      color: "#263b55",
                      background: "#ffffff",
                    }}
                    disabled={loadingData}
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(SKU: ${p.sku})` : ""} - ₹{p.costPrice || p.sellingPrice || 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "6px 10px",
                      textAlign: "center",
                      borderRadius: "6px",
                      border: "1px solid #dce2e8",
                      fontSize: "13px",
                      fontWeight: 600,
                      outline: "none",
                      color: "#263b55",
                    }}
                    placeholder="1"
                  />
                </div>

                <div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "6px 10px",
                      textAlign: "right",
                      borderRadius: "6px",
                      border: "1px solid #dce2e8",
                      fontSize: "13px",
                      fontWeight: 500,
                      outline: "none",
                      color: "#263b55",
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#1f344d",
                  }}
                >
                  ₹{(item.totalPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    disabled={items.length === 1}
                    style={{
                      background: "none",
                      border: "none",
                      color: items.length === 1 ? "#cbd5e1" : "#94a3b8",
                      cursor: items.length === 1 ? "not-allowed" : "pointer",
                      padding: "4px",
                    }}
                    title="Remove item"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItemRow}
            style={{
              marginTop: "10px",
              background: "#ffffff",
              border: "1px solid #dce2e8",
              color: "#253b55",
              fontSize: "13px",
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FiPlus size={14} /> Add Item Row
          </button>
        </div>

        {/* Notes & Totals */}
        <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "12px" }}>
          <div className="formGroup">
            <label>Notes / Instructions</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional purchase notes or supplier terms..."
              style={{ height: "90px", resize: "none" }}
            />
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e1e6ec",
              borderRadius: "7px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#52667d" }}>
              <span>Items Subtotal ({items.length} items)</span>
              <strong style={{ color: "#1f344d" }}>
                ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </strong>
            </div>

            {taxRate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#52667d" }}>
                <span>Estimated Tax ({taxRate}%)</span>
                <strong style={{ color: "#1f344d" }}>
                  +₹{taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #e1e6ec",
                paddingTop: "10px",
                marginTop: "4px",
                fontSize: "15px",
                fontWeight: 700,
                color: "#1f344d",
              }}
            >
              <span>Grand Total</span>
              <span style={{ fontSize: "20px", fontWeight: 800 }}>
                ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* FORM ACTIONS */}
        <div className="formActions">
          <button
            type="button"
            className="cancelButton"
            onClick={() => router.push("/purchases")}
          >
            <FiX size={16} />
            Cancel
          </button>

          <button type="submit" className="saveButton" disabled={submitting}>
            {isEdit ? <FiEdit3 size={16} /> : <FiSave size={16} />}
            {submitting ? (isEdit ? "Updating Purchase..." : "Saving Purchase...") : (isEdit ? "Update Purchase Order" : "Save Purchase Order")}
          </button>
        </div>
      </form>
    </section>
  );
}




