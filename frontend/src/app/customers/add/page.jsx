"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiX } from "react-icons/fi";
import CustomerForm from "../components/CustomerForm";
import { createCustomer, createTextileCustomer } from "@/services/customerService";
import { useAlert } from "@/context/AlertContext";
import { useCompany } from "@/context/CompanyContext";
import styles from "../customers.module.css";

export default function AddCustomerPage() {
  const router = useRouter();
  const { isTextile } = useCompany();
  const { showSuccess, showError } = useAlert();

  const handleSaveCustomer = async (customerData) => {
    try {
      const res = isTextile
        ? await createTextileCustomer(customerData)
        : await createCustomer(customerData);
      showSuccess("Customer created", res.message || "Customer record added successfully.");
      router.push("/customers");
    } catch (err) {
      console.error("Add customer error:", err);
      showError("Invalid form data", err.response?.data?.message || err.message || "Failed to add customer.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.addCard} style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div className={styles.addHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link href="/customers" className={styles.closeButton} title="Back to Customers">
              <FiArrowLeft size={16} />
            </Link>
            <div>
              <h2>{isTextile ? "Add Textile Buyer / Customer" : "Add Customer"}</h2>
              <p>{isTextile ? "Create a new wholesale fabric buyer profile" : "Create a new customer profile"}</p>
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
          onSubmit={handleSaveCustomer}
          onCancel={() => router.push("/customers")}
          isTextile={isTextile}
        />
      </div>
    </div>
  );
}