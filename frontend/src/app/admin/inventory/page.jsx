"use client";

import { useMemo, useState, useEffect } from "react";
import apiClient from "@/services/apiClient";
import { toast, Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";

import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiRefreshCw,
  FiPrinter,
  FiDownload,
  FiPlus,
  FiBox,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiEye,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

import styles from "./inventory.module.css";
import { useAlert } from "@/context/AlertContext";

export default function InventoryPage() {
  const [inventoriesData, setInventoriesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [warehouseFilter, setWarehouseFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");

  const { showSuccess, showError, showConfirm } = useAlert();

  /* =========================================================
     FETCH INVENTORY
  ========================================================= */

  useEffect(() => {
    fetchInventories();
  }, []);

  const fetchInventories = async () => {
    try {
      setLoading(true);

      const res = await apiClient.get("/inventory");

      if (res.data && res.data.data) {
        setInventoriesData(res.data.data);
      } else {
        setInventoriesData([]);
      }
    } catch (error) {
      console.error("Error fetching inventories:", error);
      toast.error("Failed to fetch inventory records");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     DELETE INVENTORY
  ========================================================= */

  const handleDelete = (id) => {
    showConfirm({
      title: "Delete Inventory Record",
      message:
        "Are you sure you want to delete this inventory record? This action cannot be undone.",
      confirmText: "Delete Record",
      type: "danger",

      onConfirm: async () => {
        try {
          await apiClient.delete(`/inventory/${id}`);

          showSuccess(
            "Inventory updated",
            "Inventory record deleted successfully"
          );

          fetchInventories();
        } catch (error) {
          console.error(error);

          showError(
            "Record couldn't be deleted",
            "Failed to delete inventory record."
          );
        }
      },
    });
  };

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const filteredInventories = useMemo(() => {
    let result = [...inventoriesData];

    /* Search */
    if (search.trim()) {
      const keyword = search.toLowerCase();

      result = result.filter(
        (inv) =>
          inv.product?.name
            ?.toLowerCase()
            .includes(keyword) ||
          inv.product?.sku
            ?.toLowerCase()
            .includes(keyword) ||
          inv.warehouse?.name
            ?.toLowerCase()
            .includes(keyword)
      );
    }

    /* Warehouse */
    if (warehouseFilter !== "All") {
      result = result.filter(
        (inv) =>
          inv.warehouse?.name === warehouseFilter
      );
    }

    /* Status */
    if (statusFilter !== "All") {
      result = result.filter((inv) => {
        const qty = inv.quantity || 0;
        const minStock = inv.minimumStock || 10;

        if (statusFilter === "In Stock") {
          return qty > minStock;
        }

        if (statusFilter === "Low Stock") {
          return qty > 0 && qty <= minStock;
        }

        if (statusFilter === "No Stock") {
          return qty === 0;
        }

        return true;
      });
    }

    /* Sort */
    if (sortBy === "Product Name") {
      result.sort((a, b) =>
        (a.product?.name || "").localeCompare(
          b.product?.name || ""
        )
      );
    }

    if (sortBy === "Quantity High") {
      result.sort(
        (a, b) =>
          (b.quantity || 0) - (a.quantity || 0)
      );
    }

    if (sortBy === "Quantity Low") {
      result.sort(
        (a, b) =>
          (a.quantity || 0) - (b.quantity || 0)
      );
    }

    return result;
  }, [
    search,
    statusFilter,
    warehouseFilter,
    sortBy,
    inventoriesData,
  ]);

  /* =========================================================
     UNIQUE WAREHOUSES
  ========================================================= */

  const uniqueWarehouses = useMemo(() => {
    const warehouses = new Set();

    inventoriesData.forEach((inv) => {
      if (inv.warehouse?.name) {
        warehouses.add(inv.warehouse.name);
      }
    });

    return Array.from(warehouses);
  }, [inventoriesData]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalInventories = inventoriesData.length;

  const inStock = inventoriesData.filter(
    (inv) =>
      (inv.quantity || 0) >
      (inv.minimumStock || 10)
  ).length;

  const lowStock = inventoriesData.filter(
    (inv) => {
      const qty = inv.quantity || 0;
      const minStock = inv.minimumStock || 10;

      return qty > 0 && qty <= minStock;
    }
  ).length;

  const noStock = inventoriesData.filter(
    (inv) => (inv.quantity || 0) === 0
  ).length;

  /* =========================================================
     INVENTORY STATUS
  ========================================================= */

  const getInventoryStatus = (inv) => {
    const qty = inv.quantity || 0;
    const minStock = inv.minimumStock || 10;

    if (qty === 0) return "No Stock";

    if (qty <= minStock) {
      return "Low Stock";
    }

    return "In Stock";
  };

  const getStatusClass = (status) => {
    if (status === "In Stock") {
      return styles.inStock;
    }

    if (status === "Low Stock") {
      return styles.lowStock;
    }

    return styles.noStock;
  };

  /* =========================================================
     VIEW
  ========================================================= */

  const handleView = (id) => {
    window.location.href =
      `/admin/inventory/view/${id}`;
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (id) => {
    window.location.href =
      `/admin/inventory/edit/${id}`;
  };

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =========================================================
     EXPORT CSV
  ========================================================= */

  const handleExport = () => {
    const headers = [
      "Product Name",
      "SKU",
      "Warehouse",
      "Quantity",
      "Min Stock",
      "Max Stock",
      "Reorder Level",
      "Status",
    ];

    const rows = filteredInventories.map(
      (inv) => [
        inv.product?.name || "N/A",
        inv.product?.sku || "N/A",
        inv.warehouse?.name || "N/A",
        inv.quantity || 0,
        inv.minimumStock || 0,
        inv.maximumStock || 0,
        inv.reorderLevel || 0,
        getInventoryStatus(inv),
      ]
    );

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "inventory.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className={styles.page}>
      <Toaster position="top-right" />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className={styles.header}>
        <div>
          <h1>Inventory Management</h1>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={handlePrint}
          >
            <FiPrinter />
            Print
          </button>

          <button
            className={styles.secondaryButton}
            onClick={handleExport}
          >
            <FiDownload />
            Export
            <FiChevronDown />
          </button>

          <button
            className={styles.addButton}
            onClick={() => {
              window.location.href =
                "/admin/inventory/add";
            }}
          >
            <FiPlus />
            Add Inventory
          </button>
        </div>
      </div>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <div className={styles.statsGrid}>
        {/* Total */}
        <div className={styles.statCard}>
          <div>
            <p>Total Records</p>

            <h2>{totalInventories}</h2>

            <span className={styles.growth}>
              Total Entries
            </span>
          </div>

          <div
            className={`${styles.statIcon} ${styles.blueIcon}`}
          >
            <FiBox />
          </div>
        </div>

        {/* Healthy */}
        <div className={styles.statCard}>
          <div>
            <p>Healthy Stock</p>

            <h2>{inStock}</h2>

            <span className={styles.growth}>
              Optimal Levels
            </span>
          </div>

          <div
            className={`${styles.statIcon} ${styles.greenIcon}`}
          >
            <FiCheckCircle />
          </div>
        </div>

        {/* Low Stock */}
        <div className={styles.statCard}>
          <div>
            <p>Low Stock</p>

            <h2>{lowStock}</h2>

            <span className={styles.alertText}>
              Reorder soon
            </span>
          </div>

          <div
            className={`${styles.statIcon} ${styles.orangeIcon}`}
          >
            <FiAlertTriangle />
          </div>
        </div>

        {/* Out of Stock */}
        <div className={styles.statCard}>
          <div>
            <p>Out of Stock</p>

            <h2>{noStock}</h2>

            <span className={styles.alertText}>
              Urgent Action
            </span>
          </div>

          <div
            className={`${styles.statIcon} ${styles.redIcon}`}
          >
            <FiXCircle />
          </div>
        </div>
      </div>

      {/* =====================================================
          TABLE CARD
      ===================================================== */}

      <section className={styles.tableCard}>

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <div className={styles.toolbar}>

          {/* Search */}
          <div className={styles.searchBox}>
            <FiSearch />

            <input
              type="text"
              placeholder="Search by product, sku or warehouse..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className={styles.toolbarRight}>

            {/* Warehouse */}
            <select
              className={styles.filterButton}
              value={warehouseFilter}
              onChange={(e) =>
                setWarehouseFilter(e.target.value)
              }
            >
              <option value="All">
                All Warehouses
              </option>

              {uniqueWarehouses.map((warehouse) => (
                <option
                  key={warehouse}
                  value={warehouse}
                >
                  {warehouse}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              className={styles.filterButton}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="All">
                All Statuses
              </option>

              <option value="In Stock">
                In Stock
              </option>

              <option value="Low Stock">
                Low Stock
              </option>

              <option value="No Stock">
                Out of Stock
              </option>
            </select>

            {/* Sort */}
            <select
              className={styles.sortButton}
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
            >
              <option value="Latest">
                Sort: Latest
              </option>

              <option value="Product Name">
                Product Name (A-Z)
              </option>

              <option value="Quantity High">
                Quantity (High to Low)
              </option>

              <option value="Quantity Low">
                Quantity (Low to High)
              </option>
            </select>

            {/* Refresh */}
            <button
              className={styles.iconButton}
              title="Refresh"
              onClick={fetchInventories}
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className={styles.tableWrapper}>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "40px",
              }}
            >
              <Loader2
                className={styles.spinner}
                style={{
                  animation:
                    "spin 1s linear infinite",
                }}
                size={40}
              />
            </div>
          ) : (
            <table className={styles.table}>

              {/* TABLE HEADER */}
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Warehouse</th>
                  <th>Quantity</th>
                  <th>Min Stock</th>
                  <th>Max Stock</th>
                  <th>Reorder Lvl</th>
                  <th>Status</th>
                  <th
                    style={{
                      textAlign: "center",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody>

                {filteredInventories.length > 0 ? (

                  filteredInventories.map((inv) => {

                    const status =
                      getInventoryStatus(inv);

                    return (
                      <tr key={inv.id}>

                        {/* PRODUCT */}
                        <td>
                          <div
                            className={
                              styles.productCell
                            }
                          >
                            <div
                              className={`${styles.productIcon} ${
                                styles[
                                  inv.product
                                    ?.iconType ||
                                    "default"
                                ]
                              }`}
                            >
                              {inv.product?.image ? (

                                <img
                                  src={
                                    inv.product.image.startsWith(
                                      "http"
                                    )
                                      ? inv.product
                                          .image
                                      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${
                                          inv.product.image.startsWith(
                                            "/"
                                          )
                                            ? ""
                                            : "/"
                                        }${
                                          inv.product
                                            .image
                                        }`
                                  }
                                  alt={
                                    inv.product
                                      ?.name ||
                                    "Product"
                                  }
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit:
                                      "cover",
                                    borderRadius:
                                      "4px",
                                  }}
                                />

                              ) : (
                                <FiBox />
                              )}
                            </div>

                            <strong>
                              {inv.product?.name ||
                                "N/A"}
                            </strong>
                          </div>
                        </td>

                        {/* SKU */}
                        <td>
                          {inv.product?.sku ||
                            "N/A"}
                        </td>

                        {/* WAREHOUSE */}
                        <td>
                          <span
                            style={{
                              fontWeight: 500,
                            }}
                          >
                            {inv.warehouse?.name ||
                              "N/A"}
                          </span>
                        </td>

                        {/* QUANTITY */}
                        <td
                          style={{
                            fontWeight: 600,
                            color: qtyColor(
                              inv.quantity,
                              inv.minimumStock
                            ),
                          }}
                        >
                          {String(
                            inv.quantity || 0
                          ).padStart(2, "0")}
                        </td>

                        {/* MIN STOCK */}
                        <td>
                          {inv.minimumStock || 0}
                        </td>

                        {/* MAX STOCK */}
                        <td>
                          {inv.maximumStock || 0}
                        </td>

                        {/* REORDER LEVEL */}
                        <td>
                          {inv.reorderLevel || 0}
                        </td>

                        {/* STATUS */}
                        <td>
                          <span
                            className={`${styles.status} ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        {/* =================================================
                            ACTION BUTTONS
                        ================================================= */}

                        <td>
                          <div
                            className={
                              styles.actionButtons
                            }
                          >

                            {/* VIEW */}
                            <button
                              type="button"
                              className={
                                styles.actionButton
                              }
                              title="View"
                              onClick={() =>
                                handleView(inv.id)
                              }
                            >
                              <FiEye />
                            </button>

                            {/* EDIT */}
                            <button
                              type="button"
                              className={
                                styles.actionButton
                              }
                              title="Edit"
                              onClick={() =>
                                handleEdit(inv.id)
                              }
                            >
                              <FiEdit2 />
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              title="Delete"
                              onClick={() =>
                                handleDelete(inv.id)
                              }
                            >
                              <FiTrash2 />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })

                ) : (

                  <tr>
                    <td
                      colSpan="9"
                      className={styles.empty}
                    >
                      No inventory records found
                    </td>
                  </tr>

                )}

              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   QUANTITY COLOR
========================================================= */

function qtyColor(qty, minStock) {
  if (!qty || qty === 0) {
    return "#dc2626";
  }

  if (qty <= (minStock || 10)) {
    return "#d97706";
  }

  return "#059669";
}