"use client";

import React, { useEffect } from "react";
import { useCompany } from "@/context/CompanyContext";
import { useSettings } from "@/context/SettingsContext";

export default function PrintInvoice({ invoice, mode = "A4", onAfterPrint }) {
  const { company } = useCompany();
  const { settings } = useSettings();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
      if (onAfterPrint) onAfterPrint();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  if (!invoice) return null;

  const companyName = company?.name || settings?.companyName || "RETAIL ERP ENTERPRISE";
  const companyPhone = company?.phone || settings?.companyPhone || "";
  const companyAddress = company?.address || settings?.companyAddress || "";
  const companyEmail = company?.email || settings?.companyEmail || "";
  const taxId = company?.taxNumber || settings?.taxNumber || company?.gstin || "GSTIN-RETAIL-001";

  const invoiceNumber = invoice.invoiceNumber || invoice.invoiceNo || invoice.orderNumber || "INV-0000";
  const invoiceDate = invoice.date || (invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString());
  const referenceNumber = invoice.referenceNumber || invoice.salesOrderNumber || invoice.orderNumber || invoiceNumber;
  const customerName = invoice.customerName || invoice.customer || "Walk-in Customer";
  const customerPhone = invoice.customerPhone || "";
  const customerAddress = invoice.customerAddress || "";

  const items = Array.isArray(invoice.items) && invoice.items.length > 0 ? invoice.items : [];

  const subtotalVal = Number(invoice.subtotal ?? invoice.subTotal ?? 0);
  const discountVal = Number(invoice.discountAmount ?? invoice.discount ?? 0);
  const taxVal = Number(invoice.taxAmount ?? invoice.tax ?? 0);
  const totalVal = Number(invoice.totalAmount ?? invoice.total ?? invoice.netAmount ?? (subtotalVal + taxVal - discountVal));
  const paidVal = Number(invoice.paidAmount ?? totalVal);
  const balanceVal = Number(invoice.balanceAmount ?? Math.max(0, totalVal - paidVal));

  const paymentStatus = (invoice.paymentStatus || (invoice.status === "COMPLETED" ? "PAID" : "PENDING")).toUpperCase();
  const paymentMethod = (invoice.paymentMethod || "CASH").toUpperCase();

  return (
    <>
      <style>{`
        @media screen {
          #printable-invoice-root {
            display: none !important;
          }
        }

        @media print {
          /* Reset root display for isolated printing */
          body * {
            visibility: hidden !important;
          }

          #printable-invoice-root,
          #printable-invoice-root * {
            visibility: visible !important;
          }

          #printable-invoice-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            margin: 8mm;
            size: auto;
          }
        }
      `}</style>

      <div id="printable-invoice-root">
        {mode === "THERMAL" ? (
          /* =========================================================================
             THERMAL 80MM RECEIPT FORMAT
             ========================================================================= */
          <div
            style={{
              width: "76mm",
              margin: "0 auto",
              padding: "10px",
              fontFamily: "monospace",
              fontSize: "12px",
              lineHeight: "1.4",
              color: "#000000",
              background: "#ffffff",
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "900", textTransform: "uppercase" }}>
                {companyName}
              </h2>
              {companyAddress && <p style={{ margin: "2px 0", fontSize: "10px" }}>{companyAddress}</p>}
              {companyPhone && <p style={{ margin: "2px 0", fontSize: "10px" }}>Tel: {companyPhone}</p>}
              <div
                style={{
                  margin: "8px 0",
                  padding: "4px 0",
                  borderTop: "1px dashed #000",
                  borderBottom: "1px dashed #000",
                  fontWeight: "bold",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Retail Sales Receipt
              </div>
            </div>

            {/* Meta */}
            <div style={{ fontSize: "11px", marginBottom: "8px", borderBottom: "1px dashed #000", paddingBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Invoice No:</span>
                <strong>{invoiceNumber}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Date:</span>
                <span>{invoiceDate}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Customer:</span>
                <span>{customerName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Payment:</span>
                <span>{paymentMethod} ({paymentStatus})</span>
              </div>
            </div>

            {/* Items */}
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", marginBottom: "8px" }}>
              <thead>
                <tr style={{ borderBottom: "1px dashed #000", textAlign: "left" }}>
                  <th style={{ padding: "4px 0" }}>Item</th>
                  <th style={{ padding: "4px 0", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "4px 0", textAlign: "right" }}>Rate</th>
                  <th style={{ padding: "4px 0", textAlign: "right" }}>Total</th>
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
                    const qty = Number(item.quantity || item.qty || 1);
                    const rate = Number(item.unitPrice || item.price || 0);
                    const total = Number(item.total || item.totalPrice || qty * rate);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px dotted #ccc" }}>
                        <td style={{ padding: "4px 0", fontWeight: "bold" }}>
                          <div>{name}</div>
                          {item.sku && <div style={{ fontSize: "9px", color: "#666" }}>SKU: {item.sku}</div>}
                        </td>
                        <td style={{ padding: "4px 0", textAlign: "center" }}>{qty}</td>
                        <td style={{ padding: "4px 0", textAlign: "right" }}>₹{rate.toFixed(2)}</td>
                        <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "bold" }}>₹{total.toFixed(2)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "8px 0" }}>
                      1x General Retail Sale (₹{totalVal.toFixed(2)})
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ fontSize: "11px", borderTop: "1px dashed #000", paddingTop: "6px", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal:</span>
                <span>₹{subtotalVal.toFixed(2)}</span>
              </div>
              {discountVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Discount:</span>
                  <span>- ₹{discountVal.toFixed(2)}</span>
                </div>
              )}
              {taxVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tax / GST:</span>
                  <span>₹{taxVal.toFixed(2)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  fontWeight: "900",
                  marginTop: "6px",
                  paddingTop: "4px",
                  borderTop: "1px solid #000",
                }}
              >
                <span>GRAND TOTAL:</span>
                <span>₹{totalVal.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
                <span>Amount Paid:</span>
                <span>₹{paidVal.toFixed(2)}</span>
              </div>
              {balanceVal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "red" }}>
                  <span>Balance Due:</span>
                  <span>₹{balanceVal.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", fontSize: "10px", marginTop: "16px", borderTop: "1px dashed #000", paddingTop: "8px" }}>
              <p style={{ margin: "2px 0", fontWeight: "bold" }}>THANK YOU FOR YOUR VISIT!</p>
              <p style={{ margin: "2px 0", color: "#555" }}>Please retain receipt for exchange within 7 days.</p>
            </div>
          </div>
        ) : (
          <div
            style={{
              maxWidth: "210mm",
              margin: "0 auto",
              padding: "24px",
              color: "#0f172a",
              background: "#ffffff",
              fontSize: "13px",
              lineHeight: "1.5",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "2px solid #2563eb",
                paddingBottom: "16px",
                marginBottom: "20px",
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "900", color: "#1e3a8a", textTransform: "uppercase" }}>
                  {companyName}
                </h1>
                {companyAddress && <p style={{ margin: "2px 0", color: "#475569" }}>{companyAddress}</p>}
                <p style={{ margin: "2px 0", color: "#475569" }}>
                  {companyPhone && `Tel: ${companyPhone}`} {companyEmail && `| ${companyEmail}`}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontWeight: "800",
                    borderRadius: "6px",
                    fontSize: "12px",
                    letterSpacing: "1px",
                  }}
                >
                  TAX INVOICE
                </span>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginTop: "6px" }}>
                  {invoiceNumber}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Date: {invoiceDate}</div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                marginBottom: "24px",
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                  BILL TO:
                </span>
                <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a", marginTop: "4px" }}>
                  {customerName}
                </div>
                {customerPhone && <div style={{ color: "#475569", fontSize: "12px", marginTop: "2px" }}>Phone: {customerPhone}</div>}
                {customerEmail && <div style={{ color: "#475569", fontSize: "12px" }}>Email: {customerEmail}</div>}
                {customerAddress && <div style={{ color: "#475569", fontSize: "12px" }}>Address: {customerAddress}</div>}
              </div>

              <div style={{ borderLeft: "1px solid #e2e8f0", paddingLeft: "16px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                  PAYMENT SUMMARY:
                </span>
                <div style={{ marginTop: "4px", fontSize: "12px", color: "#334155", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div>Payment Status: <strong style={{ color: isPaid ? "#16a34a" : isPending ? "#d97706" : "#dc2626" }}>{paymentStatus}</strong></div>
                  <div>Payment Method: <strong>{paymentMethod}</strong></div>
                  {referenceNumber !== invoiceNumber && <div>Sales Order / Ref: <strong>{referenceNumber}</strong></div>}
                </div>
              </div>
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "20px",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr style={{ background: "#1e3a8a", color: "#ffffff", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", border: "1px solid #1e3a8a", width: "40px", textAlign: "center" }}>#</th>
                  <th style={{ padding: "10px 12px", border: "1px solid #1e3a8a" }}>Item Description</th>
                  <th style={{ padding: "10px 12px", border: "1px solid #1e3a8a", textAlign: "center", width: "70px" }}>Qty</th>
                  <th style={{ padding: "10px 12px", border: "1px solid #1e3a8a", textAlign: "right", width: "110px" }}>Unit Price</th>
                  <th style={{ padding: "10px 12px", border: "1px solid #1e3a8a", textAlign: "right", width: "120px" }}>Total Amount</th>
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
                    const rate = Number(item.unitPrice || item.price || 0);
                    const total = Number(item.total || item.totalPrice || qty * rate);

                    return (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                        <td style={{ padding: "10px 12px", border: "1px solid #e2e8f0", textAlign: "center", verticalAlign: "top" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 12px", border: "1px solid #e2e8f0", verticalAlign: "top" }}>
                          <div style={{ fontWeight: "700", color: "#0f172a" }}>{name}</div>
                          {description && (
                            <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px" }}>
                              {description}
                            </div>
                          )}
                          {(sku || barcode || category) && (
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                              {sku && <span style={{ fontSize: "10px", color: "#475569", background: "#f1f5f9", padding: "1px 5px", borderRadius: "3px" }}>SKU: {sku}</span>}
                              {barcode && <span style={{ fontSize: "10px", color: "#2563eb", background: "#eff6ff", padding: "1px 5px", borderRadius: "3px" }}>Barcode: {barcode}</span>}
                              {category && <span style={{ fontSize: "10px", color: "#db2777", background: "#fdf2f8", padding: "1px 5px", borderRadius: "3px" }}>{category}</span>}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", border: "1px solid #e2e8f0", textAlign: "center", verticalAlign: "top" }}>{qty}</td>
                        <td style={{ padding: "10px 12px", border: "1px solid #e2e8f0", textAlign: "right", verticalAlign: "top" }}>
                          ₹{rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: "10px 12px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "700", verticalAlign: "top" }}>
                          ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td style={{ padding: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px", border: "1px solid #e2e8f0", fontWeight: "600" }}>
                      Store Sales Order ({invoiceNumber})
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>1</td>
                    <td style={{ padding: "12px", border: "1px solid #e2e8f0", textAlign: "right" }}>
                      ₹{subtotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #e2e8f0", textAlign: "right", fontWeight: "700" }}>
                      ₹{subtotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "30px" }}>
              <div style={{ flex: 1, padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <strong style={{ fontSize: "12px", color: "#334155" }}>Terms & Notes:</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                  Goods once sold cannot be returned without original cash receipt. All disputes subject to local jurisdiction.
                </p>
              </div>

              <div style={{ width: "300px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>Subtotal:</span>
                  <strong>₹{subtotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>

                {discountVal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "13px", color: "#dc2626" }}>
                    <span>Discount:</span>
                    <strong>- ₹{discountVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                )}

                {taxVal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "13px" }}>
                    <span style={{ color: "#64748b" }}>Tax / GST:</span>
                    <strong>₹{taxVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0 4px 0",
                    borderTop: "2px solid #0f172a",
                    marginTop: "6px",
                    fontSize: "16px",
                    fontWeight: "900",
                    color: "#1e3a8a",
                  }}
                >
                  <span>Grand Total:</span>
                  <span>₹{totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "13px", color: "#16a34a" }}>
                  <span>Amount Paid:</span>
                  <strong>₹{paidVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>

                {balanceVal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "13px", color: "#dc2626" }}>
                    <span>Balance Due:</span>
                    <strong>₹{balanceVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* SIGNATURE SECTION */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                Computer Generated Invoice — Valid without Physical Seal
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: "160px", borderBottom: "1px solid #0f172a", marginBottom: "4px" }}></div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155" }}>Authorized Signatory</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
