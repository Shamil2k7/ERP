"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getWarehouseById, updateWarehouse } from "@/services/warehouseService";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import "../../warehouse.css";

export default function EditWarehousePage() {
  const { id } = useParams();
  const router = useRouter();
  const { isGym, isTextile } = useCompany();
  const { showSuccess, showError } = useAlert();

  const [form, setForm] = useState({
    name: "",
    code: "",
    location: "",
    address: "",
    status: "ACTIVE",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWarehouse();
    }
  }, [id]);

  const fetchWarehouse = async () => {
    try {
      setLoading(true);
      const res = await getWarehouseById(id);
      const data = res?.data || res;
      if (data) {
        setForm({
          name: data.name || "",
          code: data.code || "",
          location: data.location || "",
          address: data.address?.replace(/\[(TEXTILE|GYM|RETAIL)\]/g, "").trim() || "",
          status: data.status || "ACTIVE",
        });
      }
    } catch (err) {
      console.error(err);
      showError("Warehouse Error", err.response?.data?.message || "Failed to load warehouse.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const tag = isTextile ? "[TEXTILE]" : isGym ? "[GYM]" : "[RETAIL]";
      const finalAddress = form.address ? `${form.address} ${tag}` : tag;

      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        location: form.location.trim() || undefined,
        address: finalAddress,
        status: form.status,
      };

      await updateWarehouse(id, payload);
      showSuccess("Warehouse Updated", `${isTextile ? "Mill Warehouse" : "Warehouse"} updated successfully.`);
      router.push("/warehouse");
    } catch (err) {
      console.error(err);
      showError("Update Error", err.response?.data?.message || "Failed to update warehouse.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="warehouse-page-wrapper" style={{ padding: "60px", textAlign: "center" }}>
        <p style={{ fontSize: "16px", color: "#64748b", fontWeight: "600" }}>Loading warehouse details...</p>
      </div>
    );
  }

  return (
    <div className="warehouse-page-wrapper" style={{ padding: "40px 20px" }}>
      <div style={{ marginBottom: "20px", maxWidth: "650px", margin: "0 auto 20px auto" }}>
        <Link href="/warehouse" style={{ fontSize: "14px", color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>
          ← Back to Warehouses Overview
        </Link>
      </div>

      <div className="modal-content-card" style={{ margin: "0 auto", maxWidth: "650px", padding: "0" }}>
        <div className="modal-card-header">
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0 }}>
              ✏️ Edit {isTextile ? "Textile Mill Warehouse" : isGym ? "Gym Depot" : "Warehouse"}
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", margin: 0 }}>
              Update storage facility location, warehouse code, and operational status.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-card-body" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="modal-field-group">
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
              Warehouse Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Warehouse Name"
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
              Full Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Facility address details"
              rows={3}
              style={{
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                padding: "10px 14px",
                fontSize: "14px",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div className="modal-field-group">
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
              Operational Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="form-control-pill"
              style={{ padding: "10px 14px" }}
            >
              <option value="ACTIVE">Active (In Operation)</option>
              <option value="INACTIVE">Inactive (Archived)</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={() => router.push("/warehouse")}
              className="btn-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-modal-submit"
            >
              {submitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
