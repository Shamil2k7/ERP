"use client";

import React from "react";
import { FiEye, FiPrinter, FiFileText } from "react-icons/fi";

export default function InvoiceTable({ invoices = [], onView, onPrint }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        overflowX: "auto",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
        <thead>
          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Invoice Number
            </th>
            <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Customer
            </th>
            <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Date
            </th>
            <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Reference / Order #
            </th>
            <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>
              Total Amount
            </th>
            <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>
              Payment Status
            </th>
            <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>
              Invoice Status
            </th>
            <th style={{ padding: "14px 18px", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: "48px 20px", color: "#64748b" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <FiFileText size={32} style={{ color: "#cbd5e1" }} />
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>No invoices found.</span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>New sales and POS transactions will generate invoices automatically.</span>
                </div>
              </td>
            </tr>
          ) : (
            invoices.map((invoice) => {
              const invoiceNumber = invoice.invoiceNumber || invoice.invoiceNo || invoice.orderNumber || "INV-N/A";
              const customerName = invoice.customerName || invoice.customer || "Walk-in Customer";
              const dateStr = invoice.date || (invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : (invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : "—"));
              const refNumber = invoice.referenceNumber || invoice.salesOrderNumber || invoice.orderNumber || invoiceNumber;
              const totalAmount = Number(invoice.totalAmount ?? invoice.total ?? invoice.netAmount ?? 0);

              const paymentStatus = (invoice.paymentStatus || (invoice.status === "COMPLETED" ? "PAID" : "PENDING")).toUpperCase();
              const isPaid = paymentStatus === "PAID";
              const isPending = paymentStatus === "PENDING";
              const invoiceStatus = (invoice.status || "ISSUED").toUpperCase();

              return (
                <tr
                  key={invoice.id}
                  style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "14px 18px", fontWeight: "800", color: "#0f172a", whiteSpace: "nowrap" }}>
                    <span style={{ color: "#2563eb" }}>{invoiceNumber}</span>
                  </td>
                  <td style={{ padding: "14px 18px", fontWeight: "600", color: "#334155", whiteSpace: "nowrap" }}>
                    {customerName}
                  </td>
                  <td style={{ padding: "14px 18px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {dateStr}
                  </td>
                  <td style={{ padding: "14px 18px", color: "#475569", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "12px" }}>
                    {refNumber}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right", fontWeight: "800", color: "#0f172a", whiteSpace: "nowrap" }}>
                    ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "center", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "800",
                        backgroundColor: isPaid ? "#dcfce7" : isPending ? "#fef3c7" : "#fee2e2",
                        color: isPaid ? "#15803d" : isPending ? "#b45309" : "#b91c1c",
                      }}
                    >
                      {paymentStatus}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "center", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "800",
                        backgroundColor: "#eff6ff",
                        color: "#1e40af",
                      }}
                    >
                      {invoiceStatus}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "center", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => onView(invoice)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #bfdbfe",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#2563eb";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#eff6ff";
                          e.currentTarget.style.color = "#2563eb";
                        }}
                        title="View and Preview Invoice"
                      >
                        <FiEye size={13} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrint(invoice, "A4")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          backgroundColor: "#f8fafc",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#0f172a";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8fafc";
                          e.currentTarget.style.color = "#334155";
                        }}
                        title="Print Standard A4 Invoice"
                      >
                        <FiPrinter size={13} />
                        <span>Print</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
