"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getWarehouseById, deleteWarehouse } from "@/services/warehouseService";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import "../warehouse.css";

export default function ViewWarehousePage() {
  const { id } = useParams();
  const router = useRouter();
  const { isGym, isTextile } = useCompany();
  const { showSuccess, showError, showConfirm } = useAlert();

  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setWarehouse(data);
    } catch (err) {
      console.error(err);
      showError("Warehouse Error", err.response?.data?.message || "Failed to load warehouse details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: "Delete Warehouse",
      message: "Are you sure you want to delete this warehouse location? This action cannot be undone.",
      confirmText: "Delete Warehouse",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteWarehouse(id);
          showSuccess("Product updated", "Warehouse deleted successfully.");
          router.push("/warehouse");
        } catch (err) {
          console.error(err);
          showError("Product couldn't be deleted", err.response?.data?.message || "Failed to delete warehouse.");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="warehouse-page-wrapper" style={{ padding: "60px", textAlign: "center" }}>
        <p style={{ fontSize: "16px", color: "#64748b", fontWeight: "600" }}>Loading warehouse details...</p>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="warehouse-page-wrapper" style={{ padding: "60px", textAlign: "center" }}>
        <h2>Warehouse Not Found</h2>
        <p style={{ color: "#64748b", marginBottom: "20px" }}>The requested warehouse location could not be located.</p>
        <Link href="/warehouse" className="btn-add-action" style={{ display: "inline-block" }}>
          Back to Warehouses
        </Link>
      </div>
    );
  }

  return (
    <div className="warehouse-page-wrapper" style={{ padding: "30px 20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/warehouse" style={{ fontSize: "14px", color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>
          ← Back to Warehouses Overview
        </Link>
      </div>

      <div className="modal-content-card" style={{ margin: "0 auto", maxWidth: "800px", padding: "0" }}>
        <div className="modal-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              📦 {warehouse.name}
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>
              Code: <strong style={{ color: "#4f46e5" }}>{warehouse.code || "N/A"}</strong>
            </p>
          </div>
          <span
            className={warehouse.status === "INACTIVE" ? "status inactive" : "status active"}
            style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}
          >
            {warehouse.status || "ACTIVE"}
          </span>
        </div>

        <div className="modal-card-body" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>LOCATION / CITY</span>
              <strong style={{ fontSize: "15px", color: "#1e293b" }}>{warehouse.location || "Not Specified"}</strong>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>ADDRESS</span>
              <strong style={{ fontSize: "15px", color: "#1e293b" }}>{warehouse.address?.replace(/\[(TEXTILE|GYM|RETAIL)\]/g, "") || "Not Specified"}</strong>
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block" }}>REGISTERED STATUS</span>
            <strong style={{ fontSize: "15px", color: warehouse.status === "INACTIVE" ? "#ef4444" : "#10b981" }}>
              {warehouse.status === "INACTIVE" ? "Inactive / Archived" : "Active Operating Facility"}
            </strong>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <Link
              href={`/warehouse/edit/${warehouse.id}`}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "12px",
                background: "#4f46e5",
                color: "#ffffff",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Edit Warehouse
            </Link>

            <button
              onClick={handleDelete}
              style={{
                padding: "12px 20px",
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Delete Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
