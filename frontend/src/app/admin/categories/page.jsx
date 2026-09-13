"use client";

import { useMemo, useState, useEffect } from "react";
import {
  FiPlus,
  FiPrinter,
  FiDownload,
  FiSearch,
  FiCalendar,
  FiChevronDown,
  FiMoreVertical,
  FiRefreshCw,
  FiArrowDown,
  FiX,
  FiSave,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/services/apiClient";

import styles from "./viewCategories.module.css";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";

const initialForm = {
  name: "",
  slug: "",
  status: "ACTIVE",
};

export default function CategoriesPage() {
  const { isGym, isTextile, isMedical } = useCompany();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const pageTitle = isGym
    ? "Gym Membership & Service Categories"
    : isTextile
    ? "Textile Fabric & Yarn Categories"
    : isMedical
    ? "Medicine & Pharmacy Categories"
    : "Retail Product Categories";

  const pageSub = isGym
    ? "Manage fitness memberships, personal training packages, and nutritional supplement categories."
    : isTextile
    ? "Manage cotton, synthetic yarn, woven fabric, and chemical dye classifications."
    : isMedical
    ? "Manage medicine classifications, prescription drugs, over-the-counter formulas, and healthcare categories."
    : "Manage groceries, beverages, personal care, and merchandise categories.";

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError, showConfirm } = useAlert();

  useEffect(() => {
    fetchCategories();
  }, [isGym, isTextile, isMedical]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/categories");
      const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setCategories(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const value = search.toLowerCase().trim();
    if (!value) {
      return categories;
    }
    return categories.filter(
      (category) =>
        category.name?.toLowerCase().includes(value) ||
        category.slug?.toLowerCase().includes(value) ||
        category.status?.toLowerCase().includes(value)
    );
  }, [categories, search]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  const handleAddNew = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(true);
    setOpenMenu(null);
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug:
        editingId !== null
          ? prev.slug
          : name
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      const rawCode = form.slug.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
      const payload = {
        name: form.name.trim(),
        code: rawCode.slice(0, 20),
        status: form.status.toUpperCase(),
      };

      if (editingId !== null) {
        await apiClient.put(`/categories/${editingId}`, payload);
        toast.success("Category updated successfully");
      } else {
        await apiClient.post("/categories", payload);
        toast.success("Category created successfully");
      }
      fetchCategories();
      handleCancel();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setForm({
      name: category.name,
      slug: category.code || category.slug,
      status: category.status,
    });
    setEditingId(category.id);
    setShowForm(true);
    setOpenMenu(null);
  };

  const handleDelete = (id) => {
    setOpenMenu(null);
    showConfirm({
      title: "Delete Category",
      message: "Are you sure you want to delete this product category? Products in this category may be affected.",
      confirmText: "Delete Category",
      type: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/categories/${id}`);
          showSuccess("Product updated", "Category deleted successfully");
          fetchCategories();
        } catch (error) {
          showError("Product couldn't be deleted", error.response?.data?.message || "Failed to delete category");
        }
      },
    });
  };
  

  const handleRefresh = () => {
    setSearch("");
    setCurrentPage(1);
    setOpenMenu(null);
    fetchCategories();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const headers = ["Category", "Category Slug", "No of Products", "Status"];
    const rows = categories.map((category) => [
      category.name,
      category.code,
      category.products?.length || 0,
      category.status,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "categories.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>{pageTitle}</h1>
          <p>{pageSub}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={handlePrint}>
            <FiPrinter size={15} /> Print
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleExport}>
            <FiDownload size={15} /> Export
            <FiChevronDown size={14} />
          </button>
          <button type="button" className={styles.addButton} onClick={handleAddNew}>
            <FiPlus size={17} /> Add New
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <h2>{editingId !== null ? "Edit Category" : "Add New Category"}</h2>
              <p>{editingId !== null ? "Update category information" : "Create a new product category"}</p>
            </div>
            <button type="button" className={styles.closeButton} onClick={handleCancel}>
              <FiX size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="categoryName">Category Name<span>*</span></label>
                <input
                  id="categoryName"
                  name="name"
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Smartphones"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="categorySlug">Category Slug<span>*</span></label>
                <input
                  id="categorySlug"
                  name="slug"
                  value={form.slug}
                  onChange={handleFormChange}
                  placeholder="e.g. smartphones"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="categoryStatus">Status</label>
                <select id="categoryStatus" name="status" value={form.status} onChange={handleFormChange}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={handleCancel}>Cancel</button>
              <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={16} className={styles.spinner} /> : <FiSave size={16} />}
                {editingId !== null ? "Update Category" : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableCard}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            {search && (
              <button type="button" className={styles.clearSearch} onClick={() => setSearch("")}>
                <FiX size={15} />
              </button>
            )}
          </div>
          <div className={styles.toolbarRight}>
            <button type="button" className={styles.iconButton} onClick={handleRefresh} title="Refresh">
              <FiRefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Category Slug</th>
                <th>No of Products</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className={styles.empty}>
                    <Loader2 size={24} className={styles.spinner} />
                  </td>
                </tr>
              ) : currentCategories.length > 0 ? (
                currentCategories.map((category) => (
                  <tr key={category.id}>
                    <td><strong>{category.name}</strong></td>
                    <td className={styles.slug}>{category.code}</td>
                    <td>{category.products?.length || 0}</td>
                    <td>
                      <span className={category.status === "ACTIVE" ? styles.activeStatus : styles.inactiveStatus}>
                        {category.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.inlineActions}>
                        <button
                          type="button"
                          className={styles.inlineEditBtn}
                          onClick={() => handleEdit(category)}
                          title="Edit"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className={styles.inlineDeleteBtn}
                          onClick={() => handleDelete(category.id)}
                          title="Delete"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={styles.empty}>No categories found. Add your first category.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <div className={styles.showing}>
            Showing
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 / Pages</option>
              <option value={10}>10 / Pages</option>
              <option value={20}>20 / Pages</option>
            </select>
          </div>
          <div className={styles.pageNumbers}>
            <button type="button" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>‹</button>
            {Array.from({ length: totalPages || 1 }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                key={page}
                className={currentPage === page ? styles.activePage : ""}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            <button type="button" disabled={currentPage === totalPages || totalPages === 0} onClick={() => goToPage(currentPage + 1)}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}