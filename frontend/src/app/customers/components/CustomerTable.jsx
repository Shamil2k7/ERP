"use client";

import Link from "next/link";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import styles from "../customers.module.css";

export default function CustomerTable({ customers = [], onDelete, onEdit, readOnly = false, isTextile = false }) {
  if (!customers.length) {
    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td colSpan="8" className={styles.empty}>
                {isTextile
                  ? "No Textile customers found. Add your first customer to start managing textile sales."
                  : "No customers found."}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Customer / Buyer Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>{isTextile ? "Type / GST" : "Loyalty ID"}</th>
            <th style={{ textAlign: "right" }}>Credit Limit</th>
            <th style={{ textAlign: "right" }}>Balance</th>
            <th style={{ textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => {
            const customerName =
              customer.name ||
              customer.companyName ||
              `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
              "Customer";
            const initials = customerName.substring(0, 2).toUpperCase();

            return (
              <tr key={customer.id}>
                <td className={styles.id}>{index + 1}</td>
                <td>
                  <div className={styles.customerCell}>
                    <div
                      className={styles.customerAvatar}
                      style={isTextile ? { backgroundColor: "#0d9488" } : undefined}
                    >
                      {initials}
                    </div>
                    <div>
                      <strong>{customerName}</strong>
                      {isTextile && customer.customerType && (
                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "normal" }}>
                          {customer.customerType}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>{customer.phone || "—"}</td>
                <td>{customer.email || "—"}</td>
                <td>
                  {isTextile ? (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: "#f0fdfa",
                        color: "#0f766e",
                        border: "1px solid #ccfbf1",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {customer.gstNumber || customer.taxNumber || customer.customerType || "Buyer"}
                    </span>
                  ) : customer.loyaltyId ? (
                    <span className={styles.loyaltyBadge}>{customer.loyaltyId}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td style={{ textAlign: "right" }}>
                  ₹{Number(customer.creditLimit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: "right", fontWeight: 700, color: "#17304b" }}>
                  ₹{Number(customer.currentBalance || customer.outstandingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td>
                  <div className={styles.actionWrapper}>
                    <div className={styles.actionGroup}>
                      <Link
                        href={`/customers/${customer.id}`}
                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                        title="View Details"
                      >
                        <FiEye size={15} />
                      </Link>

                      {!readOnly && (
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                          onClick={() => onEdit && onEdit(customer)}
                          title="Edit Customer"
                        >
                          <FiEdit2 size={15} />
                        </button>
                      )}

                      {!readOnly && (
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => onDelete && onDelete(customer)}
                          title="Delete Customer"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>
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