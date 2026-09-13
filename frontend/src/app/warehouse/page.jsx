"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getWarehouses,
  searchWarehouses,
  deleteWarehouse,
} from "@/services/warehouseService";
import WarehouseCard from "./components/WarehouseCard";
import { useAlert } from "@/context/AlertContext";

import { useCompany } from "@/context/CompanyContext";
import "./warehouse.css";

export default function WarehousePage() {
  const { isGym, isTextile } = useCompany();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const { showSuccess, showWarning, showError, showConfirm } = useAlert();

  // Filter warehouses by active ERP context
  const displayWarehouses = warehouses.filter((w) => {
    const isTex = w.code?.startsWith("TEX-") || w.name?.toLowerCase().includes("mill") || w.name?.toLowerCase().includes("fabric") || w.name?.toLowerCase().includes("dye") || w.name?.toLowerCase().includes("spinning") || w.name?.toLowerCase().includes("textile") || w.address?.includes("[TEXTILE]");
    const isGymWh = w.code?.startsWith("GYM-") || w.name?.toLowerCase().includes("fitness") || w.name?.toLowerCase().includes("gym") || w.address?.includes("[GYM]");
    
    if (isTextile) return isTex;
    if (isGym) return isGymWh;
    return !isTex && !isGymWh;
  });

  // Stats computation
  const totalWarehouses = displayWarehouses.length;
  const activeWarehouses = displayWarehouses.filter((w) => w.status !== "INACTIVE").length;
  const inactiveWarehouses = displayWarehouses.filter((w) => w.status === "INACTIVE").length;

  // Load warehouses
  const loadWarehouses = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getWarehouses();
      const data = response?.data || response || [];
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Warehouse error:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load warehouses"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  // Dynamic search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim()) {
        loadWarehouses();
        return;
      }

      try {
        setSearchLoading(true);
        const response = await searchWarehouses(search);
        const data = response?.data || response || [];
        setWarehouses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Search error:", error);
        setError(
          error.response?.data?.message ||
            "Failed to search warehouses"
        );
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Delete
  const handleDelete = (id) => {
    showConfirm({
      title: "Delete Warehouse",
      message: "Are you sure you want to delete this warehouse location? This action cannot be undone.",
      confirmText: "Delete Warehouse",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteWarehouse(id);
          showSuccess("Product updated", "Warehouse deleted successfully.");
          await loadWarehouses();
        } catch (err) {
          console.error("Delete error:", err);
          showError("Product couldn't be deleted", err.response?.data?.message || err.message || "Failed to delete warehouse.");
        }
      },
    });
  };

  return (
    <div className="warehouse-page-wrapper">
      {/* Sub-Navigation */}
      <nav className="warehouse-nav-tabs">
        <Link href="/warehouse" className="nav-tab-item active">
          Warehouse Overview
        </Link>
        <Link href="/warehouse/stock" className="nav-tab-item">
          Stock Inventory
        </Link>
        <Link href="/warehouse/transfer" className="nav-tab-item">
          Stock Transfer
        </Link>
      </nav>


      {/* Main Content Area */}
      <main className="warehouse-main-content">
        {/* Action Toolbar */}
        <div className="warehouse-toolbar">
          <Link href="/warehouse/add" className="btn-add-action">
            {isTextile ? "Add Mill Warehouse" : isGym ? "Add Gym Depot" : "Add Warehouse"} <span>+</span>
          </Link>

          <div className="toolbar-controls">
            <input
              type="text"
              placeholder="Search warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-pill"
            />
            <button className="btn-search-icon" title="Search">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            {searchLoading && (
              <span style={{ fontSize: "13px", color: "#6b7280", marginLeft: "8px" }}>
                Searching...
              </span>
            )}
          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="warehouse-stats-summary">
          <div className="stat-pill-card">
            <span className="stat-pill-label">Total Warehouses</span>
            <span className="stat-pill-value">{totalWarehouses}</span>
          </div>
          <div className="stat-pill-card">
            <span className="stat-pill-label">Active Locations</span>
            <span className="stat-pill-value" style={{ color: "var(--status-active-text)" }}>
              {activeWarehouses}
            </span>
          </div>
          <div className="stat-pill-card">
            <span className="stat-pill-label">Inactive Locations</span>
            <span className="stat-pill-value" style={{ color: "var(--status-out-text)" }}>
              {inactiveWarehouses}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="warehouse-error" style={{ color: "var(--status-out-text)", backgroundColor: "var(--status-out-bg)", padding: "12px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #fecaca", fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Loading / Cards Grid */}
        {loading ? (
          <div className="warehouse-loading" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "16px" }}>
            Loading warehouses...
          </div>
        ) : displayWarehouses.length === 0 ? (
          <div className="warehouse-empty" style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-dark)", marginBottom: "8px" }}>No warehouses found</h2>
            <p style={{ color: "var(--text-muted)" }}>Add a warehouse or change your search.</p>
          </div>
        ) : (
          <div className="warehouse-cards-grid">
            {displayWarehouses.map((warehouse) => (
              <WarehouseCard
                key={warehouse.id}
                warehouse={warehouse}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}