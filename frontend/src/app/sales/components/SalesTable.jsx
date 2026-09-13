"use client";

import Link from "next/link";

export default function SalesTable({ sales = [] }) {
  return (
    <div className="tableWrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Order Number</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Branch</th>
            <th style={{ textAlign: "right" }}>Total Amount</th>
            <th style={{ textAlign: "center" }}>Payment Status</th>
            <th style={{ textAlign: "center" }}>Order Status</th>
            <th style={{ textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: "40px 0", color: "#64748b", fontWeight: "500" }}>
                No sales orders found.
              </td>
            </tr>
          )}

          {sales.map((sale) => {
            const statusClass =
              sale.paymentStatus === "Paid"
                ? "paidStatus"
                : sale.paymentStatus === "Pending"
                ? "pendingStatus"
                : "cancelledStatus";

            return (
              <tr key={sale.id}>
                <td style={{ fontWeight: "700", color: "#1f344d" }}>
                  {sale.orderNumber || sale.invoiceNo}
                </td>
                <td style={{ fontWeight: "600" }}>{sale.customer}</td>
                <td>{sale.date}</td>
                <td>{sale.branch || "Main Branch"}</td>
                <td style={{ textAlign: "right", fontWeight: "700", color: "#1f344d" }}>
                  ₹{Number(sale.totalAmount ?? sale.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={statusClass}>
                    {sale.paymentStatus}
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "3px 9px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    backgroundColor: sale.orderStatus === "CANCELLED" ? "#fee2e2" : "#e0e7ff",
                    color: sale.orderStatus === "CANCELLED" ? "#dc2626" : "#3730a3"
                  }}>
                    {sale.orderStatus || "CONFIRMED"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Link
                      href={`/sales/${sale.id}`}
                      className="viewButton"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}