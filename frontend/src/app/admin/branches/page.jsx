"use client";

import { useMemo, useState, useEffect } from "react";
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
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/services/branchService";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";

import styles from "./branches.module.css";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";


export default function BranchesPage() {
  const { isGym, isTextile } = useCompany();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError, showConfirm } = useAlert();

  const pageTitle = isGym
    ? "Gym Fitness Centers & Clubs"
    : isTextile
    ? "Textile Mills & Manufacturing Units"
    : "Branch Outlets & Stores";

  const pageSub = isGym
    ? "Manage gym clubs, fitness centers, and facility locations."
    : isTextile
    ? "Manage spinning mills, weaving units, dyeing plants, and textile factories."
    : "Manage store outlets, retail branches, and commercial locations.";

  const nameLabel = isGym
    ? "Fitness Center / Club Name"
    : isTextile
    ? "Mill / Factory Unit Name"
    : "Branch / Store Name";

  const namePlaceholder = isGym
    ? "e.g. Downtown Fitness Center"
    : isTextile
    ? "e.g. Spinning Unit #1 or Weaving Mill"
    : "e.g. Main Street Supermarket Outlet";

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    isActive: true,
  });

  const validateBranchForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Branch name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Branch name must be at least 2 characters";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Branch code is required";
    } else if (formData.code.trim().length < 2) {
      newErrors.code = "Branch code must be at least 2 characters";
    }

    if (formData.phone.trim()) {
      const phoneErr = getPhoneValidationError(formData.phone, false);
      if (phoneErr) {
        newErrors.phone = phoneErr;
      }
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =========================
     FETCH BRANCHES
  ========================= */
  const fetchBranchesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBranches();
      const list = res?.success && Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      const filtered = list.filter((b) => {
        const isTex =
          b.isTextile === true ||
          b.type === "TEXTILE_MILL" ||
          b.name?.toLowerCase().includes("mill") ||
          b.name?.toLowerCase().includes("spinning") ||
          b.name?.toLowerCase().includes("weaving") ||
          b.name?.toLowerCase().includes("dyeing") ||
          b.name?.toLowerCase().includes("plant") ||
          b.code?.startsWith("MILL-") ||
          b.code?.startsWith("TEX-");

        if (isTextile) return isTex;
        return true; // Show created branches in active mode
      });
      setBranches(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranchesData();
  }, [isGym, isTextile]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.actionWrapper}`)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     SEARCH & FILTER
  ========================= */
  const filteredBranches = useMemo(() => {
    let result = branches.filter((item) => {
      const keyword = search.toLowerCase();
      const code = item.code?.toLowerCase() || "";
      const name = item.name?.toLowerCase() || "";
      const city = item.city?.toLowerCase() || "";
      const state = item.state?.toLowerCase() || "";

      return (
        code.includes(keyword) ||
        name.includes(keyword) ||
        city.includes(keyword) ||
        state.includes(keyword)
      );
    });

    if (sortOrder === "az") {
      result = [...result].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    } else if (sortOrder === "za") {
      result = [...result].sort((a, b) =>
        (b.name || "").localeCompare(a.name || "")
      );
    }

    return result;
  }, [branches, search, sortOrder]);

  const handleAddNew = () => {
    setEditingId(null);
    setErrors({});
    const prefix = isGym ? "GYM-" : isTextile ? "MILL-" : "BR-";
    const nextNum = String(branches.length + 1).padStart(3, "0");
    setFormData({
      name: "",
      code: `${prefix}${nextNum}`,
      address: "",
      city: "",
      state: "",
      phone: "",
      email: "",
      isActive: true,
    });
    setShowAdd(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : name === "phone" ? sanitizePhoneInput(value) : value,
      };

      // Auto-update branch code if typing branch name and code was default
      if (name === "name" && !editingId) {
        const prefix = isGym ? "GYM-" : isTextile ? "MILL-" : "BR-";
        const cleanWords = value.trim().split(/\s+/).filter(Boolean);
        if (cleanWords.length > 0) {
          const initials = cleanWords.map((w) => w[0].toUpperCase()).join("");
          const nextNum = String(branches.length + 1).padStart(3, "0");
          updated.code = `${prefix}${initials}-${nextNum}`;
        }
      }

      return updated;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();

    if (!validateBranchForm()) {
      return;
    }

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      isActive: Boolean(formData.isActive),
      isTextile: Boolean(isTextile),
      type: isTextile ? "TEXTILE_MILL" : isGym ? "GYM" : "RETAIL_BRANCH",
    };

    try {
      if (editingId) {
        await updateBranch(editingId, payload);
        toast.success("Branch updated successfully");
      } else {
        await createBranch(payload);
        toast.success("Branch added successfully");
      }

      fetchBranchesData();
      handleCancel();
    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.message || err.message || "";
      if (serverMessage.toLowerCase().includes("code")) {
        setErrors((prev) => ({ ...prev, code: serverMessage }));
      } else {
        const errorMessage =
          err.response?.data?.errors?.join(", ") ||
          serverMessage ||
          "Failed to save branch";
        toast.error(errorMessage);
      }
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setErrors({});
    setFormData({
      name: item.name || "",
      code: item.code || "",
      address: item.address || "",
      city: item.city || "",
      state: item.state || "",
      phone: item.phone || "",
      email: item.email || "",
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setShowAdd(true);
    setOpenMenu(null);
  };

  const handleDeleteItem = (id) => {
    setOpenMenu(null);
    showConfirm({
      title: "Delete Branch",
      message: "Are you sure you want to delete this store branch location? This action cannot be undone.",
      confirmText: "Delete Branch",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteBranch(id);
          showSuccess("Product updated", "Branch deleted successfully");
          fetchBranchesData();
        } catch (err) {
          console.error(err);
          showError("Product couldn't be deleted", err.response?.data?.message || "Failed to delete branch");
        }
      },
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setErrors({});
    setFormData({
      name: "",
      code: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      email: "",
      isActive: true,
    });
    setShowAdd(false);
  };

  const handleSort = () => {
    if (sortOrder === "default") setSortOrder("asc");
    else if (sortOrder === "asc") setSortOrder("desc");
    else setSortOrder("default");
  };

  const handleRefresh = () => {
    setSearch("");
    setSortOrder("default");
    setOpenMenu(null);
    fetchBranchesData();
  };

  return (
    <main className={styles.page}>
      <Toaster position="top-right" />

      {/* PAGE HEADER */}
      <header className={styles.header}>
        <div>
          <h1>{pageTitle}</h1>
          <p>{pageSub}</p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={() => window.print()}
          >
            <FiPrinter size={15} />
            Print
          </button>

          <button className={styles.secondaryButton}>
            <FiDownload size={15} />
            Export
            <FiChevronDown size={14} />
          </button>

          <button
            className={styles.addButton}
            onClick={() => {
              if (showAdd) handleCancel();
              else handleOpenAddModal();
            }}
          >
            {showAdd ? <FiX size={17} /> : <FiPlus size={17} />}
            {showAdd ? "Close" : `Add ${isGym ? "Center" : isTextile ? "Unit" : "Branch"}`}
          </button>
        </div>
      </header>

      {/* ADD / EDIT FORM */}
      {showAdd && (
        <section className={styles.addCard}>
          <div className={styles.addHeader}>
            <div>
              <h2>{editingId ? `Edit ${isGym ? "Center" : isTextile ? "Unit" : "Branch"}` : `Add ${isGym ? "Center" : isTextile ? "Unit" : "Branch"}`}</h2>
              <p>
                {editingId
                  ? "Update location details and contact information."
                  : "Create a new location for your organization."}
              </p>
            </div>
            <button className={styles.closeButton} onClick={handleCancel}>
              <FiX />
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSaveBranch} noValidate>
            <div className={styles.formGroup}>
              <label>
                {nameLabel} <span>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={namePlaceholder}
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
                Branch Code <span>*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="HQ-01"
                style={errors.code ? { borderColor: "#ef4444" } : {}}
              />
              {errors.code && (
                <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  {errors.code}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>Phone Number</label>
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
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="branch@company.com"
                style={errors.email ? { borderColor: "#ef4444" } : {}}
              />
              {errors.email && (
                <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  {errors.email}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="New York"
              />
            </div>

            <div className={styles.formGroup}>
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="NY"
              />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
              <label>Full Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Business Street, Suite 400"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Status</label>
              <select
                name="isActive"
                value={formData.isActive ? "true" : "false"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: e.target.value === "true",
                  }))
                }
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
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
                {editingId ? "Update Branch" : "Save Branch"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* BRANCHES LIST TABLE */}
      <section className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.toolbarRight}>
            <button className={styles.sortButton} onClick={handleSort}>
              <FiArrowDown size={16} />
              Sort ({sortOrder})
              <FiChevronDown size={14} />
            </button>

            <button
              className={styles.iconButton}
              title="Refresh"
              onClick={handleRefresh}
            >
              <FiRefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Branch Name</th>
                <th>City & State</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className={styles.empty}>
                    Loading branches...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" className={styles.empty}>
                    {error}
                  </td>
                </tr>
              ) : filteredBranches.length > 0 ? (
                filteredBranches.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.code}>{item.code}</td>
                    <td>
                      <strong className={styles.branchName}>{item.name}</strong>
                      {item.address && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#94a3b8",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "2px",
                          }}
                        >
                          <FiMapPin size={12} /> {item.address}
                        </div>
                      )}
                    </td>
                    <td>
                      {item.city || item.state
                        ? `${item.city || ""}${item.city && item.state ? ", " : ""}${item.state || ""}`
                        : "-"}
                    </td>
                    <td>
                      <div>
                        {item.phone && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "13px",
                            }}
                          >
                            <FiPhone size={12} /> {item.phone}
                          </div>
                        )}
                        {item.email && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              color: "#64748b",
                            }}
                          >
                            <FiMail size={12} /> {item.email}
                          </div>
                        )}
                        {!item.phone && !item.email && "-"}
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          item.isActive
                            ? styles.activeStatus
                            : styles.inactiveStatus
                        }
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionWrapper}>
                        <button
                          className={styles.actionButton}
                          onClick={() =>
                            setOpenMenu(openMenu === item.id ? null : item.id)
                          }
                        >
                          <FiMoreVertical size={17} />
                        </button>

                        {openMenu === item.id && (
                          <div className={styles.actionMenu}>
                            <button onClick={() => handleEdit(item)}>
                              <FiEdit2 size={14} />
                              Edit
                            </button>
                            <button
                              className={styles.deleteAction}
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <FiTrash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.empty}>
                    No branches found. Click &quot;Add Branch&quot; to create one.
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
