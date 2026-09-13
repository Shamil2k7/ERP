"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiPlus,
  FiPrinter,
  FiDownload,
  FiSearch,
  FiChevronDown,
  FiRefreshCw,
  FiArrowDown,
} from "react-icons/fi";
import PurchaseTable from "./components/PurchaseTable";
import { getPurchases, deletePurchase } from "@/services/purchaseService";
import { showSuccess, showError, showConfirm } from "@/utils/swal";
import { useCompany } from "@/context/CompanyContext";
import "./purchases.css";

const PAGE_SIZE = 10;

export default function PurchasesPage() {
  const { user } = useCompany();
  const roleUpper = (user?.role || user?.roleRef?.name || user?.designation || user?.type || "").toUpperCase();
  const isAccountant = roleUpper.includes("ACCOUNTANT");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getPurchases();
      const purchasesData = res.data || res || [];
      setPurchases(Array.isArray(purchasesData) ? purchasesData : []);
    } catch (err) {
      console.error("Failed to fetch purchases:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load purchases. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete purchase handler
  const handleDeletePurchase = async (id) => {
    const isConfirmed = await showConfirm({
      title: "Delete Purchase Order?",
      text: "Are you sure you want to delete this purchase order?",
      confirmButtonText: "Yes, Delete",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await deletePurchase(id);
      setPurchases((prev) => prev.filter((p) => p.id !== id));
      showSuccess("Deleted", "Purchase order deleted successfully.");
    } catch (err) {
      showError("Delete Failed", err.response?.data?.message || err.message || "Failed to delete purchase order.");
    }
  };


  // Print handle
  const handlePrint = () => {
    window.print();
  };

  // Export handle
  const handleExportCSV = () => {
    if (purchases.length === 0) return;
    const headers = ["Purchase No", "Supplier", "Products Count", "Total Amount", "Status"];
    const rows = purchases.map((p) => [
      p.purchaseNo,
      p.supplier?.companyName || p.supplier?.name || "—",
      p.items?.length || 0,
      p.totalAmount,
      p.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "purchases_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = () => {
    if (sortOrder === "default") setSortOrder("asc");
    else if (sortOrder === "asc") setSortOrder("desc");
    else setSortOrder("default");
  };

  // Map backend shape -> table row shape
  const mappedPurchases = useMemo(() => {
    return purchases.map((p) => ({
      id: p.id,
      purchaseNo: p.purchaseNo,
      supplier: p.supplier?.companyName || p.supplier?.name || "—",
      totalProducts: p.items?.length || 0,
      totalQty:
        p.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      total: p.totalAmount,
      phone: p.supplier?.phone || "—",
      status: p.status,
    }));
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    let result = mappedPurchases.filter((purchase) => {
      const q = search.toLowerCase();
      const matchesSearch =
        purchase.purchaseNo?.toLowerCase().includes(q) ||
        purchase.supplier?.toLowerCase().includes(q) ||
        purchase.phone?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" ||
        purchase.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    if (sortOrder === "asc") {
      result.sort((a, b) => (a.total || 0) - (b.total || 0));
    } else if (sortOrder === "desc") {
      result.sort((a, b) => (b.total || 0) - (a.total || 0));
    }

    return result;
  }, [mappedPurchases, search, statusFilter, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPurchases.length / PAGE_SIZE)
  );

  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPurchases.slice(start, start + PAGE_SIZE);
  }, [filteredPurchases, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortOrder]);

  return (
    <main className="page">
      {/* PAGE HEADER */}
      <header className="header">
        <div>
          <h1>Purchases</h1>
          <p>Manage company purchase orders, supplier inventory, and stock receipts.</p>
        </div>

        <div className="headerActions">
          <button className="secondaryButton" onClick={handlePrint}>
            <FiPrinter size={15} />
            Print
          </button>

          <button className="secondaryButton" onClick={handleExportCSV}>
            <FiDownload size={15} />
            Export
            <FiChevronDown size={14} />
          </button>

          {!isAccountant && (
            <Link href="/purchases/add" className="addButton">
              <FiPlus size={17} />
              Add New
            </Link>
          )}
        </div>
      </header>

      {/* TABLE CARD */}
      <section className="tableCard">
        <div className="toolbar">
          <div className="searchBox">
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Search purchases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="toolbarRight">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sortButton"
              style={{ outline: "none", cursor: "pointer" }}
            >
              <option value="All">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="RECEIVED">Received</option>
              <option value="PARTIAL">Partial</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button className="sortButton" onClick={handleSort}>
              <FiArrowDown size={16} />
              Sort ({sortOrder})
              <FiChevronDown size={14} />
            </button>

            <button
              className="iconButton"
              title="Refresh"
              onClick={fetchPurchases}
            >
              <FiRefreshCw size={17} />
            </button>
          </div>
        </div>

        {/* Purchase Table */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#71839a" }}>
            Loading purchase orders...
          </div>
        ) : error ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#dc2626" }}>
            {error}{" "}
            <button onClick={fetchPurchases} style={{ textDecoration: "underline", fontWeight: 700, marginLeft: "8px", cursor: "pointer" }}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <PurchaseTable
              purchases={paginatedPurchases}
              onDelete={isAccountant ? undefined : handleDeletePurchase}
              readOnly={isAccountant}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "20px" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="secondaryButton"
                  style={{ height: "32px", fontSize: "12px", padding: "0 12px" }}
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={currentPage === num ? "addButton" : "secondaryButton"}
                    style={{ height: "32px", width: "32px", padding: 0, fontSize: "12px", borderRadius: "6px" }}
                  >
                    {num}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="secondaryButton"
                  style={{ height: "32px", fontSize: "12px", padding: "0 12px" }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
