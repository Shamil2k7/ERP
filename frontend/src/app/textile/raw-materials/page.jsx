"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiLayers,
  FiPlus,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiEdit2,
  FiAlertTriangle,
  FiX,
  FiSave,
  FiPackage,
} from "react-icons/fi";
import { showConfirm } from "@/utils/swal";
import { toast, Toaster } from "react-hot-toast";
import apiClient from "@/services/apiClient";
import { useCompany } from "@/context/CompanyContext";

export default function RawMaterialsPage() {
  const router = useRouter();
  const { user, isModuleEnabled, loading: companyLoading } = useCompany();

  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!companyLoading && user && !isModuleEnabled("RAW_MATERIALS")) {
      router.replace("/unauthorized");
    }
  }, [user, companyLoading, isModuleEnabled, router]);

  const [formData, setFormData] = useState({
    name: "",
    category: "Yarn",
    stock: "",
    unit: "KG",
    reorderLevel: "",
    supplier: "",
    costPerUnit: "",
  });

  useEffect(() => {
    async function loadMaterials() {
      try {
        const res = await apiClient.get("/textile/raw-materials");
        if (res.data?.success && Array.isArray(res.data.data)) {
          setMaterials(res.data.data);
          localStorage.setItem("textile_raw_materials", JSON.stringify(res.data.data));
          return;
        }
      } catch (err) {
        console.warn("Backend raw-materials fetch fallback to localStorage:", err);
      }
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("textile_raw_materials");
        if (stored) {
          setMaterials(JSON.parse(stored));
        }
      }
    }
    loadMaterials();
  }, []);

  const saveMaterials = async (newMaterials) => {
    setMaterials(newMaterials);
    if (typeof window !== "undefined") {
      localStorage.setItem("textile_raw_materials", JSON.stringify(newMaterials));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stock) {
      toast.error("Please enter material name and stock quantity");
      return;
    }

    const payload = {
      name: formData.name,
      category: formData.category,
      stock: Number(formData.stock),
      quantity: Number(formData.stock),
      unit: formData.unit,
      reorderLevel: Number(formData.reorderLevel) || 500,
      supplier: formData.supplier || "General Supplier",
      costPerUnit: Number(formData.costPerUnit) || 100,
      status: Number(formData.stock) <= (Number(formData.reorderLevel) || 500) ? "LOW_STOCK" : "IN_STOCK",
    };

    try {
      const res = await apiClient.post("/textile/raw-materials", payload);
      if (res.data?.success && res.data?.data) {
        saveMaterials([res.data.data, ...materials]);
      } else {
        const newMat = {
          id: `RM-${Math.floor(100 + Math.random() * 900)}`,
          ...payload,
        };
        saveMaterials([newMat, ...materials]);
      }
    } catch (err) {
      const newMat = {
        id: `RM-${Math.floor(100 + Math.random() * 900)}`,
        ...payload,
      };
      saveMaterials([newMat, ...materials]);
    }

    toast.success(`Raw Material "${formData.name}" saved successfully!`);
    setShowAddModal(false);
    setFormData({
      name: "",
      category: "Yarn",
      stock: "",
      unit: "KG",
      reorderLevel: "",
      supplier: "",
      costPerUnit: "",
    });
  };

  const handleDeleteMaterial = async (id, name) => {
    try {
      await apiClient.delete(`/textile/raw-materials/${id}`);
    } catch (err) {
      console.warn("Delete raw material API fallback:", err);
    }
    const updated = materials.filter((m) => m.id !== id);
    saveMaterials(updated);
    toast.success(`Material "${name}" deleted.`);
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await showConfirm({
      title: "Remove Raw Material?",
      text: `Are you sure you want to remove raw material "${name}"?`,
      confirmButtonText: "Yes, Remove",
      icon: "warning",
    });
    if (isConfirmed) {
      setMaterials(materials.filter((m) => m.id !== id));
      toast.success("Material removed from inventory");
    }
  };

  const filtered = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.supplier.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif" }}>
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
            <FiLayers style={{ color: "#0d9488" }} /> Textile Raw Materials Inventory
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Track yarn stock, cotton fiber, dyes, chemical additives, and trims for production batches.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
          <FiPlus size={16} /> Add Raw Material
        </button>
      </div>

      {/* TOOLBAR */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          gap: "14px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: "260px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "8px 14px",
          }}
        >
          <FiSearch style={{ color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search material name, ID, or supplier..."
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FiFilter style={{ color: "#64748b" }} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
              background: "#ffffff",
              fontWeight: "600",
              color: "#334155",
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="Yarn">Yarn</option>
            <option value="Dyes & Chemicals">Dyes & Chemicals</option>
            <option value="Raw Fiber">Raw Fiber</option>
            <option value="Trims & Accessories">Trims & Accessories</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Code</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Material Name</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Category</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Current Stock</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Supplier</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Unit Price</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Status</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0d9488" }}>{m.id}</td>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a" }}>{m.name}</td>
                  <td style={{ padding: "16px 20px", color: "#475569" }}>{m.category}</td>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a" }}>
                    {m.stock.toLocaleString()} <span style={{ fontSize: "12px", color: "#64748b" }}>{m.unit}</span>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#334155" }}>{m.supplier}</td>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a" }}>
                    ₹{m.costPerUnit} / {m.unit}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "700",
                        background: m.status === "LOW_STOCK" ? "#fee2e2" : "#d1fae5",
                        color: m.status === "LOW_STOCK" ? "#dc2626" : "#047857",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {m.status === "LOW_STOCK" && <FiAlertTriangle size={12} />}
                      {m.status === "LOW_STOCK" ? "Low Stock Alert" : "In Stock"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <button
                      onClick={() => handleDelete(m.id, m.name)}
                      style={{
                        padding: "6px 12px",
                        background: "#fee2e2",
                        color: "#ef4444",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FiTrash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MATERIAL MODAL */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                ➕ Register New Raw Material
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMaterial}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Material Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Carded Cotton Yarn Ne 30/1"
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="Yarn">Yarn</option>
                    <option value="Dyes & Chemicals">Dyes & Chemicals</option>
                    <option value="Raw Fiber">Raw Fiber</option>
                    <option value="Trims & Accessories">Trims & Accessories</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Measurement Unit
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="KG">KG</option>
                    <option value="Meters">Meters</option>
                    <option value="Bags">Bags</option>
                    <option value="Spools">Spools</option>
                    <option value="Rolls">Rolls</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="1000"
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    name="costPerUnit"
                    value={formData.costPerUnit}
                    onChange={handleInputChange}
                    placeholder="350"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  placeholder="e.g. Apex Spinning Mills"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", fontWeight: "600" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
