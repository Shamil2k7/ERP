"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiShoppingBag,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiGrid,
  FiLayers,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import apiClient from "@/services/apiClient";
import { showConfirm } from "@/utils/swal";
import { useCompany } from "@/context/CompanyContext";

export default function TextileProductsPage() {
  const router = useRouter();
  const { user, isModuleEnabled, loading: companyLoading } = useCompany();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!companyLoading && user && !isModuleEnabled("PRODUCTS")) {
      router.replace("/unauthorized");
    }
  }, [user, companyLoading, isModuleEnabled, router]);

  const [formData, setFormData] = useState({
    name: "",
    fabricComposition: "80% Cotton, 20% Polyester",
    gsm: "180",
    rollWidth: "58",
    widthUnit: "Inches",
    color: "Solid Navy",
    pattern: "Plain / Solid",
    weaveType: "Plain weave",
    initialStock: "500",
    sellingPrice: "350",
  });

  const fetchTextileProducts = async () => {
    try {
      const res = await apiClient.get("/products").then((r) => r.data);
      const all = res.data || (Array.isArray(res) ? res : []);

      const textileDbItems = all.filter((p) => {
        const isTexSku = p.sku?.startsWith("TEX-") || p.sku?.startsWith("FAB-");
        const isTexDesc = p.description?.includes("[TEXTILE]");
        const hasFabricAttr = Boolean(
          p.fabricComposition || p.gsm || p.rollWidth || p.weaveType
        );
        return isTexSku || isTexDesc || (p.isTextile === true && hasFabricAttr);
      });

      const mapped = textileDbItems.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        fabricComposition: p.fabricComposition || "Cotton Blend",
        gsm: p.gsm || 180,
        rollWidth: p.rollWidth ? `${p.rollWidth} ${p.widthUnit || "Inches"}` : "58 Inches",
        colorPattern: `${p.color || ""} ${p.pattern || "Solid"}`.trim() || "Solid",
        stockMeters: p.initialStock || p.inventories?.[0]?.quantity || 500,
        pricePerMeter: Number(p.sellingPrice) || 350,
        variantsCount: p.variants?.length || 0,
        status: p.status || "ACTIVE",
      }));

      setProducts(mapped);
    } catch (err) {
      console.error("Error loading textile products from DB:", err);
    }
  };

  useEffect(() => {
    fetchTextileProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sellingPrice) {
      toast.error("Please enter fabric name and selling price per meter");
      return;
    }

    setSubmitting(true);
    const sku = `FAB-TEX-${Date.now().toString().slice(-6)}`;

    const payload = {
      name: formData.name,
      sku,
      isTextile: true,
      fabricComposition: formData.fabricComposition,
      gsm: parseFloat(formData.gsm || 180),
      rollWidth: parseFloat(formData.rollWidth || 58),
      widthUnit: formData.widthUnit || "Inches",
      color: formData.color,
      pattern: formData.pattern,
      weaveType: formData.weaveType,
      initialStock: parseFloat(formData.initialStock || 500),
      stockUnit: "Meter",
      costPrice: parseFloat(formData.sellingPrice || 0) * 0.75,
      sellingPrice: parseFloat(formData.sellingPrice || 0),
      description: `[TEXTILE] Fabric: ${formData.fabricComposition} | GSM: ${formData.gsm} | Width: ${formData.rollWidth} ${formData.widthUnit}`,
    };

    try {
      const res = await apiClient.post("/products", payload).then((r) => r.data);
      const savedProd = res.data || res;

      const newProd = {
        id: savedProd.id || `TEX-${Date.now()}`,
        sku: savedProd.sku || sku,
        name: formData.name,
        fabricComposition: formData.fabricComposition,
        gsm: Number(formData.gsm) || 180,
        rollWidth: `${formData.rollWidth} ${formData.widthUnit}`,
        colorPattern: `${formData.color} ${formData.pattern}`,
        stockMeters: Number(formData.initialStock) || 500,
        pricePerMeter: Number(formData.sellingPrice),
        variantsCount: 0,
        status: "ACTIVE",
      };

      setProducts([newProd, ...products]);
      toast.success(`Fabric product "${formData.name}" saved to database!`);
      setShowAddModal(false);
      setFormData({
        name: "",
        fabricComposition: "80% Cotton, 20% Polyester",
        gsm: "180",
        rollWidth: "58",
        widthUnit: "Inches",
        color: "Solid Navy",
        pattern: "Plain / Solid",
        weaveType: "Plain weave",
        initialStock: "500",
        sellingPrice: "350",
      });
    } catch (err) {
      console.error("Error saving textile product to DB:", err);
      toast.error(err.response?.data?.message || "Failed to save textile product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await showConfirm({
      title: "Remove Fabric Product?",
      text: `Are you sure you want to remove product "${name}" from textile catalog?`,
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (isConfirmed) {
      try {
        await apiClient.delete(`/products/${id}`);
      } catch (err) {
        console.warn("Backend delete note:", err.message);
      }
      setProducts(products.filter((p) => p.id !== id));
      toast.success("Fabric product deleted successfully");
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.fabricComposition.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

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
            <FiShoppingBag style={{ color: "#0d9488" }} /> Textile Finished Products Catalog
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
            Manage finished fabric rolls, GSM specifications, width metrics, pricing, and ready stock.
          </p>
        </div>

        <button
          onClick={() => window.location.href = "/textile/products/add"}
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
          <FiPlus size={16} /> Add Textile Product
        </button>
      </div>

      {/* SEARCH BAR */}
      <div
        style={{
          background: "#ffffff",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <FiSearch style={{ color: "#64748b" }} />
        <input
          type="text"
          placeholder="Search SKU, fabric composition, or color pattern..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "14px" }}
        />
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
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>SKU</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Product Name</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Fabric Composition</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>GSM / Width</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Variants</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Stock Available</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Selling Price</th>
                <th style={{ padding: "14px 20px", fontWeight: "700", color: "#475569" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0d9488" }}>{p.sku || p.id}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: "700", color: "#0f172a" }}>{p.name}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{p.colorPattern}</div>
                  </td>
                  <td style={{ padding: "16px 20px", color: "#334155" }}>{p.fabricComposition}</td>
                  <td style={{ padding: "16px 20px", color: "#475569" }}>
                    <strong>{p.gsm} GSM</strong> ({p.rollWidth})
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    {p.variantsCount > 0 ? (
                      <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                        <FiGrid style={{ marginRight: "4px" }} /> {p.variantsCount} Variants
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "12px" }}>Base item</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 20px", fontWeight: "700", color: "#0f172a" }}>
                    {p.stockMeters.toLocaleString()} Meters
                  </td>
                  <td style={{ padding: "16px 20px", fontWeight: "800", color: "#0d9488" }}>
                    ₹{p.pricePerMeter} <span style={{ fontSize: "12px", fontWeight: "500", color: "#64748b" }}>/ Meter</span>
                  </td>
                  <td style={{ padding: "16px 20px", display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                      onClick={() => window.location.href = `/admin/products/details/${p.id}`}
                      style={{
                        padding: "6px 10px",
                        background: "#e0f2fe",
                        color: "#0369a1",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => window.location.href = `/textile/products/edit/${p.id}`}
                      style={{
                        padding: "6px 10px",
                        background: "#f1f5f9",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      style={{
                        padding: "6px 10px",
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
                      <FiTrash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
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
              maxWidth: "540px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                🛍️ Add Finished Textile Fabric Product
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProduct}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Jacquard Damask Fabric"
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Fabric Composition
                  </label>
                  <input
                    type="text"
                    name="fabricComposition"
                    value={formData.fabricComposition}
                    onChange={handleInputChange}
                    placeholder="80% Cotton, 20% Silk"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    GSM (g/m²)
                  </label>
                  <input
                    type="number"
                    name="gsm"
                    value={formData.gsm}
                    onChange={handleInputChange}
                    placeholder="180"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Roll Width
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="number"
                      name="rollWidth"
                      value={formData.rollWidth}
                      onChange={handleInputChange}
                      placeholder="58"
                      style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                    />
                    <select
                      name="widthUnit"
                      value={formData.widthUnit}
                      onChange={handleInputChange}
                      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    >
                      <option value="Inches">Inches</option>
                      <option value="CM">CM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Color Name
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="Royal Blue"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Initial Stock (Meters)
                  </label>
                  <input
                    type="number"
                    name="initialStock"
                    value={formData.initialStock}
                    onChange={handleInputChange}
                    placeholder="500"
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    Selling Price (₹ / Meter) *
                  </label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleInputChange}
                    placeholder="350"
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
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
                  disabled={submitting}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                >
                  {submitting ? "Saving..." : "Save Fabric Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
