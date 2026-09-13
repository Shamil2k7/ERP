"use client";

import Link from "next/link";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function PurchaseTable({ purchases = [], onDelete, readOnly = false }) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>Purchase ID</th>
            <th>Supplier</th>
            <th>Products Count</th>
            <th>Total Qty</th>
            <th>Total Amount</th>
            <th>Phone</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {purchases.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                style={{ textAlign: "center", padding: "40px", color: "#8a99aa" }}
              >
                No purchase orders found.
              </td>
            </tr>
          ) : (
            purchases.map((item) => {
              const statusLower = (item.status || "PENDING").toLowerCase();

              const isReceived =
                statusLower === "received" ||
                statusLower === "completed" ||
                statusLower === "delivered";

              return (
                <tr key={item.id}>
                  <td style={{ color: "#2563eb", fontWeight: 600 }}>
                    {item.purchaseNo || "—"}
                  </td>
                  <td style={{ color: "#17304b", fontWeight: 600 }}>
                    {item.supplier || "—"}
                  </td>
                  <td>{item.totalProducts || 0} items</td>
                  <td>{item.totalQty || 0}</td>
                  <td style={{ fontWeight: 700, color: "#17304b" }}>
                    ₹{Number(item.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td>{item.phone || "—"}</td>
                  <td>
                    <span
                      className={
                        isReceived ? "activeStatus" : "pendingStatus"
                      }
                    >
                      {item.status || "PENDING"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Link
                        href={`/purchases/${item.id}`}
                        style={{
                          width: "32px",
                          height: "32px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#ffffff",
                          color: "#557089",
                          border: "1px solid #dfe5eb",
                          borderRadius: "6px",
                        }}
                        title="View Details"
                      >
                        <FiEye size={15} />
                      </Link>
                      {!readOnly && (
                        <Link
                          href={`/purchases/edit/${item.id}`}
                          style={{
                            width: "32px",
                            height: "32px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#ffffff",
                            color: "#2563eb",
                            border: "1px solid #dfe5eb",
                            borderRadius: "6px",
                          }}
                          title="Edit Order"
                        >
                          <FiEdit2 size={15} />
                        </Link>
                      )}
                      {!readOnly && onDelete && (
                        <button
                          onClick={() => onDelete(item.id)}
                          style={{
                            width: "32px",
                            height: "32px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#ffffff",
                            color: "#dc2626",
                            border: "1px solid #dfe5eb",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                          title="Delete Order"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      )}
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
