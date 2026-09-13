"use client";

import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  FiPlus,
  FiPrinter,
  FiDownload,
  FiSearch,
  FiChevronDown,
  FiRefreshCw,
  FiX,
  FiSave,
  FiTrash2,
  FiPhone,
  FiMail,
  FiShield,
  FiUserCheck,
  FiMapPin,
  FiLock,
  FiCreditCard,
  FiCheckCircle,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

import { getBranches } from "@/services/branchService";
import { restaurantService } from "@/services/restaurantService";
import { useCompany } from "@/context/CompanyContext";
import { useAlert } from "@/context/AlertContext";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";
import apiClient from "@/services/apiClient";

import styles from "./managers.module.css";

export default function ManagersPage() {
  const { isRestaurant } = useCompany();
  const [managers, setManagers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const { showSuccess, showError, showConfirm } = useAlert();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    branchId: "",
    employeeId: "",
    password: "",
    role: "Manager", // Fixed role as required
  });

  // Fetch branches and managers on load
  useEffect(() => {
    fetchBranches();
    fetchManagers();
  }, []);

  const fetchBranches = async () => {
    try {
      const [res, restRes] = await Promise.all([
        getBranches().catch(() => []),
        restaurantService.getRestaurants().catch(() => []),
      ]);

      const bList = res?.success && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      const rList = Array.isArray(restRes?.data) ? restRes.data : Array.isArray(restRes) ? restRes : [];

      let combined = [];
      if (isRestaurant) {
        if (rList.length > 0) {
          combined = rList.map((r) => ({
            id: r.id,
            branchId: r.branchId || r.id,
            name: r.code ? `${r.name} (${r.code})` : r.name,
            code: r.code || "OUTLET",
          }));
        } else {
          combined = bList.map((b) => ({
            id: b.id,
            branchId: b.id,
            name: b.name,
            code: b.code || "BRANCH",
          }));
        }
      } else {
        combined = [...bList];
        rList.forEach((r) => {
          if (r?.id && !combined.some((b) => b.id === r.id || b.id === r.branchId)) {
            combined.push({
              id: r.id,
              branchId: r.branchId || r.id,
              name: `${r.name} (${r.code || "Outlet"})`,
              code: r.code || "OUTLET",
            });
          }
        });
      }
      setBranches(combined);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  };

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/employees");
      const allEmployees = res.data?.data || [];
      // Filter managers or all employees with manager/admin role
      const filtered = allEmployees.filter(
        (emp) =>
          emp.role?.toUpperCase() === "MANAGER" ||
          emp.role?.toUpperCase() === "ADMIN"
      );
      setManagers(filtered);
    } catch (err) {
      console.error("Failed to fetch managers:", err);
      toast.error("Failed to fetch manager records");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Name must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Enter a valid email address";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(formData.phone.trim(), true)) {
      newErrors.phone = getPhoneValidationError(formData.phone.trim(), true) || "Phone number must contain exactly 10 digits";
    }

    if (!formData.branchId) {
      newErrors.branchId = "Branch selection is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const sanitized = sanitizePhoneInput(value);
      setFormData((prev) => ({
        ...prev,
        [name]: sanitized,
      }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };


  const handleSaveManager = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Auto-generate employeeId if not manually provided
      const autoId = formData.employeeId.trim() || `MGR-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        branchId: formData.branchId,
        role: "Manager", // Fixed role: Manager
        password: formData.password,
        employeeId: autoId,
      };

      await apiClient.post("/employees", payload);

      toast.success("Manager added successfully!");
      showSuccess("Manager Account Created", `Manager ${payload.fullName} has been created with role Admin.`);

      fetchManagers();
      handleCancel();
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.message || err.message || "Failed to create manager";
      toast.error(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteManager = (id, name) => {
    showConfirm({
      title: "Delete Manager Account",
      message: `Are you sure you want to delete manager "${name}"? This action cannot be undone.`,
      confirmText: "Delete Manager",
      type: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/employees/${id}`);
          showSuccess("Manager Deleted", "Manager record deleted successfully.");
          fetchManagers();
        } catch (err) {
          console.error(err);
          showError("Deletion Failed", err.response?.data?.message || "Failed to delete manager");
        }
      },
    });
  };

  const handleCancel = () => {
    setErrors({});
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      branchId: "",
      employeeId: "",
      password: "",
      role: "Manager",
    });
    setShowAdd(false);
  };

  // Filter managers by search
  const filteredManagers = useMemo(() => {
    return managers.filter((item) => {
      const keyword = search.toLowerCase();
      const name = (item.fullName || item.name || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const phone = (item.phone || "").toLowerCase();
      const branchName = (item.branch?.name || "").toLowerCase();
      const role = (item.roleRef?.name || item.role || "").toLowerCase();

      return (
        name.includes(keyword) ||
        email.includes(keyword) ||
        phone.includes(keyword) ||
        branchName.includes(keyword) ||
        role.includes(keyword)
      );
    });
  }, [managers, search]);

  const getInitials = (name) => {
    if (!name) return "MG";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <main className={styles.page}>
      <Toaster position="top-right" />

      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h1>
            <FiUserCheck style={{ color: "#4f46e5" }} /> Managers Management
          </h1>
          <p>View all managers, track assigned branches, and register new managers.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => window.print()}
          >
            <FiPrinter size={15} />
            Print
          </button>

          <button className={styles.secondaryButton} onClick={() => fetchManagers()}>
            <FiRefreshCw size={15} />
            Refresh
          </button>

          <button
            className={styles.addButton}
            onClick={() => {
              if (showAdd) handleCancel();
              else setShowAdd(true);
            }}
          >
            {showAdd ? <FiX size={17} /> : <FiPlus size={17} />}
            {showAdd ? "Close Form" : "Add Manager"}
          </button>
        </div>
      </header>

      {/* ADD MANAGER FORM */}
      {showAdd && (
        <section className={styles.addCard}>
          <div className={styles.addHeader}>
            <div>
              <h2>Add New Manager</h2>
              <p>Fill in details below to register a manager with assigned branch and fixed Admin role.</p>
            </div>
            <button className={styles.closeButton} onClick={handleCancel}>
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSaveManager} noValidate>
            <div className={styles.formGrid}>
              {/* Full Name */}
              <div className={styles.formGroup}>
                <label>
                  Full Name <span>*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Jenkins"
                  className={styles.input}
                  style={errors.fullName ? { borderColor: "#ef4444" } : {}}
                />
                {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
              </div>

              {/* Phone Number */}
              <div className={styles.formGroup}>
                <label>
                  Phone Number <span>*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit Phone Number"
                  className={styles.input}
                  style={errors.phone ? { borderColor: "#ef4444" } : {}}
                />
                {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
              </div>


              {/* Email Address */}
              <div className={styles.formGroup}>
                <label>
                  Email Address <span>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="manager@company.com"
                  className={styles.input}
                  style={errors.email ? { borderColor: "#ef4444" } : {}}
                />
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
              </div>

              {/* Branch / Outlet */}
              <div className={styles.formGroup}>
                <label>
                  {isRestaurant ? "Outlet" : "Branch"} <span>*</span>
                </label>
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  className={styles.select}
                  style={errors.branchId ? { borderColor: "#ef4444" } : {}}
                >
                  <option value="">{isRestaurant ? "Select Outlet" : "Select Branch"}</option>
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      {isRestaurant ? "No outlets found - create outlet first" : "No branches found - create branch first"}
                    </option>
                  )}
                </select>
                {errors.branchId && <span className={styles.errorText}>{errors.branchId}</span>}
              </div>

              {/* Role (FIXED TO MANAGER) */}
              <div className={styles.formGroup}>
                <label>
                  Role <span>* (Fixed)</span>
                </label>
                <input
                  type="text"
                  name="role"
                  value="Manager"
                  readOnly
                  disabled
                  className={`${styles.input} ${styles.fixedInput}`}
                />
                <span className={styles.fieldHint}>🔒 Role is permanently fixed as Manager</span>
              </div>

              {/* Password */}
              <div className={styles.formGroup}>
                <label>
                  Password <span>*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={styles.input}
                  style={errors.password ? { borderColor: "#ef4444" } : {}}
                />
                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className={styles.saveButton} disabled={submitting}>
                <FiSave size={16} />
                {submitting ? "Saving..." : "Save Manager Account"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* MANAGERS TABLE */}
      <section className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch size={18} style={{ color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by manager name, phone, email, or branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Manager Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className={styles.empty}>
                    Loading managers list...
                  </td>
                </tr>
              ) : filteredManagers.length > 0 ? (
                filteredManagers.map((item) => {
                  const managerName = item.fullName || item.name || "Manager";
                  const roleName = item.roleRef?.name || item.role || "Admin";
                  const branchName = item.branch?.name || "Main Branch";
                  const initials = getInitials(managerName);

                  return (
                    <tr key={item.id}>
                      {/* Name */}
                      <td>
                        <div className={styles.managerCell}>
                          <div className={styles.avatarBadge}>{initials}</div>
                          <div>
                            <strong className={styles.managerName}>{managerName}</strong>
                            <span className={styles.managerId}>
                              ID: {item.employeeId || `MGR-${item.id.substring(0, 6)}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td>
                        <div className={styles.contactItem}>
                          <FiPhone size={13} style={{ color: "#64748b" }} />
                          <span>{item.phone || "N/A"}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td>
                        <div className={styles.contactItem}>
                          <FiMail size={13} style={{ color: "#64748b" }} />
                          <span>{item.email || "N/A"}</span>
                        </div>
                      </td>

                      {/* Branch */}
                      <td>
                        <span className={styles.branchBadge}>
                          <FiMapPin size={12} />
                          {branchName}
                        </span>
                      </td>

                      {/* Role (Fixed Admin) */}
                      <td>
                        <span className={styles.roleBadge}>
                          <FiShield size={12} />
                          {roleName}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <button
                          className={styles.actionButton}
                          title="Delete Manager"
                          onClick={() => handleDeleteManager(item.id, managerName)}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className={styles.empty}>
                    No manager records found. Click &quot;Add Manager&quot; above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
