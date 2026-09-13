"use client";

export default function SalesCard({ sale }) {
  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const paymentStatusClass = (sale.paymentStatus || "").toLowerCase();

  return (
    <div className="sales-card-container">
      {/* LOCAL CSS STYLES SHEET */}
      <style>{`
        .sales-card-container {
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
          padding: 24px;
          border: 1px solid #e2e8f0;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .sales-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 16px;
        }

        .sales-card-number {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }

        .sales-card-date {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .sales-status-badge {
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: inline-block;
        }

        .sales-status-badge.paid {
          color: #16a34a;
          background-color: #dcfce7;
        }

        .sales-status-badge.pending {
          color: #dc2626;
          background-color: #fee2e2;
        }

        .sales-status-badge.cancelled {
          color: #4b5563;
          background-color: #e5e7eb;
        }

        .sales-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
          background-color: #f8fafc;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }

        .sales-grid-label {
          margin: 0 0 6px 0;
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sales-grid-value {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .sales-items-wrapper {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .sales-items-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .sales-items-table th {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 16px;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sales-items-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }

        .sales-totals-section {
          display: flex;
          justify-content: flex-end;
        }

        .sales-totals-card {
          width: 280px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background-color: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }

        .sales-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #475569;
        }

        .sales-total-row.grand-total {
          border-top: 1px solid #e2e8f0;
          margin-top: 6px;
          padding-top: 10px;
          align-items: center;
        }
      `}</style>

      {/* Header section */}
      <div className="sales-card-header">
        <div>
          <h2 className="sales-card-number">{sale.invoiceNo}</h2>
          <p className="sales-card-date">{sale.date}</p>
        </div>
        <span className={`sales-status-badge ${paymentStatusClass}`}>
          {sale.paymentStatus}
        </span>
      </div>

      {/* Info grid */}
      <div className="sales-details-grid">
        <div>
          <h3 className="sales-grid-label">Customer</h3>
          <p className="sales-grid-value">{sale.customer}</p>
        </div>
        <div>
          <h3 className="sales-grid-label">Cashier</h3>
          <p className="sales-grid-value">{sale.cashier}</p>
        </div>
        <div>
          <h3 className="sales-grid-label">Payment</h3>
          <p className="sales-grid-value">{sale.paymentMethod}</p>
        </div>
      </div>

      {/* Table */}
      <div className="sales-items-wrapper">
        <table className="sales-items-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Product</th>
              <th style={{ textAlign: "center", width: "80px" }}>Qty</th>
              <th style={{ textAlign: "right", width: "120px" }}>Price</th>
              <th style={{ textAlign: "right", width: "140px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => {
              const qty = Number(item.qty || 1);
              const price = Number(item.price || 0);
              const total = qty * price;
              return (
                <tr key={index}>
                  <td style={{ fontWeight: 600, color: "#1e293b" }}>
                    {item.product || item.productName || "Walk-in Product"}
                  </td>
                  <td style={{ textAlign: "center" }}>{qty}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(price)}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="sales-totals-section">
        <div className="sales-totals-card">
          <div className="sales-total-row">
            <span>Subtotal</span>
            <strong style={{ color: "#1e293b" }}>{formatCurrency(sale.subTotal)}</strong>
          </div>
          <div className="sales-total-row" style={{ color: "#ef4444" }}>
            <span>Discount</span>
            <strong>- {formatCurrency(sale.discount)}</strong>
          </div>
          <div className="sales-total-row">
            <span>Tax</span>
            <strong style={{ color: "#1e293b" }}>{formatCurrency(sale.tax)}</strong>
          </div>
          <div className="sales-total-row grand-total">
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Grand Total</span>
            <strong style={{ fontSize: "18px", fontWeight: 900, color: "#2563eb" }}>
              {formatCurrency(sale.total)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}