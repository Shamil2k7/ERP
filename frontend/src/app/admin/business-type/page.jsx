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
  FiEdit2,
  FiTrash2,
  FiBriefcase,
} from "react-icons/fi";

import styles from "../add-admin/addAdmin.module.css";
import { useAlert } from "@/context/AlertContext";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/business-types`;

export default function BusinessTypePage() {
  const [businessTypes, setBusinessTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const { showSuccess, showError, showConfirm } = useAlert();
  const [editingId, setEditingId] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "ACTIVE",
  });

  const [errors, setErrors] = useState({});

  /* =========================
     FETCH FROM DATABASE
  ========================= */
  const fetchBusinessTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      if (res.data.success) {
        setBusinessTypes(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  /* =========================
     SEARCH & SORT
  ========================= */
  const filteredBusinessTypes = useMemo(() => {
    let result = businessTypes.filter((item) => {
      const keyword = search.toLowerCase();
      const code = item.code?.toLowerCase() || "";
      const name = item.name?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";

      return (
        code.includes(keyword) ||
        name.includes(keyword) ||
        description.includes(keyword)
      );
    });

    if (sortOrder === "asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortOrder === "desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [businessTypes, search, sortOrder]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Business type name is required";
    if (!formData.code.trim()) newErrors.code = "Business code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =========================
     SAVE / UPDATE TO DATABASE
  ========================= */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || null,
      status: formData.status,
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload);
        showSuccess("Business Type Updated", "Business type details updated successfully.");
      } else {
        await axios.post(API_URL, payload);
        showSuccess("Business Type Created", "New business type added successfully.");
      }

      fetchBusinessTypes();
      handleCancel();
    } catch (err) {
      console.error(err);
      showError("Error", err.response?.data?.message || "Failed to save business type to database.");
    }
  };

  /* =========================
     EDIT
  ========================= */
  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || "",
      status: item.status || "ACTIVE",
    });
    setShowAdd(true);
    setOpenMenu(null);
  };

  /* =========================
     DELETE FROM DATABASE
  ========================= */
  const handleDelete = (id) => {
    setOpenMenu(null);
    showConfirm({
      title: "Delete Business Type",
      message: "Are you sure you want to delete this business type?",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/${id}`);
          showSuccess("Business Type Deleted", "Business type removed from database successfully.");
          fetchBusinessTypes();
        } catch (err) {
          console.error(err);
          showError("Error", err.response?.data?.message || "Failed to delete business type.");
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
      description: "",
      status: "ACTIVE",
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
    fetchBusinessTypes();
  };

  return (
    <main className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h1>
            <FiBriefcase style={{ color: "#4f46e5" }} /> Business Type Management
          </h1>
          <p>Register and manage enterprise business types and commerce categories stored in your database.</p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.secondaryButton} onClick={() => window.print()}>
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
              else setShowAdd(true);
            }}
          >
            {showAdd ? <FiX size={17} /> : <FiPlus size={17} />}
            {showAdd ? "Close Form" : "Add Business Type"}
          </button>
        </div>
      </header>

      {/* ADD / EDIT FORM CARD */}
      {showAdd && (
        <section className={styles.addCard}>
          <div className={styles.addHeader}>
            <div>
              <h2>{editingId ? "Edit Business Type" : "Add Business Type"}</h2>
              <p>{editingId ? "Modify business type attributes." : "Create a new business category."}</p>
            </div>

            <button className={styles.closeButton} onClick={handleCancel}>
              <FiX />
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <div className={styles.formGroup}>
              <label>
                Business Type Name <span>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Supermarket & Grocery"
                style={errors.name ? { borderColor: "#ef4444" } : {}}
              />
              {errors.name && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>
                Business Code <span>*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g. BT-009"
                style={errors.code ? { borderColor: "#ef4444" } : {}}
              />
              {errors.code && <span style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{errors.code}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Short description of this business model..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                <FiX size={16} />
                Cancel
              </button>

              <button type="submit" className={styles.saveButton}>
                <FiSave size={16} />
                {editingId ? "Update Business Type" : "Save Business Type"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TABLE CARD */}
      <section className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Search by name, code, or description..."
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

            <button className={styles.iconButton} title="Refresh" onClick={handleRefresh}>
              <FiRefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Business Type Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className={styles.empty}>
                    Loading business types from database...
                  </td>
                </tr>
              ) : filteredBusinessTypes.length > 0 ? (
                filteredBusinessTypes.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: "#4f46e5", fontWeight: 600 }}>{item.code}</strong>
                    </td>
                    <td>
                      <strong className={styles.adminName}>{item.name}</strong>
                    </td>
                    <td style={{ maxWidth: "350px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.description || "-"}
                    </td>
                    <td>
                      <span className={item.status === "ACTIVE" ? styles.activeStatus : styles.inactiveStatus}>
                        {item.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionWrapper}>
                        <button
                          className={styles.actionButton}
                          onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                        >
                          <FiMoreVertical size={17} />
                        </button>

                        {openMenu === item.id && (
                          <div className={styles.actionMenu}>
                            <button onClick={() => handleEdit(item)}>
                              <FiEdit2 size={14} />
                              Edit
                            </button>
                            <button className={styles.deleteAction} onClick={() => handleDelete(item.id)}>
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
                  <td colSpan="5" className={styles.empty}>
                    No business types found. Click "Add Business Type" to create one.
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
