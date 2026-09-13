"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StockTable from "../components/StockTable";
import StockModal from "../components/StockModal";
import { useAlert } from "@/context/AlertContext";
import { getInventories, deleteInventory } from "@/services/inventoryService";
import { getProducts } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { getWarehouses } from "@/services/warehouseService";
import { useCompany } from "@/context/CompanyContext";
import apiClient from "@/services/apiClient";
import "../warehouse.css";

const ITEMS_PER_PAGE = 8;

export default function WarehouseStockPage() {
  const { isGym, isTextile } = useCompany();
  const { showSuccess, showError, showConfirm } = useAlert();
  const [inventories, setInventories] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search, Filter & Pagination states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Load all dynamic data
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [invRes, prodRes, whRes, catRes] = await Promise.all([
        getInventories(),
        isTextile ? apiClient.get("/textile/products") : getProducts(),
        getWarehouses(),
        getCategories(),
      ]);

      const list = invRes?.data || (Array.isArray(invRes) ? invRes : []);
      setInventories(list);

      const prodList = prodRes?.data?.data || prodRes?.data || (Array.isArray(prodRes) ? prodRes : []);
      setProducts(prodList);

      const whList = whRes?.data?.data || whRes?.data || (Array.isArray(whRes) ? whRes : []);
      setWarehouses(whList);

      const catList = catRes?.data?.data || catRes?.data || (Array.isArray(catRes) ? catRes : []);
      setCategories(catList);
    } catch (err) {
      console.error("Load stock inventory error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isGym, isTextile]);

  const filteredProductsByIndustry = useMemo(() => {
    return products.filter((p) => {
      if (isTextile) return p.isTextile === true || p.category === "TEXTILE" || isTextile;
      if (isGym) return p.sku?.startsWith("GYM-") || p.description?.includes("[GYM]");
      return !p.isTextile && !p.sku?.startsWith("TEX-") && !p.sku?.startsWith("GYM-");
    });
  }, [products, isTextile, isGym]);

  const filteredWarehousesByIndustry = useMemo(() => {
    return warehouses.filter((w) => {
      const isTex = w.isTextile === true || w.code?.startsWith("TEX-") || w.name?.toLowerCase().includes("mill") || w.name?.toLowerCase().includes("fabric") || w.name?.toLowerCase().includes("dye") || w.name?.toLowerCase().includes("spinning") || w.name?.toLowerCase().includes("textile") || w.address?.includes("[TEXTILE]");
      const isGymMode = w.code?.startsWith("GYM-") || w.name?.toLowerCase().includes("fitness") || w.name?.toLowerCase().includes("gym") || w.address?.includes("[GYM]");
      
      if (isTextile) return isTex || true;
      if (isGym) return isGymMode;
      return !isTex && !isGymMode;
    });
  }, [warehouses, isTextile, isGym]);

  // Map backend model shape to table-friendly shape
  const mappedStock = useMemo(() => {
    const filtered = inventories.filter((item) => {
      if (isTextile) {
        return item.product?.isTextile === true || item.product?.category === "TEXTILE" || item.product?.sku?.startsWith("TEX-") || item.product?.sku?.startsWith("FAB-") || true;
      }
      const sku = item.product?.sku || "";
      const desc = item.product?.description || "";
      const isTex = item.product?.isTextile || sku.startsWith("TEX-") || desc.includes("[TEXTILE]");
      if (isGym) return sku.startsWith("GYM-") || desc.includes("[GYM]");
      return !isTex && !sku.startsWith("GYM-");
    });

    return filtered.map((item) => ({
      id: item.id,
      sku: item.product?.sku || "N/A",
      product: item.product?.name || "Unknown Product",
      category: item.product?.category?.name || "Uncategorized",
      warehouse: item.warehouse?.name || "Unknown Warehouse",
      quantity: item.quantity ?? 0,
      reorder: item.reorderLevel ?? item.minimumStock ?? 10,
      productId: item.productId,
      warehouseId: item.warehouseId,
      minimumStock: item.minimumStock,
      maximumStock: item.maximumStock,
      reorderLevel: item.reorderLevel,
    }));
  }, [inventories, isTextile, isGym]);

  // Apply filters and searches
  const filteredStock = useMemo(() => {
    return mappedStock.filter((item) => {
      const matchesSearch =
        item.product.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || item.category === categoryFilter;

      let itemStatus = "In Stock";
      if (item.quantity === 0) itemStatus = "Out of Stock";
      else if (item.quantity <= item.reorder) itemStatus = "Low Stock";

      const matchesStatus =
        statusFilter === "All" || itemStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [mappedStock, search, categoryFilter, statusFilter]);

  // Reset page to 1 on filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  // Paginated data slice
  const paginatedStock = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStock.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStock, currentPage]);

  const totalPages = Math.ceil(filteredStock.length / ITEMS_PER_PAGE) || 1;

  // Edit stock level click handler
  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  // Delete stock level click handler
  const handleDelete = (item) => {
    showConfirm({
      title: "Delete Stock Record",
      message: `Are you sure you want to remove ${item.product} stock mapping for ${item.warehouse}? This deletes the inventory record.`,
      confirmText: "Delete Record",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteInventory(item.id);
          showSuccess("Stock Deleted", "Inventory mapping deleted successfully.");
          await loadData();
        } catch (err) {
          console.error("Delete inventory error:", err);
          showError(
            "Delete Failed",
            err.response?.data?.message || err.message || "Failed to delete inventory record."
          );
        }
      },
    });
  };

  return (
    <div className="warehouse-page-wrapper">
      {/* Sub-Navigation */}
      <nav className="warehouse-nav-tabs">
        <Link href="/warehouse" className="nav-tab-item">
          Warehouse Overview
        </Link>
        <Link href="/warehouse/stock" className="nav-tab-item active">
          Stock Inventory
        </Link>
        <Link href="/warehouse/transfer" className="nav-tab-item">
          Stock Transfer
        </Link>
      </nav>


      {/* Main Content Area */}
      <main className="warehouse-main-content">
        {/* Action Toolbar */}
        <div className="warehouse-toolbar">
          <button
            className="btn-add-action"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            Add Stock Record <span>+</span>
          </button>

          <div className="toolbar-controls">
            <input
              type="text"
              placeholder="Search product, SKU, warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-pill"
            />
            <button className="btn-search-icon" title="Search">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="status-dropdown-pill"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-dropdown-pill"
            >
              <option value="All">Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Errors & Notices */}
        {error && (
          <div
            className="warehouse-error"
            style={{
              color: "var(--status-out-text)",
              backgroundColor: "var(--status-out-bg)",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #fecaca",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Loading Spinner or Stock Table */}
        {loading ? (
          <div
            className="warehouse-loading"
            style={{
              textAlign: "center",
              padding: "60px",
              color: "var(--text-muted)",
              fontSize: "16px",
            }}
          >
            Loading stock inventory...
          </div>
        ) : (
          <StockTable
            stock={paginatedStock}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {/* Bottom Floating Pagination */}
        {!loading && totalPages > 1 && (
          <div className="warehouse-pagination-wrapper">
            <div className="warehouse-pagination-pill">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  className={`page-btn ${currentPage === num ? "active" : ""}`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add / Edit Inventory Modal */}
      <StockModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={loadData}
        item={editingItem}
        products={filteredProductsByIndustry}
        warehouses={filteredWarehousesByIndustry}
      />
    </div>
  );
}