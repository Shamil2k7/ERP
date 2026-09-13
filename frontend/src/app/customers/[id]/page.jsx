"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiRefreshCw } from "react-icons/fi";
import CustomerCard from "../components/CustomerCard";
import {
  getCustomerById,
  deleteCustomer,
  getTextileCustomerById,
  deleteTextileCustomer,
} from "@/services/customerService";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import styles from "../customers.module.css";

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isTextile } = useCompany();
  const { showSuccess, showError, showConfirm } = useAlert();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      if (!id) return;
      try {
        setLoading(true);
        const data = isTextile
          ? await getTextileCustomerById(id)
          : await getCustomerById(id);

        setCustomer(data?.data || data);
      } catch (err) {
        console.error("Failed to fetch customer details:", err);
        setErrorMsg(err.response?.data?.message || err.message || "Failed to load customer profile.");
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [id, isTextile]);

  const handleDelete = (targetCustomer) => {
    showConfirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete customer "${targetCustomer.name}"? This action cannot be undone.`,
      confirmText: "Delete Customer",
      type: "danger",
      onConfirm: async () => {
        try {
          if (isTextile) {
            await deleteTextileCustomer(targetCustomer.id);
          } else {
            await deleteCustomer(targetCustomer.id);
          }
          showSuccess("Customer deleted", "Customer deleted successfully.");
          router.push("/customers");
        } catch (err) {
          console.error("Delete customer error:", err);
          showError("Customer couldn't be deleted", err.response?.data?.message || err.message || "Failed to delete customer.");
        }
      },
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "350px", gap: "10px", color: "#64748b" }}>
          <FiRefreshCw className="animate-spin" size={20} />
          <span>Loading customer profile...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !customer) {
    return (
      <div className={styles.page}>
        <div className={styles.addCard} style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center", padding: "32px" }}>
          <h2 style={{ color: "#ef4444", marginBottom: "8px" }}>Unable to load customer</h2>
          <p style={{ color: "#64748b", marginBottom: "20px" }}>{errorMsg || "Customer record not found."}</p>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => router.push("/customers")}
            style={{ margin: "0 auto" }}
          >
            ← Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <CustomerCard customer={customer} onDelete={handleDelete} isTextile={isTextile} />
    </div>
  );
}