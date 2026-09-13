"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWarehouse } from "@/services/warehouseService";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import "../warehouse.css";

export default function AddWarehousePage() {
  const router = useRouter();
  const { isGym, isTextile } = useCompany();
  const { showSuccess, showError } = useAlert();

  const defaultPrefix = isTextile ? "TEX-WH-" : isGym ? "GYM-WH-" : "RET-WH-";

  const [form, setForm] = useState({
    name: "",
    code: `${defaultPrefix}${Math.floor(100 + Math.random() * 900)}`,
    location: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const tag = isTextile ? "[TEXTILE]" : isGym ? "[GYM]" : "[RETAIL]";
      const finalCode = form.code?.startsWith(defaultPrefix) ? form.code : `${defaultPrefix}${form.code}`;
      const finalAddress = form.address ? `${form.address} ${tag}` : tag;

      const payload = {
        ...form,
        code: finalCode,
        address: finalAddress,
      };

      await createWarehouse(payload);
      showSuccess("Warehouse Created", `${isTextile ? "Textile Mill Warehouse" : "Warehouse"} location registered successfully.`);
      router.push("/warehouse");
    } catch (error) {
      console.error(error);
      showError("Invalid form data", error.response?.data?.message || "Failed to create warehouse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="warehouse-page-wrapper" style={{ padding: "40px 20px" }}>
      <div className="modal-content-card" style={{ margin: "0 auto", padding: "0" }}>
        
        <div className="modal-card-header">
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>
              {isTextile
                ? "🧵 Add Textile Mill & Processing Warehouse"
                : isGym
                ? "🏋️ Add Gym Equipment Warehouse"
                : "📦 Add Retail Warehouse"}
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: 0 }}>
              {isTextile
                ? "Register a fabric mill, yarn depot, spinning center, or dyeing facility."
                : "Register a storage facility for store products or gym gear."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-card-body" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          <div className="modal-field-group">
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
              {isTextile ? "Mill / Warehouse Name *" : "Warehouse Name *"}
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={isTextile ? "e.g. Surat Spinning Depot A" : "Warehouse Name"}
              required
              className="form-control-pill"
            />
          </div>

          <div className="modal-field-group">
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
              Warehouse Code *
            </label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="Warehouse Code"
              required
              className="form-control-pill"
            />
          </div>

          <div className="modal-field-group">
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
              Location / City
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Industrial Estate Sector 4"
              className="form-control-pill"
            />
          </div>

          <div className="modal-field-group">
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
              Street Address & Details
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address details"
              rows={4}
              className="form-control-pill"
              style={{ minHeight: "100px", resize: "vertical" }}
            />
          </div>

          <div className="modal-card-footer" style={{ marginTop: "12px" }}>
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => router.push("/warehouse")}
              style={{ marginRight: "10px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-action-primary"
            >
              {loading
                ? "Creating..."
                : isTextile
                ? "Create Textile Mill Warehouse"
                : "Create Warehouse"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}