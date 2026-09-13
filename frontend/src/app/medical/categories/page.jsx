"use client";

import { useEffect, useState } from "react";
import { FiBox, FiPlus, FiTrash2, FiRefreshCw } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import apiClient from "@/services/apiClient";
import { showConfirm } from "@/utils/swal";

export default function MedicineCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/categories");
      const list = res.data?.data || res.data || [];
      setCategories(list);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      toast.error("Failed to load medicine categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const code = name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 20);
      const res = await apiClient.post("/categories", {
        name: name.trim(),
        description: desc.trim() || undefined,
        code,
        status: "ACTIVE"
      });

      if (res.data?.success || res.status === 201 || res.status === 200) {
        toast.success(`Category "${name}" created successfully!`);
        setName("");
        setDesc("");
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to create category", err);
      toast.error(err.response?.data?.message || "Failed to create category");
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Delete Category?",
      text: "Are you sure you want to delete this category?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;

    try {
      await apiClient.delete(`/categories/${id}`);
      toast.success("Category deleted successfully!");
      fetchCategories();
    } catch (err) {
      console.error("Failed to delete category", err);
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "Inter, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Toaster position="top-right" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Medicine Categories</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Manage pharmacological classifications like Analgesics, Antibiotics, etc.</p>
        </div>
        <button onClick={fetchCategories} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <FiRefreshCw /> Reload List
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px" }}>
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", height: "fit-content" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Add Category</h3>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input type="text" placeholder="Category Name" required value={name} onChange={(e) => setName(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            <input type="text" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
            <button type="submit" style={{ padding: "10px", border: "none", background: "#10b981", color: "#ffffff", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Save Category</button>
          </form>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Active Classifications</h3>
          {loading ? (
            <p style={{ color: "#64748b", fontSize: "14px" }}>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "14px" }}>No categories found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {categories.map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", border: "1px solid #f1f5f9", borderRadius: "12px", background: "#f8fafc" }}>
                  <div>
                    <strong>{c.name}</strong>
                    {c.description && <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b" }}>{c.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(c.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><FiTrash2 /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
