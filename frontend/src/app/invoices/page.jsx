"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiRefreshCw,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiPrinter,
} from "react-icons/fi";
import InvoiceTable from "./components/InvoiceTable";
import InvoicePreview from "./components/InvoicePreview";
import PrintInvoice from "./components/PrintInvoice";
import apiClient from "@/services/apiClient";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printState, setPrintState] = useState({ invoice: null, mode: "A4" });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [invRes, salesRes] = await Promise.allSettled([
        apiClient.get("/invoices"),
        apiClient.get("/sales"),
      ]);

      let list = [];
      if (invRes.status === "fulfilled" && invRes.value.data?.data) {
        const rawInv = Array.isArray(invRes.value.data.data) ? invRes.value.data.data : [];
        list = [...rawInv];
      }

      // Merge any sales orders that are not yet in invoices
      if (salesRes.status === "fulfilled" && salesRes.value.data?.data) {
        const rawSales = Array.isArray(salesRes.value.data.data) ? salesRes.value.data.data : [];
        rawSales.forEach((sale) => {
          const invNum = `INV-${(sale.orderNumber || "").replace(/^SO-/, "")}` || `INV-${sale.id}`;
          if (
            !list.some(
              (i) =>
                i.invoiceNumber === invNum ||
                i.invoiceNo === invNum ||
                i.salesOrderId === sale.id ||
                i.id === sale.id ||
                i.orderNumber === sale.orderNumber
            )
          ) {
            const total = Number(sale.netAmount || sale.totalAmount || 0);
            const subtotal = Number(sale.totalAmount || total);
            const discount = Number(sale.discountAmount || 0);
            const tax = Number(sale.taxAmount || 0);

            list.push({
              id: sale.id,
              invoiceNumber: invNum,
              invoiceNo: invNum,
              customerName: sale.customerName || sale.customer?.name || sale.customer || "Walk-in Customer",
              customer: sale.customerName || sale.customer?.name || sale.customer || "Walk-in Customer",
              customerPhone: sale.customerPhone || "",
              date: sale.orderDate
                ? new Date(sale.orderDate).toISOString().split("T")[0]
                : new Date(sale.createdAt || Date.now()).toISOString().split("T")[0],
              referenceNumber: sale.orderNumber || invNum,
              salesOrderNumber: sale.orderNumber || invNum,
              orderNumber: sale.orderNumber || invNum,
              totalAmount: total,
              total: total,
              netAmount: total,
              subtotal,
              subTotal: subtotal,
              taxAmount: tax,
              tax,
              discountAmount: discount,
              discount,
              paidAmount: total,
              balanceAmount: 0,
              paymentStatus:
                sale.status === "COMPLETED" ? "PAID" : sale.status === "CANCELLED" ? "CANCELLED" : "PENDING",
              status: sale.status || "PAID",
              paymentMethod: sale.paymentMethod || "Cash",
              items: sale.items || [],
            });
          }
        });
      }

      setInvoices(list);
    } catch (err) {
      console.error("Failed to load invoices:", err);
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const num = (inv.invoiceNumber || inv.invoiceNo || "").toLowerCase();
      const cust = (inv.customerName || inv.customer || "").toLowerCase();
      const ref = (inv.referenceNumber || inv.salesOrderNumber || inv.orderNumber || "").toLowerCase();
      const phone = (inv.customerPhone || "").toLowerCase();
      const matchesSearch = !q || num.includes(q) || cust.includes(q) || ref.includes(q) || phone.includes(q);

      const status = (inv.paymentStatus || "").toUpperCase();
      const matchesPayment =
        paymentFilter === "ALL" ||
        (paymentFilter === "PAID" && (status === "PAID" || status === "COMPLETED" || status === "ISSUED")) ||
        (paymentFilter === "PENDING" && (status === "PENDING" || status === "UNPAID" || status === "PARTIAL"));

      return matchesSearch && matchesPayment;
    });
  }, [invoices, searchQuery, paymentFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;

    invoices.forEach((inv) => {
      const total = Number(inv.totalAmount ?? inv.total ?? inv.netAmount ?? 0);
      totalRevenue += total;
      const status = (inv.paymentStatus || "").toUpperCase();
      if (status === "PAID" || status === "COMPLETED" || status === "ISSUED") {
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      totalInvoices: invoices.length,
      totalRevenue,
      paidCount,
      pendingCount,
    };
  }, [invoices]);

  const handlePrint = (invoice, mode = "A4") => {
    setPrintState({ invoice, mode });
  };

  const handleAfterPrint = () => {
    // Keep printState active for print dialog and reset gently
    setTimeout(() => {
      setPrintState({ invoice: null, mode: "A4" });
    }, 1000);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "80vh",
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <FiRefreshCw
          size={28}
          style={{
            color: "#2563eb",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ fontSize: "16px", fontWeight: "700", color: "#64748b" }}>
          Loading Invoices & Billing...
        </span>
        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* DIRECT PRINT COMPONENT */}
      {printState.invoice && (
        <PrintInvoice
          invoice={printState.invoice}
          mode={printState.mode}
          onAfterPrint={handleAfterPrint}
        />
      )}

      {/* MAIN SCREEN */}
      <div
        style={{
          padding: "24px",
          background: "#f8fafc",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: "900",
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FiFileText size={26} style={{ color: "#2563eb" }} />
              <span>Invoices & Billing</span>
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>
              View, preview, and print tax invoices and thermal receipts for retail sales.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={fetchInvoices}
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
              <FiRefreshCw size={14} />
              <span>Refresh Invoices</span>
            </button>
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "14px 18px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* QUICK STATS SUMMARY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              padding: "18px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiFileText size={22} />
            </div>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Total Invoices
              </span>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>
                {stats.totalInvoices}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#ecfdf5",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiDollarSign size={22} />
            </div>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Total Invoiced
              </span>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>
                ₹{stats.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#dcfce7",
                color: "#15803d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiCheckCircle size={22} />
            </div>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Paid Invoices
              </span>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#15803d" }}>
                {stats.paidCount}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              padding: "18px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#fef3c7",
                color: "#b45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiClock size={22} />
            </div>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Pending Invoices
              </span>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#b45309" }}>
                {stats.pendingCount}
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER TOOLBAR */}
        <div
          style={{
            background: "#ffffff",
            padding: "16px 20px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {/* SEARCH INPUT */}
          <div style={{ position: "relative", width: "100%", maxWidth: "440px" }}>
            <FiSearch
              size={17}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search by Invoice #, Customer, Phone, or Order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "42px",
                padding: "0 16px 0 40px",
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "9px",
                outline: "none",
                fontSize: "13px",
                color: "#1e293b",
                fontWeight: "500",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* PAYMENT STATUS FILTER BUTTONS */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "12px", fontWeight: "700" }}>
              <FiFilter size={14} />
              <span>Status:</span>
            </div>

            {["ALL", "PAID", "PENDING"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setPaymentFilter(status)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: paymentFilter === status ? "#2563eb" : "#cbd5e1",
                  backgroundColor: paymentFilter === status ? "#2563eb" : "#ffffff",
                  color: paymentFilter === status ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                {status === "ALL" ? "All Invoices" : status === "PAID" ? "Paid" : "Pending"}
              </button>
            ))}

            <div
              style={{
                padding: "7px 14px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                color: "#64748b",
                fontSize: "12px",
                fontWeight: "700",
                whiteSpace: "nowrap",
                marginLeft: "4px",
              }}
            >
              Showing <strong style={{ color: "#0f172a" }}>{filteredInvoices.length}</strong> Invoice(s)
            </div>
          </div>
        </div>

        {/* INVOICE TABLE */}
        <InvoiceTable
          invoices={filteredInvoices}
          onView={(invoice) => setSelectedInvoice(invoice)}
          onPrint={handlePrint}
        />

        {/* INVOICE PREVIEW MODAL */}
        {selectedInvoice && (
          <InvoicePreview
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onPrint={(inv, mode) => {
              handlePrint(inv, mode);
            }}
          />
        )}
      </div>
    </>
  );
}
