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
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { Loader2 } from "lucide-react";
import apiClient from "@/services/apiClient";

import styles from "./viewUnits.module.css";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import { useRouter } from "next/navigation";

const emptyForm = {
  name: "",
  code: "",
  status: "ACTIVE",
};

export default function UnitsPage() {
  const router = useRouter();
  const { isGym, isTextile, isRestaurant, isLaundry, isMedical } = useCompany();
  const isRetail = !isGym && !isTextile && !isRestaurant && !isLaundry && !isMedical;

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { showSuccess, showError, showConfirm } = useAlert();

  useEffect(() => {
    if (isRetail) {
      router.replace("/admin/products/view");
      return;
    }
    fetchUnits();
  }, [isRetail]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/units");
      if (res.data && res.data.data) {
        setUnits(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = useMemo(() => {
    const result = units.filter((unit) => {
      const searchValue = search.toLowerCase();
      return (
        unit.name?.toLowerCase().includes(searchValue) ||
        unit.code?.toLowerCase().includes(searchValue) ||
        unit.status?.toLowerCase().includes(searchValue)
      );
    });

    return [...result].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.name.localeCompare(b.name);
      }
      return b.name.localeCompare(a.name);
    });
  }, [units, search, sortOrder]);

  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUnits = filteredUnits.slice(startIndex, startIndex + itemsPerPage);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        status: form.status.toUpperCase(),
      };

      if (editingId) {
        await apiClient.put(`/units/${editingId}`, payload);
        showSuccess("Unit updated", "Measurement unit updated successfully");
      } else {
        await apiClient.post("/units", payload);
        showSuccess("Unit created", "Measurement unit created successfully");
      }
      fetchUnits();
      handleCancel();
    } catch (error) {
      showError("Invalid form data", error.response?.data?.message || "Failed to save unit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowAddForm(true);
    setOpenMenu(null);
  };

  const handleEdit = (unit) => {
    setForm({
      name: unit.name || "",
      code: unit.code || "",
      status: unit.status || "ACTIVE",
    });
    setEditingId(unit.id);
    setShowAddForm(true);
    setOpenMenu(null);
  };

  const handleDelete = (id) => {
    setOpenMenu(null);
    showConfirm({
      title: "Delete Unit",
      message: "Are you sure you want to delete this measurement unit?",
      confirmText: "Delete Unit",
      type: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/units/${id}`);
          showSuccess("Unit deleted", "Measurement unit deleted successfully");
          fetchUnits();
        } catch (error) {
          showError("Deletion Failed", error.response?.data?.message || "Failed to delete unit");
        }
      },
    });
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleRefresh = () => {
    fetchUnits();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Unit Name,Short Name,Products Count,Status"]
        .concat(
          filteredUnits.map(
            (u) =>
              `"${u.name}","${u.code}","${u.products?.length || 0}","${u.status}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "units_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Units of Measure</h1>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={handlePrint}>
            <FiPrinter size={15} /> Print
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleExport}>
            <FiDownload size={15} /> Export <FiChevronDown size={14} />
          </button>
          <button type="button" className={styles.addButton} onClick={handleAddNew}>
            <FiPlus size={17} /> Add New Unit
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className={styles.addCard}>
          <div className={styles.addHeader}>
            <div>
              <h2>{editingId ? "Edit Unit" : "Add Measurement Unit"}</h2>
              <p>{editingId ? "Update existing unit information" : "Create a new measurement unit (e.g. Kilogram, Pieces, Litre)"}</p>
            </div>
            <button type="button" className={styles.closeButton} onClick={handleCancel}>
              <FiX size={18} />
            </button>
          </div>
          <form className={styles.unitForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="unitName">Unit Name <span>*</span></label>
              <input
                id="unitName"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Example: Kilogram"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="shortName">Short Code / Symbol <span>*</span></label>
              <input
                id="code"
                name="code"
                value={form.code}
                onChange={handleFormChange}
                placeholder="Example: kg"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={form.status} onChange={handleFormChange}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelButton} onClick={handleCancel}>Cancel</button>
              <button type="submit" className={styles.saveButton} disabled={submitting}>
                {submitting ? <Loader2 size={16} className={styles.spinner} /> : <FiSave size={16} />}
                {editingId ? "Update Unit" : "Save Unit"}
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
              placeholder="Search units..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className={styles.toolbarRight}>
            <button type="button" className={styles.sortButton} onClick={handleSort}>
              <FiArrowDown size={16} /> Sort By <FiChevronDown size={15} />
            </button>
            <button type="button" className={styles.iconButton} title="Refresh" onClick={handleRefresh}>
              <FiRefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Unit Name</th>
                <th>Short Symbol</th>
                <th>No of Products</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className={styles.empty}>
                    <Loader2 size={24} className={styles.spinner} />
                  </td>
                </tr>
              ) : paginatedUnits.length > 0 ? (
                paginatedUnits.map((unit) => (
                  <tr key={unit.id}>
                    <td><strong className={styles.unitName}>{unit.name}</strong></td>
                    <td><span className={styles.shortName}>{unit.code}</span></td>
                    <td><span className={styles.products}>{String(unit.products?.length || 0).padStart(2, "0")}</span></td>
                    <td>
                      <span className={`${styles.status} ${unit.status === "ACTIVE" ? styles.active : styles.inactive}`}>
                        {unit.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionWrapper}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => setOpenMenu(openMenu === unit.id ? null : unit.id)}
                        >
                          <FiMoreVertical size={17} />
                        </button>
                        {openMenu === unit.id && (
                          <div className={styles.actionMenu}>
                            <button type="button" onClick={() => handleEdit(unit)}>
                              <FiEdit2 size={14} /> Edit
                            </button>
                            <button type="button" className={styles.deleteAction} onClick={() => handleDelete(unit.id)}>
                              <FiTrash2 size={14} /> Delete
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
                    No measurement units found. Click &quot;Add New Unit&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <span>Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUnits.length)} of {filteredUnits.length} entries</span>
            <div className={styles.paginationButtons}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={currentPage === page ? styles.activePage : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}