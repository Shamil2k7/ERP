"use client";

import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import apiClient from "@/services/apiClient";
import {
  FiPlus,
  FiPrinter,
  FiDownload,
  FiSearch,
  FiChevronDown,
  FiX,
  FiSave,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiArrowDown,
} from "react-icons/fi";

import styles from "./departments.module.css";
import { useAlert } from "@/context/AlertContext";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [sortOrder, setSortOrder] = useState("default");

  const { showSuccess, showWarning, showError, showConfirm } = useAlert();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    head: "",
    employees: "",
    status: "ACTIVE",
  });

  /* =========================
     FETCH DEPARTMENTS
  ========================= */

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiClient.get("/departments");

      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  /* =========================
     SEARCH
  ========================= */

  const filteredDepartments = useMemo(() => {
    let result = departments.filter((item) => {
      const keyword = search.toLowerCase();

      const code = item.code?.toLowerCase() || "";
      const name = item.name?.toLowerCase() || "";
      const head = item.head?.toLowerCase() || "";
      const status = item.status?.toLowerCase() || "";

      return (
        code.includes(keyword) ||
        name.includes(keyword) ||
        head.includes(keyword) ||
        status.includes(keyword)
      );
    });

    /* =========================
       SORT
    ========================= */

    if (sortOrder === "asc") {
      result.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    }

    if (sortOrder === "desc") {
      result.sort((a, b) =>
        (b.name || "").localeCompare(a.name || "")
      );
    }

    return result;
  }, [departments, search, sortOrder]);

  /* =========================
     FORM CHANGE
  ========================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     ADD / EDIT DEPARTMENT
  ========================= */

  const handleSaveDepartment = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showWarning(
        "Invalid form data",
        "Please enter department name"
      );
      return;
    }

    if (!formData.code.trim()) {
      showWarning(
        "Invalid form data",
        "Please enter department code"
      );
      return;
    }

    const payload = {
      name: formData.name,
      code: formData.code,
      head: formData.head,
      employees: Number(formData.employees) || 0,
      status: formData.status,
    };

    try {
      if (editingId) {
        await apiClient.put(
          `/departments/${editingId}`,
          payload
        );

        showSuccess(
          "Department updated",
          "Department updated successfully"
        );
      } else {
        await apiClient.post(
          "/departments",
          payload
        );

        showSuccess(
          "Department created",
          "Department created successfully"
        );
      }

      await fetchDepartments();

      setFormData({
        name: "",
        code: "",
        head: "",
        employees: "",
        status: "ACTIVE",
      });

      setEditingId(null);
      setShowAdd(false);
    } catch (err) {
      console.error(err);

      showError(
        "Invalid form data",
        err.response?.data?.message ||
          "Failed to save department"
      );
    }
  };

  /* =========================
     DELETE
  ========================= */

  const handleDelete = (id) => {
    showConfirm({
      title: "Delete Department",
      message:
        "Are you sure you want to delete this department? Employees assigned to this department may be affected.",
      confirmText: "Delete Department",
      type: "danger",

      onConfirm: async () => {
        try {
          await apiClient.delete(
            `/departments/${id}`
          );

          showSuccess(
            "Department deleted",
            "Department deleted successfully"
          );

          await fetchDepartments();
        } catch (err) {
          console.error(err);

          showError(
            "Department couldn't be deleted",
            err.response?.data?.message ||
              "Failed to delete department"
          );
        }
      },
    });
  };

  /* =========================
     EDIT
  ========================= */

  const handleEdit = (item) => {
    setEditingId(item.id);

    setFormData({
      name: item.name || "",
      code: item.code || "",
      head: item.head || "",
      employees: item.employees || 0,
      status: item.status || "ACTIVE",
    });

    setShowAdd(true);
  };

  /* =========================
     CANCEL
  ========================= */

  const handleCancel = () => {
    setEditingId(null);

    setFormData({
      name: "",
      code: "",
      head: "",
      employees: "",
      status: "ACTIVE",
    });

    setShowAdd(false);
  };

  /* =========================
     SORT
  ========================= */

  const handleSort = () => {
    if (sortOrder === "default") {
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortOrder("default");
    }
  };

  /* =========================
     REFRESH
  ========================= */

  const handleRefresh = () => {
    setSearch("");
    setSortOrder("default");
    fetchDepartments();
  };

  /* =========================
     PRINT
  ========================= */

  const handlePrint = () => {
    window.print();
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <main className={styles.page}>
      {/* =========================
          PAGE HEADER
      ========================= */}

      <header className={styles.header}>
        <div>
          <h1>Departments</h1>
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
          >
            <FiDownload size={15} />
            Export
            <FiChevronDown size={14} />
          </button>

          <button
            type="button"
            className={styles.addButton}
            onClick={() => {
              if (showAdd) {
                handleCancel();
              } else {
                setEditingId(null);

                setFormData({
                  name: "",
                  code: "",
                  head: "",
                  employees: "",
                  status: "ACTIVE",
                });

                setShowAdd(true);
              }
            }}
          >
            {showAdd ? (
              <FiX size={17} />
            ) : (
              <FiPlus size={17} />
            )}

            {showAdd ? "Close" : "Add New"}
          </button>
        </div>
      </header>

      {/* =========================
          ADD / EDIT FORM
      ========================= */}

      {showAdd && (
        <section className={styles.addCard}>
          <div className={styles.addHeader}>
            <div>
              <h2>
                {editingId
                  ? "Edit Department"
                  : "Add Department"}
              </h2>

              <p>
                {editingId
                  ? "Update the details of the department."
                  : "Create a new department and assign the department head."}
              </p>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={handleCancel}
              title="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSaveDepartment}
          >
            {/* Department Name */}

            <div className={styles.formGroup}>
              <label>
                Department Name <span>*</span>
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter department name"
              />
            </div>

            {/* Department Code */}

            <div className={styles.formGroup}>
              <label>
                Department Code <span>*</span>
              </label>

              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Example: DPT009"
              />
            </div>

            {/* Department Head */}

            <div className={styles.formGroup}>
              <label>Department Head</label>

              <input
                type="text"
                name="head"
                value={formData.head}
                onChange={handleChange}
                placeholder="Enter department head"
              />
            </div>

            {/* Employees */}

            <div className={styles.formGroup}>
              <label>Number of Employees</label>

              <input
                type="number"
                name="employees"
                min="0"
                value={formData.employees}
                onChange={handleChange}
                placeholder="Enter number of employees"
              />
            </div>

            {/* Status */}

            <div className={styles.formGroup}>
              <label>Status</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>

            {/* Form Actions */}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
              >
                <FiX size={16} />
                Cancel
              </button>

              <button
                type="submit"
                className={styles.saveButton}
              >
                <FiSave size={16} />

                {editingId
                  ? "Update Department"
                  : "Save Department"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =========================
          TABLE CARD
      ========================= */}

      <section className={styles.tableCard}>
        {/* Toolbar */}

        <div className={styles.toolbar}>
          {/* Search */}

          <div className={styles.searchBox}>
            <FiSearch size={18} />

            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {/* Toolbar Right */}

          <div className={styles.toolbarRight}>
            <button
              type="button"
              className={styles.filterButton}
            >
              <FiFilter size={16} />
              Filter
              <FiChevronDown size={14} />
            </button>

            <button
              type="button"
              className={styles.sortButton}
              onClick={handleSort}
            >
              <FiArrowDown size={16} />
              Sort By
              <FiChevronDown size={14} />
            </button>

            <button
              type="button"
              className={styles.iconButton}
              title="Refresh"
              onClick={handleRefresh}
            >
              <FiRefreshCw size={17} />
            </button>
          </div>
        </div>

        {/* Table */}

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Department</th>
                <th>Head</th>
                <th>Employees</th>
                <th>Created On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {/* Loading */}

              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className={styles.empty}
                  >
                    Loading departments...
                  </td>
                </tr>
              ) : error ? (
                /* Error */

                <tr>
                  <td
                    colSpan="7"
                    className={styles.empty}
                  >
                    {error}
                  </td>
                </tr>
              ) : filteredDepartments.length > 0 ? (
                /* Data */

                filteredDepartments.map((item) => (
                  <tr key={item.id}>
                    {/* Code */}

                    <td className={styles.code}>
                      {item.code}
                    </td>

                    {/* Department */}

                    <td>
                      <strong
                        className={
                          styles.departmentName
                        }
                      >
                        {item.name}
                      </strong>
                    </td>

                    {/* Head */}

                    <td>{item.head || "-"}</td>

                    {/* Employees */}

                    <td>{item.employees}</td>

                    {/* Created */}

                    <td>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>

                    {/* Status */}

                    <td>
                      <span
                        className={
                          item.status === "ACTIVE"
                            ? styles.activeStatus
                            : styles.inactiveStatus
                        }
                      >
                        {item.status === "ACTIVE"
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    {/* ACTION BUTTONS */}

                    <td>
                      <div
                        className={
                          styles.actionButtons
                        }
                      >
                        {/* EDIT */}

                        <button
                          type="button"
                          className={
                            styles.editButton
                          }
                          title="Edit"
                          onClick={() =>
                            handleEdit(item)
                          }
                        >
                          <FiEdit2 size={17} />
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          className={
                            styles.deleteButton
                          }
                          title="Delete"
                          onClick={() =>
                            handleDelete(item.id)
                          }
                        >
                          <FiTrash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* Empty */

                <tr>
                  <td
                    colSpan="7"
                    className={styles.empty}
                  >
                    No departments found.
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