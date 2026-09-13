"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiPrinter,
  FiEye,
  FiRefreshCw,
  FiDownload,
  FiDollarSign,
  FiShoppingBag,
  FiCreditCard,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFileText,
  FiUser,
  FiChevronDown,
  FiX,
  FiArrowRight,
} from "react-icons/fi";
import apiClient from "@/services/apiClient";
import { useCompany } from "@/context/CompanyContext";
import styles from "./posHistory.module.css";

export default function PosSalesHistoryPage() {
  const router = useRouter();
  const { user, company, isRetail } = useCompany();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selectedSale, setSelectedSale] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const [salesRes, invoicesRes] = await Promise.allSettled([
        apiClient.get("/sales"),
        apiClient.get("/invoices"),
      ]);

      let combined = [];

      if (salesRes.status === "fulfilled") {
        const list = salesRes.value.data?.data || salesRes.value.data || [];
        if (Array.isArray(list)) {
          combined = [...list];
        }
      }

      // Check local storage for recent POS sales fallback
      if (typeof window !== "undefined") {
        try {
          const local = JSON.parse(localStorage.getItem("pos_recent_sales") || "[]");
          if (Array.isArray(local) && local.length > 0) {
            local.forEach((ls) => {
              if (!combined.some((s) => s.id === ls.id || s.orderNumber === ls.orderNumber)) {
                combined.unshift(ls);
              }
            });
          }
        } catch (e) {
          // ignore
        }
      }

      setSales(combined);
    } catch (err) {
      console.error("Failed to fetch POS sales history:", err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      const invoiceNo = (item.orderNumber || item.invoiceNumber || item.id || "").toLowerCase();
      const customer = (item.customer?.name || item.customerName || item.customer || "Walk-in Customer").toLowerCase();
      const cashier = (item.cashierName || item.user?.fullName || item.cashier || "Counter Staff").toLowerCase();
      const searchLower = search.toLowerCase();

      const matchesSearch =
        invoiceNo.includes(searchLower) ||
        customer.includes(searchLower) ||
        cashier.includes(searchLower);

      const payMethod = (item.paymentMethod || item.paymentType || "Cash").toUpperCase();
      const matchesPayment =
        paymentFilter === "All" || payMethod === paymentFilter.toUpperCase();

      let matchesDate = true;
      if (dateFilter !== "All" && item.createdAt) {
        const saleDate = new Date(item.createdAt || item.date);
        const now = new Date();
        if (dateFilter === "Today") {
          matchesDate = saleDate.toDateString() === now.toDateString();
        } else if (dateFilter === "This Month") {
          matchesDate =
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [sales, search, paymentFilter, dateFilter]);

  // Metric summaries
  const metrics = useMemo(() => {
    const totalRev = filteredSales.reduce(
      (sum, s) => sum + Number(s.netAmount || s.totalAmount || s.total || 0),
      0
    );
    const count = filteredSales.length;
    const avgTicket = count > 0 ? totalRev / count : 0;
    const cashCount = filteredSales.filter(
      (s) => (s.paymentMethod || "CASH").toUpperCase() === "CASH"
    ).length;
    const digitalCount = count - cashCount;

    return { totalRev, count, avgTicket, cashCount, digitalCount };
  }, [filteredSales]);

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
    setDetailsModalOpen(true);
  };

  const handlePrintReceipt = (sale) => {
    setSelectedSale(sale);
    setPrintModalOpen(true);
  };

  const triggerBrowserPrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <div className={styles.badge}>
            <FiFileText size={13} />
            <span>ACCOUNTING & AUDIT MODULE</span>
          </div>
          <h1 className={styles.title}>POS Sales History</h1>
          <p className={styles.subtitle}>
            View completed Point of Sale transactions, inspect receipt line items, and audit daily cashier collections.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchSalesData}
            title="Refresh Transactions"
          >
            <FiRefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: "#eff6ff", color: "#2563eb" }}>
            <FiDollarSign size={20} />
          </div>
          <div>
            <div className={styles.metricLabel}>Total POS Sales</div>
            <div className={styles.metricValue}>
              ₹{metrics.totalRev.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={styles.metricSub}>{metrics.count} completed transactions</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: "#ecfdf5", color: "#10b981" }}>
            <FiShoppingBag size={20} />
          </div>
          <div>
            <div className={styles.metricLabel}>Average Ticket Size</div>
            <div className={styles.metricValue}>
              ₹{metrics.avgTicket.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={styles.metricSub}>Per transaction average</div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: "#faf5ff", color: "#8b5cf6" }}>
            <FiCreditCard size={20} />
          </div>
          <div>
            <div className={styles.metricLabel}>Payment Split</div>
            <div className={styles.metricValue}>
              {metrics.cashCount} Cash / {metrics.digitalCount} Digital
            </div>
            <div className={styles.metricSub}>Settlement ratio</div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className={styles.tableCard}>
        {/* TOOLBAR */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <FiSearch size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search invoice number, customer, or cashier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filtersWrap}>
            <div className={styles.filterGroup}>
              <FiCreditCard size={14} color="#64748b" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="All">All Payment Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <FiCalendar size={14} color="#64748b" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="This Month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice / Order #</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Cashier</th>
                <th>Payment Method</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#64748b" }}>
                      <FiRefreshCw className="animate-spin" size={18} />
                      Loading sales history...
                    </div>
                  </td>
                </tr>
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const invoiceNo = sale.orderNumber || sale.invoiceNumber || (sale.id ? `SO-${sale.id.slice(0, 8)}` : "—");
                  const customerName = sale.customer?.name || sale.customerName || sale.customer || "Walk-in Customer";
                  const cashierName = sale.cashierName || sale.user?.fullName || "Cashier Desk";
                  const payMethod = (sale.paymentMethod || sale.paymentType || "CASH").toUpperCase();
                  const total = Number(sale.netAmount || sale.totalAmount || sale.total || 0);
                  const dateStr = sale.createdAt
                    ? new Date(sale.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : sale.date || new Date().toLocaleString();

                  return (
                    <tr key={sale.id || invoiceNo}>
                      <td>
                        <strong className={styles.invoiceLink}>{invoiceNo}</strong>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{dateStr}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FiUser size={14} color="#6366f1" />
                          <span>{customerName}</span>
                        </div>
                      </td>
                      <td>{cashierName}</td>
                      <td>
                        <span className={`${styles.payBadge} ${styles[payMethod.toLowerCase()] || ""}`}>
                          {payMethod}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: "#0f172a", fontSize: "14px" }}>
                          ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td>
                        <span className={styles.statusBadge}>
                          <FiCheckCircle size={12} />
                          <span>Completed</span>
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleViewDetails(sale)}
                            title="View Transaction Details"
                          >
                            <FiEye size={14} />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtnPrint}
                            onClick={() => handlePrintReceipt(sale)}
                            title="Print Invoice / Receipt"
                          >
                            <FiPrinter size={14} />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "50px 20px" }}>
                    <div style={{ color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <FiFileText size={32} color="#cbd5e1" />
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#334155" }}>
                        No POS sales transactions found.
                      </p>
                      <p style={{ margin: 0, fontSize: "13px" }}>
                        Completed sales processed through the POS Terminal will automatically appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILS MODAL */}
      {detailsModalOpen && selectedSale && (
        <div className={styles.modalOverlay} onClick={() => setDetailsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                  Transaction Details
                </h2>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Invoice #{selectedSale.orderNumber || selectedSale.invoiceNumber || selectedSale.id}
                </span>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setDetailsModalOpen(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalGrid}>
                <div>
                  <label className={styles.modalLabel}>Customer</label>
                  <div className={styles.modalVal}>
                    {selectedSale.customer?.name || selectedSale.customerName || "Walk-in Customer"}
                  </div>
                </div>
                <div>
                  <label className={styles.modalLabel}>Cashier</label>
                  <div className={styles.modalVal}>
                    {selectedSale.cashierName || selectedSale.user?.fullName || "Counter Staff"}
                  </div>
                </div>
                <div>
                  <label className={styles.modalLabel}>Payment Method</label>
                  <div className={styles.modalVal}>
                    {(selectedSale.paymentMethod || "CASH").toUpperCase()}
                  </div>
                </div>
                <div>
                  <label className={styles.modalLabel}>Date & Time</label>
                  <div className={styles.modalVal}>
                    {selectedSale.createdAt ? new Date(selectedSale.createdAt).toLocaleString() : selectedSale.date || "—"}
                  </div>
                </div>
              </div>

              {/* LINE ITEMS */}
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginTop: "20px", marginBottom: "10px", color: "#1e293b" }}>
                Itemized Products
              </h3>

              <div className={styles.itemsTableWrapper}>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSale.items || selectedSale.cart || []).length > 0 ? (
                      (selectedSale.items || selectedSale.cart).map((item, idx) => {
                        const name =
                          (typeof item.product === "string" ? item.product : item.product?.name) ||
                          item.productName ||
                          item.name ||
                          item.title ||
                          (typeof item.productId === "object" ? item.productId?.name : null) ||
                          `Product Item #${idx + 1}`;

                        const description =
                          item.description ||
                          item.desc ||
                          (typeof item.product === "object" ? item.product?.description : null) ||
                          item.productDescription ||
                          item.notes ||
                          "";

                        const sku = item.sku || (typeof item.product === "object" ? item.product?.sku : "") || "";
                        const barcode = item.barcode || (typeof item.product === "object" ? item.product?.barcode : "") || "";
                        const qty = Number(item.quantity || item.qty || 1);
                        const price = Number(item.unitPrice || item.price || 0);
                        const total = Number(item.totalPrice || item.total || (price * qty));

                        return (
                          <tr key={idx}>
                            <td style={{ verticalAlign: "top" }}>
                              <div style={{ fontWeight: "700", color: "#0f172a" }}>{name}</div>
                              {description && (
                                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px", lineHeight: "1.3" }}>
                                  {description}
                                </div>
                              )}
                              {(sku || barcode) && (
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                                  {sku && <span style={{ fontSize: "10px", color: "#475569", background: "#f1f5f9", padding: "1px 5px", borderRadius: "3px" }}>SKU: {sku}</span>}
                                  {barcode && <span style={{ fontSize: "10px", color: "#2563eb", background: "#eff6ff", padding: "1px 5px", borderRadius: "3px" }}>Barcode: {barcode}</span>}
                                </div>
                              )}
                            </td>
                            <td style={{ verticalAlign: "top" }}>{qty}</td>
                            <td style={{ verticalAlign: "top" }}>₹{price.toFixed(2)}</td>
                            <td style={{ textAlign: "right", verticalAlign: "top", fontWeight: "700" }}>
                              ₹{total.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", color: "#94a3b8", padding: "16px" }}>
                          Single transaction invoice
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* TOTALS SUMMARY */}
              <div className={styles.totalsBox}>
                <div className={styles.totalsRow}>
                  <span>Subtotal:</span>
                  <span>₹{Number(selectedSale.totalAmount || selectedSale.total || 0).toFixed(2)}</span>
                </div>
                <div className={styles.totalsRow}>
                  <span>Tax / GST:</span>
                  <span>₹{Number(selectedSale.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className={styles.totalsRow}>
                  <span>Discount:</span>
                  <span>-₹{Number(selectedSale.discountAmount || 0).toFixed(2)}</span>
                </div>
                <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
                  <span>Grand Total:</span>
                  <span>₹{Number(selectedSale.netAmount || selectedSale.totalAmount || selectedSale.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => {
                  setDetailsModalOpen(false);
                  setPrintModalOpen(true);
                }}
              >
                <FiPrinter size={15} />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {printModalOpen && selectedSale && (
        <div className={styles.modalOverlay} onClick={() => setPrintModalOpen(false)}>
          <div className={styles.receiptModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.printActionsBar}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={triggerBrowserPrint}
              >
                <FiPrinter size={15} />
                <span>Print</span>
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setPrintModalOpen(false)}
              >
                <FiX size={15} />
                <span>Close</span>
              </button>
            </div>

            {/* PRINTABLE RECEIPT */}
            <div className={styles.printableReceipt}>
              <div style={{ textAlign: "center", borderBottom: "1px dashed #94a3b8", paddingBottom: "12px", marginBottom: "12px" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", textTransform: "uppercase" }}>
                  {company?.name || "RETAIL STORE"}
                </h2>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                  Commercial Point of Sale Receipt
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                  Invoice: #{selectedSale.orderNumber || selectedSale.invoiceNumber || selectedSale.id}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                  Date: {selectedSale.createdAt ? new Date(selectedSale.createdAt).toLocaleString() : selectedSale.date}
                </p>
              </div>

              <div style={{ fontSize: "12px", marginBottom: "12px" }}>
                <div><strong>Customer:</strong> {selectedSale.customer?.name || selectedSale.customerName || "Walk-in Customer"}</div>
                <div><strong>Cashier:</strong> {selectedSale.cashierName || selectedSale.user?.fullName || "Counter Staff"}</div>
                <div><strong>Payment:</strong> {(selectedSale.paymentMethod || "CASH").toUpperCase()}</div>
              </div>

              <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", marginBottom: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left" }}>
                    <th style={{ padding: "4px 0" }}>Item</th>
                    <th style={{ padding: "4px 0", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "4px 0", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedSale.items || selectedSale.cart || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px dashed #e2e8f0" }}>
                      <td style={{ padding: "4px 0" }}>{item.product?.name || item.name || "Item"}</td>
                      <td style={{ padding: "4px 0", textAlign: "center" }}>{item.quantity || item.qty || 1}</td>
                      <td style={{ padding: "4px 0", textAlign: "right" }}>₹{Number(item.totalPrice || (item.price * item.qty) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: "1px dashed #94a3b8", paddingTop: "8px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span>Subtotal:</span>
                  <span>₹{Number(selectedSale.totalAmount || selectedSale.total || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span>Tax / GST:</span>
                  <span>₹{Number(selectedSale.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Discount:</span>
                  <span>-₹{Number(selectedSale.discountAmount || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "14px", borderTop: "1px solid #000", paddingTop: "4px" }}>
                  <span>TOTAL PAID:</span>
                  <span>₹{Number(selectedSale.netAmount || selectedSale.totalAmount || selectedSale.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "#64748b" }}>
                Thank you for your business!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
