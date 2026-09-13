"use client";

import { useState, useEffect } from "react";
import { restaurantService } from "@/services/restaurantService";
import { getBranches, createBranch } from "@/services/branchService";
import { useCompany } from "@/context/CompanyContext";
import { useRouter } from "next/navigation";
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiPhone, FiCoffee, FiAlertCircle, FiShield } from "react-icons/fi";
import { showSuccess, showError, showWarning, showConfirm } from "@/utils/swal";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";



export default function RestaurantManagePage() {
  const router = useRouter();
  const { user } = useCompany();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [creatingBranch, setCreatingBranch] = useState(false);

  const roleUpper = (user?.role || "").toUpperCase();
  const isSuperAdmin = roleUpper.includes("SUPER");
  const isAdmin = isSuperAdmin || roleUpper.includes("ADMIN") || roleUpper.includes("OWNER");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    branchId: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [restRes, branchRes] = await Promise.all([
        restaurantService.getRestaurants(),
        getBranches(),
      ]);

      const restList = restRes.data || [];
      setRestaurants(restList);

      const branchList = branchRes.data || branchRes || [];
      setBranches(branchList);
      if (branchList.length > 0) {
        setForm((prev) => ({
          ...prev,
          branchId: prev.branchId || branchList[0].id,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCreateBranch = async () => {
    try {
      setCreatingBranch(true);
      const res = await createBranch({
        name: "Main Branch Outlet",
        code: "BR-01",
        address: "Main City Center",
      });
      const newBranch = res.data || res;
      showSuccess("Branch Created", "Main Branch created successfully!");
      const branchRes = await getBranches();
      const updatedBranches = branchRes.data || branchRes || [];
      setBranches(updatedBranches);
      if (newBranch?.id || updatedBranches.length > 0) {
        setForm((prev) => ({ ...prev, branchId: newBranch?.id || updatedBranches[0].id }));
      }
    } catch (err) {
      showError("Failed", err.response?.data?.message || err.message || "Failed to create branch");
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showWarning("Name Required", "Please enter a Restaurant Name.");
      return;
    }

    if (form.phone && !isValidPhoneNumber(form.phone, false)) {
      showWarning("Invalid Phone Number", "Phone number must contain exactly 10 digits.");
      return;
    }


    let targetBranchId = form.branchId || branches[0]?.id;
    if (!targetBranchId) {
      try {
        const newBranchRes = await createBranch({
          name: "Main Branch Outlet",
          code: "BR-01",
          address: "Main City Center",
        });
        const createdB = newBranchRes.data || newBranchRes;
        targetBranchId = createdB?.id;
      } catch (err) {
        console.error("Failed to auto-create default branch:", err);
      }
    }

    const payload = {
      ...form,
      branchId: targetBranchId,
    };

    try {
      if (editingRestaurant) {
        await restaurantService.updateRestaurant(editingRestaurant.id, payload);
        showSuccess("Updated", "Restaurant outlet updated successfully!");
      } else {
        await restaurantService.createRestaurant(payload);
        showSuccess("Created", "New restaurant outlet added successfully!");
      }
      setShowAddModal(false);
      setEditingRestaurant(null);
      setForm({ name: "", code: "", branchId: branches[0]?.id || "", phone: "", address: "" });
      fetchData();
    } catch (err) {
      showError("Error", err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (rest) => {
    setEditingRestaurant(rest);
    setForm({
      name: rest.name || "",
      code: rest.code || "",
      branchId: rest.branchId || (branches[0]?.id || ""),
      phone: rest.phone || "",
      address: rest.address || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Delete Outlet?",
      text: "Are you sure you want to delete this restaurant outlet?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await restaurantService.deleteRestaurant(id);
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
      fetchData();
      showSuccess("Deleted", "Restaurant outlet deleted successfully!");
    } catch (err) {
      showError("Delete Failed", err.response?.data?.message || err.message || "Failed to delete restaurant outlet");
    }
  };

  if (loading) {
    return <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading Restaurants...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", maxWidth: "600px", margin: "40px auto", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #cbd5e1", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <FiShield size={48} style={{ color: "#ef4444", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" }}>Access Restricted — Outlet Setup</h2>
        <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.5" }}>
          Restaurant Outlet Configuration & Setup is restricted to Super Admin & Main Admin accounts only. Restaurant Managers work within their assigned outlet.
        </p>
        <button
          onClick={() => router.push("/restaurant/dashboard")}
          style={{ marginTop: "20px", padding: "10px 20px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
        >
          Go to Restaurant Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", margin: 0 }}>Restaurant Outlets Management</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Add, edit & manage multi-outlet restaurant locations under your branches.</p>
        </div>

        <button
          onClick={() => {
            setEditingRestaurant(null);
            setForm({ name: "", code: "", branchId: branches[0]?.id || "", phone: "", address: "" });
            setShowAddModal(true);
          }}
          style={{
            padding: "10px 18px",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FiPlus size={18} /> Add Restaurant Outlet
        </button>
      </div>

      {/* Restaurant List Grid */}
      {restaurants.length === 0 ? (
        <div style={{ backgroundColor: "#fff", padding: "48px", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
          <FiCoffee size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
          <h3 style={{ color: "#0f172a", fontSize: "18px", fontWeight: "700", margin: "0 0 6px 0" }}>No restaurant outlets found</h3>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>Create your first restaurant outlet location to begin operations.</p>
          <button
            onClick={() => {
              setEditingRestaurant(null);
              setForm({ name: "", code: "", branchId: branches[0]?.id || "", phone: "", address: "" });
              setShowAddModal(true);
            }}
            style={{ padding: "10px 20px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
          >
            + Create Outlet
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {restaurants.map((rest) => (
            <div
              key={rest.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #2563eb",
                display: "flex",
                flexDirection: "column",
                justify: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "2px 8px", borderRadius: "6px", textTransform: "uppercase" }}>
                      {rest.code || "OUTLET"}
                    </span>
                    <h3 style={{ margin: "6px 0 2px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{rest.name}</h3>
                  </div>
                </div>

                <div style={{ fontSize: "13px", color: "#64748b", display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FiMapPin size={14} />
                    <span>Branch: {rest.branch?.name || "Main Branch"}</span>
                  </div>

                  {rest.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FiPhone size={14} />
                      <span>Phone: {rest.phone}</span>
                    </div>
                  )}

                  {rest.address && (
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                      Address: {rest.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                <button
                  onClick={() => handleEdit(rest)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FiEdit /> Edit
                </button>

                <button
                  onClick={() => handleDelete(rest.id)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Restaurant Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "#fff", padding: "28px", borderRadius: "14px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h3 style={{ margin: "0 0 18px 0", fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>
              {editingRestaurant ? "Edit Restaurant Outlet" : "Add New Restaurant Outlet"}
            </h3>

            <form onSubmit={handleSaveRestaurant}>
              {/* Restaurant Name */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                  Restaurant Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Dining - Main Outlet"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* Outlet Code */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                  Outlet Code / Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. RST-01"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
              </div>

              {/* Phone Number */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                />
                {form.phone && getPhoneValidationError(form.phone, false) && (
                  <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    ⚠ {getPhoneValidationError(form.phone, false)}
                  </span>
                )}
              </div>


              {/* Address */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "#334155" }}>
                  Address / Location
                </label>
                <textarea
                  rows="3"
                  placeholder="Street, City, Building Details..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                ></textarea>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#fff",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    borderRadius: "8px",
                    backgroundColor: "#2563eb",
                    color: "#fff",
                    border: "none",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {editingRestaurant ? "Update Outlet" : "Save Outlet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
