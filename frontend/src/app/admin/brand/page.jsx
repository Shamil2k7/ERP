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
  FiX,
  FiSave,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/services/apiClient";

import styles from "./viewBrand.module.css";
import { useAlert } from "@/context/AlertContext";

const initialForm = {
  name: "",
  description: "",
  status: "ACTIVE",
};

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);

  const [openMenu, setOpenMenu] = useState(null);

  const [filterStatus, setFilterStatus] = useState("All");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError, showConfirm } = useAlert();

  // ==============================
  // FETCH BRANDS
  // ==============================

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setIsLoading(true);

    try {
      const response = await apiClient.get("/brands");
      const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setBrands(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Fetch brands error:", error);
      setBrands([]);
      toast.error(
        error.response?.data?.message || "Failed to fetch brands"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================
  // SEARCH
  // ==============================

  const filteredBrands = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return brands;
    }

    return brands.filter((brand) => {
      const name = brand.name?.toLowerCase() || "";
      const description = brand.description?.toLowerCase() || "";
      const status = brand.status?.toLowerCase() || "";

      return (
        name.includes(value) ||
        description.includes(value) ||
        status.includes(value)
      );
    });
  }, [brands, search]);

  // ==============================
  // ADD NEW
  // ==============================

  const handleAddNew = () => {
    setForm({
      ...initialForm,
    });

    setEditingId(null);
    setShowForm(true);
    setOpenMenu(null);
  };

  // ==============================
  // CANCEL
  // ==============================

  const handleCancel = () => {
    setForm({
      ...initialForm,
    });

    setEditingId(null);
    setShowForm(false);
  };

  // ==============================
  // INPUT CHANGE
  // ==============================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==============================
  // SUBMIT
  // ==============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status.toUpperCase(),
      };

      // UPDATE
      if (editingId) {
        await apiClient.put(`/brands/${editingId}`, payload);

        toast.success("Brand updated successfully");
      }

      // CREATE
      else {
        await apiClient.post("/brands", payload);

        toast.success("Brand created successfully");
      }

      await fetchBrands();

      handleCancel();
    } catch (error) {
      console.error("Save brand error:", error);

      toast.error(
        error.response?.data?.message || "Failed to save brand"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==============================
  // EDIT
  // ==============================

  const handleEdit = (brand) => {
    setForm({
      name: brand.name || "",
      description: brand.description || "",
      status: brand.status || "ACTIVE",
    });

    setEditingId(brand.id);

    setShowForm(true);

    setOpenMenu(null);
  };

  // ==============================
  // DELETE
  // ==============================

  const handleDelete = (id) => {
    setOpenMenu(null);
    showConfirm({
      title: "Delete Brand",
      message: "Are you sure you want to delete this brand? Products linked to this brand may be unassigned.",
      confirmText: "Delete Brand",
      type: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/brands/${id}`);
          showSuccess("Product updated", "Brand deleted successfully");
          await fetchBrands();
        } catch (error) {
          console.error("Delete brand error:", error);
          showError("Product couldn't be deleted", error.response?.data?.message || "Failed to delete brand");
        }
      },
    });
  };

  // ==============================
  // REFRESH
  // ==============================

  const handleRefresh = () => {
    setSearch("");
    setOpenMenu(null);
    fetchBrands();
  };

  // ==============================
  // PRINT
  // ==============================

  const handlePrint = () => {
    window.print();
  };

  // ==============================
  // CSV EXPORT
  // ==============================

  const handleExport = () => {
    if (!brands.length) {
      toast.error("No brands available to export");
      return;
    }

    const headers = [
      "Brand",
      "Description",
      "No of Products",
      "Status",
    ];

    const rows = brands.map((brand) => [
      brand.name || "",
      brand.description || "",
      brand.products?.length || 0,
      brand.status || "",
    ]);

    const escapeCSV = (value) => {
      const stringValue = String(value ?? "");

      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "brands.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success("Brands exported successfully");
  };

  // ==============================
  // CLOSE MENU WHEN CLICKING OUTSIDE
  // ==============================

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenu(null);
    };

    if (openMenu) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenu]);

  // ==============================
  // RENDER
  // ==============================

  return (
    <div className={styles.page}>

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Brands</h1>

          <p>
            Manage your product brands
          </p>
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

          <button
            type="button"
            className={styles.addButton}
            onClick={handleAddNew}
          >
            <FiPlus size={17} />

            Add New
          </button>

        </div>
      </div>

      {/* ==========================================
          ADD / EDIT FORM
      ========================================== */}

      {showForm && (
        <div className={styles.formCard}>

          <div className={styles.formHeader}>

            <div>
              <h2>
                {editingId
                  ? "Edit Brand"
                  : "Add New Brand"}
              </h2>

              <p>
                {editingId
                  ? "Update brand information"
                  : "Create a new product brand"}
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

          <form onSubmit={handleSubmit}>

            <div className={styles.formGrid}>

              {/* BRAND NAME */}

              <div className={styles.formGroup}>

                <label htmlFor="brandName">
                  Brand Name
                  <span>*</span>
                </label>

                <input
                  id="brandName"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Apple"
                  required
                  maxLength={100}
                />

              </div>

              {/* STATUS */}

              <div className={styles.formGroup}>

                <label htmlFor="brandStatus">
                  Status
                </label>

                <select
                  id="brandStatus"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>
                </select>

              </div>

              {/* DESCRIPTION */}

              <div
                className={`${styles.formGroup} ${styles.fullWidth}`}
              >

                <label htmlFor="brandDescription">
                  Description
                </label>

                <textarea
                  id="brandDescription"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter brand description"
                  rows={4}
                  maxLength={500}
                />

                <div className={styles.characterCount}>
                  {form.description.length}/500
                </div>

              </div>

            </div>

            {/* FORM ACTIONS */}

            <div className={styles.formActions}>

              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={styles.saveButton}
                disabled={isSubmitting}
              >

                {isSubmitting ? (
                  <>
                    <Loader2
                      size={16}
                      className={styles.spinner}
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={16} />

                    {editingId
                      ? "Update Brand"
                      : "Save Brand"}
                  </>
                )}

              </button>

            </div>

          </form>

        </div>
      )}

      {/* ==========================================
          TABLE CARD
      ========================================== */}

      <div className={styles.tableCard}>

        {/* TOOLBAR */}

        <div className={styles.toolbar}>

          <div className={styles.searchBox}>

            <FiSearch size={18} />

            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearch("")}
              >
                <FiX size={15} />
              </button>
            )}

          </div>

          <div className={styles.toolbarRight}>

            <span className={styles.resultCount}>
              {filteredBrands.length}{" "}
              {filteredBrands.length === 1
                ? "Brand"
                : "Brands"}
            </span>

            <button
              type="button"
              className={styles.refreshButton}
              onClick={handleRefresh}
              title="Refresh"
            >
              <FiRefreshCw size={17} />
            </button>

          </div>

        </div>

        {/* TABLE */}

        <div className={styles.tableWrapper}>

          <table className={styles.table}>

            <thead>
              <tr>

                <th>Brand</th>

                <th>Description</th>

                <th>No of Products</th>

                <th>Status</th>

                <th>Action</th>

              </tr>
            </thead>

            <tbody>

              {/* LOADING */}

              {isLoading ? (
                <tr>

                  <td
                    colSpan="5"
                    className={styles.empty}
                  >
                    <Loader2
                      size={26}
                      className={styles.spinner}
                    />

                    <span>
                      Loading brands...
                    </span>
                  </td>

                </tr>
              ) : filteredBrands.length > 0 ? (

                /* BRAND ROWS */

                filteredBrands.map((brand) => (

                  <tr key={brand.id}>

                    {/* BRAND */}

                    <td>

                      <div className={styles.brandInfo}>

                        {/* <div className={styles.brandAvatar}>
                          {brand.name
                            ?.charAt(0)
                            ?.toUpperCase() || "B"}
                        </div> */}

                        <div>
                          <strong>
                            {brand.name}
                          </strong>
                        </div>

                      </div>

                    </td>

                    {/* DESCRIPTION */}

                    <td>

                      <div
                        className={
                          styles.descriptionCell
                        }
                        title={
                          brand.description || ""
                        }
                      >
                        {brand.description
                          ? brand.description
                          : "—"}
                      </div>

                    </td>

                    {/* PRODUCTS */}

                    <td
                      className={
                        styles.productCount
                      }
                    >
                      {String(
                        brand.products?.length || 0
                      ).padStart(2, "0")}
                    </td>

                    {/* STATUS */}

                    <td>

                      <span
                        className={
                          brand.status === "ACTIVE"
                            ? styles.activeStatus
                            : styles.inactiveStatus
                        }
                      >
                        <span
                          className={
                            styles.statusDot
                          }
                        />

                        {brand.status}
                      </span>

                    </td>

                    {/* ACTION */}

                    <td>

                      <div
                        className={
                          styles.actionWrapper
                        }
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >

                        <button
                          type="button"
                          className={
                            styles.actionButton
                          }
                          onClick={() =>
                            setOpenMenu(
                              openMenu === brand.id
                                ? null
                                : brand.id
                            )
                          }
                        >
                          <FiMoreVertical
                            size={17}
                          />
                        </button>

                        {openMenu === brand.id && (

                          <div
                            className={
                              styles.actionMenu
                            }
                          >

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(brand)
                              }
                            >
                              <FiEdit2 size={14} />

                              Edit
                            </button>

                            <button
                              type="button"
                              className={
                                styles.deleteAction
                              }
                              onClick={() =>
                                handleDelete(
                                  brand.id
                                )
                              }
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

                /* EMPTY */

                <tr>

                  <td
                    colSpan="5"
                    className={styles.empty}
                  >

                    <div
                      className={
                        styles.emptyContent
                      }
                    >

                      <div
                        className={
                          styles.emptyIcon
                        }
                      >
                        <FiSearch size={24} />
                      </div>

                      <h3>
                        No brands found
                      </h3>

                      <p>
                        {search
                          ? "Try a different search term."
                          : "Add your first brand to get started."}
                      </p>

                      {!search && (
                        <button
                          type="button"
                          className={
                            styles.addButton
                          }
                          onClick={handleAddNew}
                        >
                          <FiPlus size={16} />

                          Add Brand
                        </button>
                      )}

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