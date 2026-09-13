"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiPrinter, FiUser, FiCalendar, FiFileText, FiDollarSign, FiPhone, FiMail, FiMapPin, FiLoader } from "react-icons/fi";
import { useCompany } from "@/context/CompanyContext";
import { useSettings } from "@/context/SettingsContext";
import apiClient from "@/services/apiClient";

export default function InvoicePreview({ invoice, onClose, onPrint }) {
  const { company } = useCompany();
  const { settings } = useSettings();

  const [detailedInvoice, setDetailedInvoice] = useState(invoice);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    // If invoice items are empty, fetch full details from backend
    if (invoice?.id && (!invoice.items || invoice.items.length === 0)) {
      setLoadingDetails(true);
      apiClient
        .get(`/invoices/${invoice.id}`)
        .then((res) => {
          if (res.data?.data) {
            setDetailedInvoice((prev) => ({
              ...prev,
              ...res.data.data,
            }));
          }
        })
        .catch((err) => {
          console.warn("Could not fetch full invoice details:", err);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    } else {
      setDetailedInvoice(invoice);
    }
  }, [invoice?.id]);

  if (!invoice) return null;

  const current = detailedInvoice || invoice;

  const companyName = company?.name || settings?.companyName || "Retail ERP Enterprise";
  const companyPhone = company?.phone || settings?.companyPhone || "";
  const companyAddress = company?.address || settings?.companyAddress || "";
  const companyEmail = company?.email || settings?.companyEmail || "";

  const invoiceNumber = current.invoiceNumber || current.invoiceNo || current.orderNumber || "INV-N/A";
  const invoiceDate = current.date || (current.invoiceDate ? new Date(current.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString());
  const referenceNumber = current.referenceNumber || current.salesOrderNumber || current.orderNumber || invoiceNumber;
  const customerName = current.customerName || current.customer || "Walk-in Customer";
  const customerPhone = current.customerPhone || "";
  const customerEmail = current.customerEmail || "";
  const customerAddress = current.customerAddress || "";

  const subtotalVal = Number(current.subtotal ?? current.subTotal ?? 0);
  const discountVal = Number(current.discountAmount ?? current.discount ?? 0);
  const taxVal = Number(current.taxAmount ?? current.tax ?? 0);
  const totalVal = Number(current.totalAmount ?? current.total ?? current.netAmount ?? (subtotalVal + taxVal - discountVal));
  const paidVal = Number(current.paidAmount ?? totalVal);
  const balanceVal = Number(current.balanceAmount ?? Math.max(0, totalVal - paidVal));

  const paymentStatus = (current.paymentStatus || (current.status === "COMPLETED" ? "PAID" : "PENDING")).toUpperCase();
  const paymentMethod = (current.paymentMethod || "Cash").toUpperCase();
  const invoiceStatus = (current.status || "ISSUED").toUpperCase();

  const isPaid = paymentStatus === "PAID";
  const isPending = paymentStatus === "PENDING";

  const items = Array.isArray(current.items) && current.items.length > 0 ? current.items : [];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiFileText size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                Invoice Details
              </h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
                {invoiceNumber} {referenceNumber !== invoiceNumber && `(Ref: ${referenceNumber})`}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "800",
                backgroundColor: isPaid ? "#dcfce7" : isPending ? "#fef3c7" : "#fee2e2",
                color: isPaid ? "#15803d" : isPending ? "#b45309" : "#b91c1c",
              }}
            >
              {paymentStatus}
            </span>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e2e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {loadingDetails && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563eb", fontSize: "12px", fontWeight: "600" }}>
              <FiLoader className="animate-spin" />
              <span>Fetching complete line items...</span>
            </div>
          )}

          {/* BRAND & INVOICE META */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "16px",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "900", color: "#1e3a8a", textTransform: "uppercase" }}>
                {companyName}
              </h3>
              {companyAddress && <p style={{ margin: "2px 0", color: "#64748b", fontSize: "12px" }}>{companyAddress}</p>}
              <p style={{ margin: "2px 0", color: "#64748b", fontSize: "12px" }}>
                {companyPhone && `Tel: ${companyPhone}`} {companyEmail && `| ${companyEmail}`}
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase" }}>
                INVOICE NUMBER
              </span>
              <div style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", marginTop: "2px" }}>
                {invoiceNumber}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                <FiCalendar size={13} />
                <span>Date: {invoiceDate}</span>
              </div>
            </div>
          </div>

          {/* CUSTOMER & PAYMENT GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              background: "#f8fafc",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div>
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                BILLED TO:
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>
                <FiUser size={15} style={{ color: "#2563eb" }} />
                <span>{customerName}</span>
              </div>
              {customerPhone && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", color: "#475569", fontSize: "12px" }}>
                  <FiPhone size={13} />
                  <span>{customerPhone}</span>
                </div>
              )}
              {customerEmail && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", color: "#475569", fontSize: "12px" }}>
                  <FiMail size={13} />
                  <span>{customerEmail}</span>
                </div>
              )}
              {customerAddress && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px", color: "#475569", fontSize: "12px" }}>
                  <FiMapPin size={13} />
                  <span>{customerAddress}</span>
                </div>
              )}
            </div>

            <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                PAYMENT & ORDER DETAILS:
              </span>
              <div style={{ marginTop: "6px", fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div>Payment Method: <strong>{paymentMethod}</strong></div>
                <div>Invoice Status: <strong style={{ color: "#1e3a8a" }}>{invoiceStatus}</strong></div>
                {referenceNumber !== invoiceNumber && (
                  <div>Reference / SO: <strong>{referenceNumber}</strong></div>
                )}
              </div>
            </div>
          </div>

          {/* ITEM TABLE */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>Item Description</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#64748b", fontSize: "11px", textTransform: "uppercase", textAlign: "center", width: "60px" }}>Qty</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#64748b", fontSize: "11px", textTransform: "uppercase", textAlign: "right", width: "110px" }}>Price</th>
                  <th style={{ padding: "10px 14px", fontWeight: "700", color: "#64748b", fontSize: "11px", textTransform: "uppercase", textAlign: "right", width: "120px" }}>Total</th>
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
                      `Retail Item #${idx + 1}`;

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
                    const price = Number(item.unitPrice || item.price || 0);
                    const total = Number(item.total || item.totalPrice || qty * price);

                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                          <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "13.5px" }}>
                            {name}
                          </div>
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
                        <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "top", color: "#334155" }}>
                          ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", verticalAlign: "top", fontWeight: "800", color: "#0f172a" }}>
                          ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "#64748b", background: "#f8fafc" }}>
                      <div style={{ fontWeight: "600", color: "#334155" }}>Store Sales Order Transaction</div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Amount: ₹{totalVal.toFixed(2)}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTALS SUMMARY */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "300px", background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569" }}>
                <span>Subtotal:</span>
                <strong>₹{subtotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>

              {discountVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#ef4444" }}>
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

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: "900",
                  color: "#2563eb",
                  borderTop: "1px solid #cbd5e1",
                  paddingTop: "8px",
                  marginTop: "4px",
                }}
              >
                <span>Grand Total:</span>
                <span>₹{totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#16a34a" }}>
                <span>Paid Amount:</span>
                <strong>₹{paidVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>

              {balanceVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#dc2626" }}>
                  <span>Balance Due:</span>
                  <strong>₹{balanceVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Close
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => onPrint(current, "THERMAL")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#1e293b",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
              <FiPrinter size={15} />
              <span>Print Thermal Receipt (80mm)</span>
            </button>

            <button
              type="button"
              onClick={() => onPrint(current, "A4")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 18px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
            >
              <FiPrinter size={15} />
              <span>Print Tax Invoice (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
