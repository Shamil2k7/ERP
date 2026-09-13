"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "@/services/supplierService";

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
  FiPackage,
} from "react-icons/fi";

import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";
import styles from "./viewSuppliers.module.css";


const emptyForm = {
  companyName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  taxNumber: "",
  status: "ACTIVE",
};

export default function SuppliersPage() {
  const { isGym, isTextile, user } = useCompany();
  const roleUpper = (user?.role || user?.roleRef?.name || user?.designation || user?.type || "").toUpperCase();
  const isAccountant = roleUpper.includes("ACCOUNTANT");
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const pageTitle = isGym
    ? "Gym Equipment & Nutrition Suppliers"
    : isTextile
    ? "Yarn, Fiber & Dye Chemical Suppliers"
    : "Goods Vendors & Suppliers";

  const pageSub = isGym
    ? "Manage manufacturers and suppliers for gym machinery, weights, and nutritional supplements."
    : isTextile
    ? "Manage raw material vendors, yarn spinners, cotton suppliers, and chemical dye distributors."
    : "Manage wholesale distributors, product vendors, and commercial suppliers.";

  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [filterStatus, setFilterStatus] = useState("All");

  const { showSuccess, showWarning, showError, showConfirm } = useAlert();

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const response = await getSuppliers();
      const list = response?.data || (Array.isArray(response) ? response : []);
      const filteredList = list.filter((s) => {
        const isTex =
          s.isTextile === true ||
          s.category === "TEXTILE" ||
          s.companyName?.toLowerCase().includes("cotton") ||
          s.companyName?.toLowerCase().includes("dye") ||
          s.companyName?.toLowerCase().includes("mill") ||
          s.companyName?.toLowerCase().includes("fiber") ||
          s.companyName?.toLowerCase().includes("yarn") ||
          s.companyName?.toLowerCase().includes("textile") ||
          s.companyName?.toLowerCase().includes("synthetics");
        if (isTextile) return isTex;
        if (isGym) return s.category === "GYM" || s.companyName?.toLowerCase().includes("fitness") || s.companyName?.toLowerCase().includes("nutrition");
        return !isTex && s.category !== "GYM";
      });
      setSuppliers(filteredList);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, [isGym, isTextile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "phone" ? sanitizePhoneInput(value) : value,
    }));
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowAddForm(true);
    setOpenMenu(null);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.companyName.trim()) {
      showWarning("Invalid form data", "Company Name is required.");
      return;
    }

    if (!isValidPhoneNumber(form.phone, true)) {
      showWarning("Invalid form data", "Phone number must contain exactly 10 digits.");
      return;
    }


    try {
      setSubmitting(true);

      const payload = {
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim(),
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        taxNumber: form.taxNumber.trim() || undefined,
        status: form.status,
        isTextile: Boolean(isTextile),
        category: isTextile ? "TEXTILE" : isGym ? "GYM" : "RETAIL",
      };

      if (editingId) {
        const res = await updateSupplier(editingId, payload);
        showSuccess("Supplier updated", res?.message || "Supplier details updated successfully.");
      } else {
        const res = await createSupplier(payload);
        showSuccess("Supplier created", res?.message || "New supplier recorded successfully.");
      }

      await fetchSupplierData();
      handleCancel();
    } catch (err) {
      console.error("Supplier save error:", err);
      const validationErrors = err.response?.data?.errors;
      const errorMsg = Array.isArray(validationErrors)
        ? validationErrors.map((e) => e.msg || e.message).join(", ")
        : err.response?.data?.message || err.message || "Failed to save supplier.";
      showError("Supplier Save Failed", errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);

    setForm({
      companyName: supplier.companyName || supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      country: supplier.country || "",
      taxNumber: supplier.taxNumber || "",
      status: supplier.status || "ACTIVE",
    });

    setShowAddForm(true);
    setOpenMenu(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = (id) => {
    setOpenMenu(null);
    showConfirm({
      title: "Delete Supplier",
      message: "Are you sure you want to delete this supplier profile? This action cannot be undone.",
      confirmText: "Delete Supplier",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await deleteSupplier(id);
          showSuccess("Product updated", res.message || "Supplier deleted successfully.");
          await fetchSupplierData();
        } catch (err) {
          console.error("Supplier delete error:", err);
          showError("Product couldn't be deleted", err.response?.data?.message || err.message || "Failed to delete supplier.");
        }
      },
    });
  };

  const handleSort = () => {
    setSortOrder((prev) =>
      prev === "default" ? "az" : prev === "az" ? "za" : "default"
    );
  };

  const handleRefresh = async () => {
    setSearch("");
    setFilterStatus("All");
    setSortOrder("default");
    setOpenMenu(null);
    await fetchSupplierData();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Company Name",
      "Contact Person",
      "Email",
      "Phone",
      "Country",
      "Tax Number",
      "Status",
    ];

    const rows = suppliers.map((supplier) => [
      supplier.id,
      supplier.companyName || supplier.name || "",
      supplier.contactPerson || "",
      supplier.email || "",
      supplier.phone || "",
      supplier.country || "",
      supplier.taxNumber || "",
      supplier.status || "ACTIVE",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "suppliers.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredSuppliers = useMemo(() => {
    let data = [...suppliers];

    if (search.trim()) {
      const query = search.toLowerCase();
      data = data.filter(
        (supplier) =>
          (supplier.companyName || supplier.name || "").toLowerCase().includes(query) ||
          (supplier.contactPerson || "").toLowerCase().includes(query) ||
          (supplier.email || "").toLowerCase().includes(query) ||
          (supplier.phone || "").toLowerCase().includes(query) ||
          (supplier.country || "").toLowerCase().includes(query) ||
          (supplier.id || "").toLowerCase().includes(query)
      );
    }

    if (filterStatus !== "All") {
      data = data.filter(
        (supplier) =>
          (supplier.status || "ACTIVE").toUpperCase() === filterStatus.toUpperCase()
      );
    }

    if (sortOrder === "az") {
      data.sort((a, b) =>
        (a.companyName || a.name || "").localeCompare(b.companyName || b.name || "")
      );
    }

    if (sortOrder === "za") {
      data.sort((a, b) =>
        (b.companyName || b.name || "").localeCompare(a.companyName || a.name || "")
      );
    }

    return data;
  }, [suppliers, search, filterStatus, sortOrder]);

  return (
    <div className={styles.page}>
      {/* ================= HEADER ================= */}

      <div className={styles.header}>
        <div>
          <h1>{pageTitle}</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>{pageSub}</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handlePrint}
          >
            <FiPrinter size={15} />
            Print
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleExport}
          >
            <FiDownload size={15} />
            Export
            <FiChevronDown size={14} />
          </button>

          {!isAccountant && (
            <button
              type="button"
              className={styles.addButton}
              onClick={handleAddNew}
            >
              <FiPlus size={17} />
              Add New
            </button>
          )}
        </div>
      </div>

      {/* ================= ADD / EDIT SUPPLIER FORM ================= */}

      {showAddForm && (
        <div className={styles.addCard}>
          <div className={styles.addHeader}>
            <div>
              <h2>{editingId ? "Edit Supplier" : "Add Supplier"}</h2>
              <p>
                {editingId
                  ? "Update supplier information"
                  : "Create a new supplier"}
              </p>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={handleCancel}
            >
              <FiX size={18} />
            </button>
          </div>

          <form className={styles.supplierForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="companyName">Company Name *</label>
              <input
                id="companyName"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                placeholder="e.g. Apex Computers Ltd"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="contactPerson">Contact Person</label>
              <input
                id="contactPerson"
                name="contactPerson"
                value={form.contactPerson}
                onChange={handleChange}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="supplier@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone *</label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit Phone Number"
                required
              />
              {form.phone && getPhoneValidationError(form.phone, false) && (
                <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  ⚠ {getPhoneValidationError(form.phone, false)}
                </span>
              )}
            </div>


            <div className={styles.formGroup}>
              <label htmlFor="country">Country</label>
              <input
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                placeholder="e.g. United States, India, Germany"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="taxNumber">Tax / GST Number</label>
              <input
                id="taxNumber"
                name="taxNumber"
                value={form.taxNumber}
                onChange={handleChange}
                placeholder="e.g. TAX-12345678"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={styles.saveButton}
                disabled={submitting}
              >
                <FiSave size={16} />
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Update Supplier"
                  : "Save Supplier"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TABLE CARD ================= */}

      <div className={styles.tableCard}>
        {/* TOOLBAR */}

        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.toolbarRight}>
            {/* FILTER */}
            <div className={styles.dropdownWrapper}>
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() =>
                  setFilterStatus((prev) =>
                    prev === "All"
                      ? "ACTIVE"
                      : prev === "ACTIVE"
                      ? "INACTIVE"
                      : "All"
                  )
                }
              >
                <FiFilter size={16} />
                Filter: {filterStatus}
                <FiChevronDown size={14} />
              </button>
            </div>

            {/* SORT */}
            <button
              type="button"
              className={styles.toolbarButton}
              onClick={handleSort}
            >
              <FiArrowDown size={15} />
              Sort: {sortOrder.toUpperCase()}
              <FiChevronDown size={14} />
            </button>

            {/* REFRESH */}
            <button
              type="button"
              className={styles.iconButton}
              onClick={handleRefresh}
              title="Refresh"
            >
              <FiRefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ================= TABLE ================= */}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier Company</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className={styles.empty}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "20px" }}>
                      <FiRefreshCw className="animate-spin" size={18} />
                      Loading suppliers from database...
                    </div>
                  </td>
                </tr>
              ) : filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => {
                  const supplierName = supplier.companyName || supplier.name || "N/A";
                  const isSupplierActive = (supplier.status || "ACTIVE").toUpperCase() === "ACTIVE";

                  return (
                    <tr key={supplier.id}>
                      <td className={styles.id}>
                        {supplier.id.substring(0, 8)}...
                      </td>

                      <td>
                        <div className={styles.supplierCell}>
                          <div className={`${styles.supplierIcon} ${styles.store}`}>
                            <FiPackage />
                          </div>
                          <strong>{supplierName}</strong>
                        </div>
                      </td>

                      <td>{supplier.contactPerson || "—"}</td>
                      <td>{supplier.email || "—"}</td>
                      <td>{supplier.phone || "—"}</td>
                      <td>{supplier.country || "—"}</td>

                      <td>
                        <span
                          className={
                            isSupplierActive
                              ? styles.active
                              : styles.inactive
                          }
                        >
                          {supplier.status || "ACTIVE"}
                        </span>
                      </td>

                      <td>
                        {!isAccountant ? (
                          <div className={styles.actionWrapper}>
                            <button
                              type="button"
                              className={styles.actionButton}
                              onClick={() =>
                                setOpenMenu(
                                  openMenu === supplier.id ? null : supplier.id
                                )
                              }
                            >
                              <FiMoreVertical size={17} />
                            </button>

                            {openMenu === supplier.id && (
                              <div className={styles.actionMenu}>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(supplier)}
                                >
                                  <FiEdit2 size={14} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className={styles.deleteItem}
                                  onClick={() => handleDelete(supplier.id)}
                                >
                                  <FiTrash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                            View Only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className={styles.empty}>
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: "600" }}>
                        No suppliers found. Add a supplier to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}