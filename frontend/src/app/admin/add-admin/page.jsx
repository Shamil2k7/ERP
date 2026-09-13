"use client";

import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  FiPlus,
  FiPrinter,
  FiDownload,
  FiSearch,
  FiChevronDown,
  FiMoreVertical,
  FiRefreshCw,
  FiArrowDown,
  FiX,
  FiSave,
  FiTrash2,
  FiPhone,
  FiMail,
  FiShield,
  FiUserCheck,
  FiBriefcase,
  FiCheckSquare,
  FiCheck,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

import {
  getAdmins,
  createAdmin,
  deleteAdmin,
} from "@/services/adminService";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";

import styles from "./addAdmin.module.css";
import { useAlert } from "@/context/AlertContext";

export default function AddAdminPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError, showConfirm } = useAlert();

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");

  const [errors, setErrors] = useState({});

  const [availableModules, setAvailableModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [industries, setIndustries] = useState([
    { id: "1", name: "Retail", code: "RETAIL" },
    { id: "2", name: "Gym & Fitness", code: "GYM" },
    { id: "3", name: "Textile ERP", code: "TEXTILE" },
    { id: "4", name: "Restaurant ERP", code: "RESTAURANT" },
    { id: "5", name: "Laundry Management", code: "LAUNDRY" },
    { id: "6", name: "Pharmacy Management", code: "MEDICAL_SHOP" },
  ]);

  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    type: "RETAIL",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone" ? sanitizePhoneInput(value) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Fetch modules when business type changes
  useEffect(() => {
    if (!formData.type) return;
    const fetchModules = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/companies/default-modules/${formData.type}`
        );
        if (res.data.success && res.data.data) {
          setAvailableModules(res.data.data);
          setSelectedModules(res.data.data.map((m) => m.code));
        }
      } catch (e) {
        console.error("Failed to load modules", e);
      }
    };
    fetchModules();
  }, [formData.type]);

  const validateAdminForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company / Client Name is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Admin full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Enter a valid email address";
      }
    }

    const phoneErr = getPhoneValidationError(formData.phone, true);
    if (phoneErr) {
      newErrors.phone = phoneErr;
    }


    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.type) {
      newErrors.type = "Business type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchAdminsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdmins();
      if (res.success) {
        setAdmins(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch admin accounts");
      toast.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminsData();
  }, []);

  const filteredAdmins = useMemo(() => {
    let result = admins.filter((item) => {
      const keyword = search.toLowerCase();
      const companyName = item.company?.name?.toLowerCase() || "";
      const name = item.fullName?.toLowerCase() || item.name?.toLowerCase() || "";
      const email = item.email?.toLowerCase() || "";
      const phone = item.phone?.toLowerCase() || "";
      const type = (item.type || item.company?.industry?.code || "").toLowerCase();

      return (
        companyName.includes(keyword) ||
        name.includes(keyword) ||
        email.includes(keyword) ||
        phone.includes(keyword) ||
        type.includes(keyword)
      );
    });

    if (sortOrder === "asc") {
      result.sort((a, b) => (a.fullName || a.name || "").localeCompare(b.fullName || b.name || ""));
    } else if (sortOrder === "desc") {
      result.sort((a, b) => (b.fullName || b.name || "").localeCompare(a.fullName || a.name || ""));
    }

    return result;
  }, [admins, search, sortOrder]);

  const handleModuleToggle = (code) => {

    setSelectedModules((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();

    if (!validateAdminForm()) {
      return;
    }

    const payload = {
      companyName: formData.companyName.trim(),
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      type: formData.type.toUpperCase(),
      enabledModules: selectedModules,
    };

    try {
      await createAdmin(payload);
      toast.success("Client & Admin created successfully!");
      showSuccess(
        "Client Created",
        `Company "${payload.companyName}" (${payload.type}) has been created successfully.`
      );

      fetchAdminsData();
      handleCancel();
    } catch (err) {
      console.error(err);
      const errors = err.response?.data?.errors;
      const serverMessage = Array.isArray(errors) ? errors.join(", ") : (err.response?.data?.message || err.message || "");
      toast.error(serverMessage || "Failed to create client");
    }
  };

  const handleDeleteAdminItem = (id, name) => {
    setOpenMenu(null);
    showConfirm({
      title: "Delete Client / Admin Account",
      message: `Are you sure you want to delete admin account "${name}"? This action cannot be undone.`,
      confirmText: "Delete Admin",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteAdmin(id);
          showSuccess("Admin Deleted", "Admin account deleted successfully.");
          fetchAdminsData();
        } catch (err) {
          showError("Deletion Failed", err.response?.data?.message || "Failed to delete admin");
        }
      },
    });
  };

  const handleCancel = () => {
    setErrors({});
    setFormData({
      companyName: "",
      name: "",
      email: "",
      phone: "",
      password: "",
      type: "RETAIL",
    });
    setShowAdd(false);
  };

  return (
    <main className={styles.page}>
      <Toaster position="top-right" />

      {/* PAGE HEADER */}
      <header className={styles.header}>
        <div>
          <h1>
            <FiShield style={{ color: "#4f46e5" }} /> Super Admin: Create Client / Admin
          </h1>
          <p>Register new clients/companies, assign industry type, and customize enabled ERP modules.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.addButton}
            onClick={() => {
              if (showAdd) handleCancel();
              else setShowAdd(true);
            }}
          >
            {showAdd ? <FiX size={17} /> : <FiPlus size={17} />}
            {showAdd ? "Close Form" : "Create New Client"}
          </button>
        </div>
      </header>

      {/* CREATE CLIENT FORM */}
      {showAdd && (
        <section className={styles.addCard}>
          <div className={styles.addHeader}>
            <div>
              <h2>Client & Administrator Creation</h2>
              <p>Configure company profile, select industry, and enable industry modules.</p>
            </div>
            <button className={styles.closeButton} onClick={handleCancel}>
              <FiX />
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSaveAdmin} noValidate>
            <div className={styles.formGroup}>
              <label>
                Company / Client Name <span>*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. ABC Supermarket or ABC Fitness"
                style={errors.companyName ? { borderColor: "#ef4444" } : {}}
              />
              {errors.companyName && (
                <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  {errors.companyName}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                Business Type / Industry <span>*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={errors.type ? { borderColor: "#ef4444" } : {}}
              >
                {industries.map((ind) => (
                  <option key={ind.code} value={ind.code}>
                    {ind.name} ({ind.code})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>
                Admin Name <span>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Admin Full Name"
                style={errors.name ? { borderColor: "#ef4444" } : {}}
              />
              {errors.name && (
                <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  {errors.name}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                Email Address <span>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@clientcompany.com"
                style={errors.email ? { borderColor: "#ef4444" } : {}}
              />
              {errors.email && (
                <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  {errors.email}
                </span>
              )}
            </div>

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
                style={errors.phone ? { borderColor: "#ef4444" } : {}}
              />

              {errors.phone && (
                <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  {errors.phone}
                </span>
              )}
            </div>

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
                style={errors.password ? { borderColor: "#ef4444" } : {}}
              />
              {errors.password && (
                <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  {errors.password}
                </span>
              )}
            </div>

            {/* DYNAMIC MODULE SELECTION */}
            <div style={{ gridColumn: "1 / -1", marginTop: "12px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiCheckSquare style={{ color: "#4f46e5" }} /> Enabled Industry Modules for Client
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px" }}>
                Super Admin can toggle which modules are enabled for this client.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                {availableModules.map((mod) => {
                  const isChecked = selectedModules.includes(mod.code);
                  return (
                    <label
                      key={mod.code}
                      onClick={() => handleModuleToggle(mod.code)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        background: isChecked ? "#e0e7ff" : "#ffffff",
                        border: isChecked ? "1px solid #6366f1" : "1px solid #cbd5e1",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: isChecked ? "#4338ca" : "#334155",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: "#4f46e5" }}
                      />
                      <span>{mod.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
              >
                <FiX size={16} />
                Cancel
              </button>

              <button type="submit" className={styles.saveButton}>
                <FiSave size={16} />
                Save & Register Client
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ADMIN LIST TABLE */}
      <section className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Search by company, admin name, email, phone, or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company / Client</th>
                <th>Admin Name</th>
                <th>Contact Info</th>
                <th>Industry</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className={styles.empty}>
                    Loading client list...
                  </td>
                </tr>
              ) : filteredAdmins.length > 0 ? (
                filteredAdmins.map((item) => {
                  const companyName = item.company?.name || `${item.fullName}'s Company`;
                  const adminName = item.fullName || item.name || "Admin User";
                  const industryCode = (item.company?.industry?.code || item.type || "RETAIL").toUpperCase();
                  const isGymClient = industryCode.includes("GYM");
                  const isTextileClient = industryCode.includes("TEXTILE");
                  const isRestaurantClient = industryCode.includes("RESTAURANT");
                  const isLaundryClient = industryCode.includes("LAUNDRY");
                  const isMedicalClient = industryCode.includes("MEDICAL");

                  const badgeStyle = isGymClient
                    ? { bg: "#d1fae5", text: "#047857", icon: "🏋️", label: "GYM" }
                    : isTextileClient
                    ? { bg: "#ccfbf1", text: "#0f766e", icon: "🧵", label: "TEXTILE" }
                    : isRestaurantClient
                    ? { bg: "#fef3c7", text: "#92400e", icon: "🍽️", label: "RESTAURANT" }
                    : isLaundryClient
                    ? { bg: "#e0f2fe", text: "#0369a1", icon: "🧺", label: "LAUNDRY" }
                    : isMedicalClient
                    ? { bg: "#fee2e2", text: "#b91c1c", icon: "💊", label: "MEDICAL SHOP" }
                    : { bg: "#e0e7ff", text: "#4338ca", icon: "🛒", label: industryCode };

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ fontSize: "15px", color: "#0f172a" }}>{companyName}</strong>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          ID: {item.employeeId || item.id}
                        </div>
                      </td>
                      <td>
                        <strong className={styles.adminName}>{adminName}</strong>
                      </td>
                      <td>
                        <div>
                          {item.email && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                              <FiMail size={13} style={{ color: "#64748b" }} /> {item.email}
                            </div>
                          )}
                          {item.phone && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                              <FiPhone size={12} /> {item.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: badgeStyle.bg,
                            color: badgeStyle.text,
                          }}
                        >
                          {badgeStyle.icon} {badgeStyle.label}
                        </span>
                      </td>
                      <td>
                        <button
                          style={{
                            padding: "6px 12px",
                            background: "#fee2e2",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                          onClick={() => handleDeleteAdminItem(item.id, adminName)}
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className={styles.empty}>
                    No client accounts found. Click &quot;Create New Client&quot; to create one.
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
