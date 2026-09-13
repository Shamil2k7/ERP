"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPrinter, FiFileText, FiCalendar, FiUser, FiMapPin, FiPhone, FiMail, FiLoader } from "react-icons/fi";
import apiClient from "@/services/apiClient";
import { useCompany } from "@/context/CompanyContext";
import { useSettings } from "@/context/SettingsContext";
import PrintInvoice from "../components/PrintInvoice";

export default function InvoiceDetailPage({ params }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { id } = resolvedParams;

  const { company } = useCompany();
  const { settings } = useSettings();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [printState, setPrintState] = useState({ invoice: null, mode: "A4" });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");

    apiClient
      .get(`/invoices/${id}`)
      .then((res) => {
        if (res.data?.data) {
          setInvoice(res.data.data);
        } else {
          throw new Error("Invoice not found");
        }
      })
      .catch((err) => {
        // Fallback check in sales
        apiClient
          .get(`/sales/${id}`)
          .then((salesRes) => {
            if (salesRes.data?.data) {
              const s = salesRes.data.data;
              const total = Number(s.netAmount || s.totalAmount || 0);
              setInvoice({
                id: s.id,
                invoiceNumber: `INV-${(s.orderNumber || "").replace(/^SO-/, "")}`,
                invoiceNo: `INV-${(s.orderNumber || "").replace(/^SO-/, "")}`,
                customerName: s.customerName || "Walk-in Customer",
                customerPhone: s.customerPhone || "",
                date: s.orderDate ? new Date(s.orderDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                totalAmount: total,
                subtotal: Number(s.totalAmount || total),
                discountAmount: Number(s.discountAmount || 0),
                taxAmount: Number(s.taxAmount || 0),
                paidAmount: total,
                balanceAmount: 0,
                paymentStatus: s.status === "COMPLETED" ? "PAID" : "PENDING",
                items: s.items || [],
              });
            } else {
              setError(err.message || "Failed to load invoice details");
            }
          })
          .catch(() => {
            setError(err.message || "Invoice details not found.");
          });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handlePrint = (mode = "A4") => {
    setPrintState({ invoice, mode });
  };

  const handleAfterPrint = () => {
    setTimeout(() => {
      setPrintState({ invoice: null, mode: "A4" });
    }, 1000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", background: "#f8fafc" }}>
        <FiLoader size={30} style={{ color: "#2563eb", animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "16px", fontWeight: "700", color: "#64748b" }}>Loading Invoice #{id}...</span>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ padding: "40px 24px", minHeight: "80vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #fee2e2", maxWidth: "480px", width: "100%", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <h2 style={{ color: "#b91c1c", margin: "0 0 8px 0" }}>Invoice Not Found</h2>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>{error || `Unable to locate invoice record for "${id}".`}</p>
          <Link
            href="/invoices"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 20px",
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "13px",
            }}
          >
            <FiArrowLeft size={16} />
            <span>Return to Invoices List</span>
          </Link>
        </div>
      </div>
    );
  }

  const companyName = company?.name || settings?.companyName || "Retail ERP Enterprise";
  const companyPhone = company?.phone || settings?.companyPhone || "";
  const companyAddress = company?.address || settings?.companyAddress || "";

  const subtotalVal = Number(invoice.subtotal ?? invoice.subTotal ?? 0);
  const discountVal = Number(invoice.discountAmount ?? invoice.discount ?? 0);
  const taxVal = Number(invoice.taxAmount ?? invoice.tax ?? 0);
  const totalVal = Number(invoice.totalAmount ?? invoice.total ?? invoice.netAmount ?? (subtotalVal + taxVal - discountVal));
  const paidVal = Number(invoice.paidAmount ?? totalVal);
  const balanceVal = Number(invoice.balanceAmount ?? Math.max(0, totalVal - paidVal));

  const items = Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [];
  const paymentStatus = (invoice.paymentStatus || (invoice.status === "COMPLETED" ? "PAID" : "PENDING")).toUpperCase();
  const isPaid = paymentStatus === "PAID";

  return (
    <>
      {printState.invoice && (
        <PrintInvoice
          invoice={printState.invoice}
          mode={printState.mode}
          onAfterPrint={handleAfterPrint}
        />
      )}

      <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh", boxSizing: "border-box" }}>
        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <button
            type="button"
            onClick={() => router.push("/invoices")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <FiArrowLeft size={16} />
            <span>Back to Invoices</span>
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => handlePrint("THERMAL")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#1e293b",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <FiPrinter size={15} />
              <span>Print 80mm Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrint("A4")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "10px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
              }}
            >
              <FiPrinter size={15} />
              <span>Print Tax Invoice (A4)</span>
            </button>
          </div>
        </div>

        {/* INVOICE CARD */}
        <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)", maxWidth: "860px", margin: "0 auto", padding: "32px" }}>
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #2563eb", paddingBottom: "20px", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "900", color: "#1e3a8a", textTransform: "uppercase" }}>{companyName}</h1>
              {companyAddress && <p style={{ margin: "2px 0", color: "#64748b", fontSize: "13px" }}>{companyAddress}</p>}
              {companyPhone && <p style={{ margin: "2px 0", color: "#64748b", fontSize: "13px" }}>Tel: {companyPhone}</p>}
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ display: "inline-block", background: "#2563eb", color: "#ffffff", padding: "4px 14px", borderRadius: "4px", fontWeight: "800", fontSize: "13px", textTransform: "uppercase", marginBottom: "8px" }}>
                COMMERCIAL INVOICE
              </div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>#{invoice.invoiceNumber || invoice.invoiceNo || invoice.id}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Date: {invoice.date || (invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString())}</div>
            </div>
          </div>

          {/* CUSTOMER & PAYMENT GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>BILLED TO:</span>
              <h3 style={{ margin: "4px 0 2px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{invoice.customerName || invoice.customer || "Walk-in Customer"}</h3>
              {invoice.customerPhone && <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>Phone: {invoice.customerPhone}</div>}
              {invoice.customerAddress && <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>Address: {invoice.customerAddress}</div>}
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>STATUS:</span>
              <div style={{ marginTop: "4px" }}>
                <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "800", backgroundColor: isPaid ? "#dcfce7" : "#fef3c7", color: isPaid ? "#15803d" : "#b45309" }}>
                  {paymentStatus}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "6px" }}>Method: <strong>{invoice.paymentMethod || "Cash"}</strong></div>
            </div>
          </div>

          {/* ITEM TABLE */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#1e3a8a", color: "#ffffff", textAlign: "left" }}>
                <th style={{ padding: "10px 14px", width: "40px", textAlign: "center" }}>#</th>
                <th style={{ padding: "10px 14px" }}>Item Description</th>
                <th style={{ padding: "10px 14px", textAlign: "center", width: "70px" }}>Qty</th>
                <th style={{ padding: "10px 14px", textAlign: "right", width: "110px" }}>Unit Price</th>
                <th style={{ padding: "10px 14px", textAlign: "right", width: "120px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, idx) => {
                  const name =
                    (typeof item.product === "string" ? item.product : item.product?.name) ||
                    item.productName ||
                    item.name ||
                    item.title ||
                    (typeof item.productId === "object" ? item.productId?.name : null) ||
                    `Item #${idx + 1}`;

                  const description =
                    item.description ||
                    item.desc ||
                    (typeof item.product === "object" ? item.product?.description : null) ||
                    item.productDescription ||
                    item.notes ||
                    "";

                  const sku = item.sku || (typeof item.product === "object" ? item.product?.sku : "") || "";
                  const barcode = item.barcode || (typeof item.product === "object" ? item.product?.barcode : "") || "";
                  const category = item.categoryName || item.category || (typeof item.product === "object" ? item.product?.category?.name : "") || "";

                  const qty = Number(item.quantity || item.qty || 1);
                  const rate = Number(item.unitPrice || item.price || 0);
                  const total = Number(item.total || item.totalPrice || qty * rate);

                  return (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "top" }}>{idx + 1}</td>
                      <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "13.5px" }}>{name}</div>
                        {description && (
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px", lineHeight: "1.4" }}>
                            {description}
                          </div>
                        )}
                        {(sku || barcode || category) && (
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "5px" }}>
                            {sku && (
                              <span style={{ fontSize: "10.5px", background: "#f1f5f9", color: "#475569", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                                SKU: {sku}
                              </span>
                            )}
                            {barcode && (
                              <span style={{ fontSize: "10.5px", background: "#eff6ff", color: "#2563eb", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                                Barcode: {barcode}
                              </span>
                            )}
                            {category && (
                              <span style={{ fontSize: "10.5px", background: "#fdf2f8", color: "#db2777", padding: "1px 6px", borderRadius: "4px", fontWeight: "600" }}>
                                {category}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", verticalAlign: "top", color: "#334155", fontWeight: "600" }}>{qty}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "top", color: "#334155" }}>₹{rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "top", fontWeight: "800", color: "#0f172a" }}>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#64748b", background: "#f8fafc" }}>
                    <div style={{ fontWeight: "600", color: "#334155" }}>1x Store Retail Sale Transaction</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Amount: ₹{totalVal.toFixed(2)}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* TOTALS SUMMARY */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "300px", background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
                <span>Subtotal:</span>
                <strong>₹{subtotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>

              {discountVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#dc2626" }}>
                  <span>Discount:</span>
                  <strong>- ₹{discountVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              )}

              {taxVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
                  <span>Tax / GST:</span>
                  <strong>₹{taxVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "900", color: "#1e3a8a", borderTop: "2px solid #0f172a", paddingTop: "10px", marginTop: "4px" }}>
                <span>Grand Total:</span>
                <span>₹{totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#16a34a" }}>
                <span>Amount Paid:</span>
                <strong>₹{paidVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>

              {balanceVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#dc2626" }}>
                  <span>Balance Due:</span>
                  <strong>₹{balanceVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
