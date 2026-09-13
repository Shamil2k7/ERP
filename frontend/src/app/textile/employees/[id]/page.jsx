"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  User,
  Mail,
  Phone,
  Building2,
  CreditCard,
  ShieldCheck,
  Calendar,
  Layers,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import styles from "./employeeDetails.module.css";
import {
  getTextileEmployeeById,
  deleteTextileEmployee,
  updateTextileEmployee,
} from "@/services/textileEmployeeService";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import { toast, Toaster } from "react-hot-toast";

export default function TextileEmployeeDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { company, isTextile } = useCompany();
  const { showSuccess, showError, showConfirm } = useAlert();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
  });

  const fetchEmployeeData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getTextileEmployeeById(id);
      const data = res?.data || res;
      if (!data) {
        throw new Error("Employee not found in Textile ERP database.");
      }
      setEmployee(data);
      setEditForm({
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || data.roleRef?.name || "Weaver",
      });
    } catch (err) {
      console.error("Fetch textile employee error:", err);
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          "Failed to load employee details from database."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id, company?.id]);

  const handleDelete = () => {
    if (!employee) return;
    showConfirm({
      title: "Delete Textile Employee",
      message: `Are you sure you want to delete employee "${employee.fullName}" (${employee.employeeId})? This action will remove the record from the database.`,
      confirmText: "Delete Employee",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteTextileEmployee(employee.id);
          showSuccess("Employee Deleted", "Textile employee record deleted successfully.");
          router.push("/admin/employees/view");
        } catch (err) {
          console.error("Delete employee error:", err);
          showError("Deletion Failed", err.response?.data?.message || err.message || "Failed to delete employee.");
        }
      },
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!employee) return;

    if (!isValidPhoneNumber(editForm.phone, true)) {
      toast.error("Phone number must contain exactly 10 digits");
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateTextileEmployee(employee.id, editForm);
      toast.success("Employee details updated successfully");
      setIsEditModalOpen(false);
      await fetchEmployeeData();
    } catch (err) {
      console.error("Update employee error:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to update employee");
    } finally {
      setSubmitting(false);
    }
  };


  const getInitials = (name) => {
    if (!name) return "EM";
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <Loader2 className="animate-spin" size={32} color="#0891b2" />
          <span>Loading employee profile from database...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !employee) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <XCircle size={48} color="#ef4444" style={{ margin: "0 auto 16px auto" }} />
          <h2 className={styles.errorTitle}>Employee Not Found</h2>
          <p className={styles.errorSub}>
            {errorMsg || "The requested textile employee record could not be found in the database."}
          </p>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.push("/admin/employees/view")}
            style={{ margin: "0 auto" }}
          >
            <ArrowLeft size={16} /> Back to Employees / Staff
          </button>
        </div>
      </div>
    );
  }

  const roleName = employee.role || employee.roleRef?.name || "Weaver";
  const unitName = employee.branch?.name || "Main Textile Mill";
  const unitCode = employee.branch?.code || "MU-TEXTILE";
  const permissionsList = Array.isArray(employee.permissions)
    ? employee.permissions
    : typeof employee.permissions === "string"
    ? JSON.parse(employee.permissions || "[]")
    : [];

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />

      {/* TOP NAVIGATION BAR */}
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push("/admin/employees/view")}
        >
          <ArrowLeft size={16} /> Back to Employee Roster
        </button>

        <div className={styles.actionButtons}>
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 size={15} /> Edit Profile
          </button>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>

      {/* HERO BANNER CARD */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarCircle}>
            {getInitials(employee.fullName)}
          </div>
          <div className={styles.heroMeta}>
            <h1>{employee.fullName}</h1>
            <div className={styles.heroBadges}>
              <span className={styles.roleBadge}>{roleName}</span>
              <span className={styles.idBadge}>{employee.employeeId}</span>
              <span className={styles.statusBadge}>
                <span className={styles.statusDot} />
                {employee.isVerified !== false ? "Active / Verified" : "Pending Verification"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className={styles.detailsGrid}>
        {/* Personal & Contact Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <User size={18} />
            <h3>Personal & Contact Information</h3>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>
                <CreditCard size={14} /> Employee ID
              </span>
              <span className={styles.infoValue}>{employee.employeeId}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>
                <Mail size={14} /> Email Address
              </span>
              <span className={styles.infoValue}>{employee.email || "N/A"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>
                <Phone size={14} /> Phone Number
              </span>
              <span className={styles.infoValue}>{employee.phone || "N/A"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>
                <Calendar size={14} /> Registered Date
              </span>
              <span className={styles.infoValue}>
                {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Manufacturing Unit Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Building2 size={18} />
            <h3>Assigned Manufacturing Unit</h3>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Manufacturing Unit</span>
              <span className={styles.infoValue}>{unitName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Unit Code</span>
              <span className={styles.infoValue}>{unitCode}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ERP Context</span>
              <span className={styles.infoValue} style={{ color: "#0891b2" }}>TEXTILE ERP</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Unit Location</span>
              <span className={styles.infoValue}>
                {employee.branch?.address || "Main Mill Facility"}
              </span>
            </div>
          </div>
        </div>

        {/* Module Access Card */}
        <div className={styles.card} style={{ gridColumn: "1 / -1" }}>
          <div className={styles.cardHeader}>
            <ShieldCheck size={18} />
            <h3>System Module Permissions ({permissionsList.length})</h3>
          </div>
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b" }}>
            Operational access granted according to the assigned Textile ERP role ({roleName}):
          </p>
          <div className={styles.permGrid}>
            {permissionsList.length > 0 ? (
              permissionsList.map((mod, idx) => (
                <span key={idx} className={styles.permTag}>
                  ✓ {mod.replace(/_/g, " ")}
                </span>
              ))
            ) : (
              <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                Default Textile role permissions active.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
              Edit Textile Employee
            </h2>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  placeholder="10-digit Phone Number"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: sanitizePhoneInput(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
                {editForm.phone && getPhoneValidationError(editForm.phone, false) && (
                  <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    ⚠ {getPhoneValidationError(editForm.phone, false)}
                  </span>
                )}
              </div>


              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Role / Designation
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    background: "#ffffff",
                  }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Weaver">Weaver</option>
                  <option value="Dyer">Dyer</option>
                  <option value="Quality Inspector">Quality Inspector</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "8px 20px",
                    background: "#0891b2",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
