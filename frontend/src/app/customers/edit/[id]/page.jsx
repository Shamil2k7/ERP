"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiX, FiRefreshCw } from "react-icons/fi";
import CustomerForm from "../../components/CustomerForm";
import {
  getCustomerById,
  updateCustomer,
  getTextileCustomerById,
  updateTextileCustomer,
} from "@/services/customerService";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import styles from "../../customers.module.css";

export default function EditCustomerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isTextile } = useCompany();
  const { showSuccess, showError } = useAlert();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      if (!id) return;
      try {
        setLoading(true);
        setErrorMsg("");
        const res = isTextile
          ? await getTextileCustomerById(id)
          : await getCustomerById(id);

        if (res && res.data) {
          setCustomer(res.data);
        } else if (res) {
          setCustomer(res);
        }
      } catch (err) {
        console.error("Failed to load customer for editing:", err);
        setErrorMsg(err.response?.data?.message || err.message || "Failed to load customer details.");
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [id, isTextile]);

  const handleUpdate = async (updatedData) => {
    try {
      setErrorMsg("");
      const res = isTextile
        ? await updateTextileCustomer(id, updatedData)
        : await updateCustomer(id, updatedData);

      showSuccess("Customer updated", res.message || "Customer details updated successfully.");
      router.push("/customers");
    } catch (err) {
      console.error("Update customer error:", err);
      showError("Invalid form data", err.response?.data?.message || err.message || "Failed to update customer.");
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "10px", color: "#64748b" }}>
          <FiRefreshCw className="animate-spin" size={20} />
          <span>Loading customer details...</span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className={styles.page}>
        <div className={styles.addCard} style={{ maxWidth: "800px", margin: "40px auto", textAlign: "center", padding: "32px" }}>
          <h2 style={{ color: "#ef4444", marginBottom: "8px" }}>Unable to load customer</h2>
          <p style={{ color: "#64748b", marginBottom: "20px" }}>{errorMsg}</p>
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
      <div className={styles.addCard} style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div className={styles.addHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/customers" className={styles.closeButton} title="Back to Customers">
              <FiArrowLeft size={16} />
            </Link>
            <div>
              <h2>{isTextile ? "Edit Textile Customer" : "Edit Customer"}</h2>
              <p>Update customer information</p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={() => router.push("/customers")}
            title="Cancel"
          >
            <FiX size={18} />
          </button>
        </div>

        <CustomerForm
          initialData={customer || {}}
          onSubmit={handleUpdate}
          onCancel={() => router.push("/customers")}
          isTextile={isTextile}
        />
      </div>
    </div>
  );
}
