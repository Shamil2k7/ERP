"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { useAlert } from "@/context/AlertContext";
import { sanitizePhoneInput, getPhoneValidationError, isValidPhoneNumber } from "@/utils/validation";
import styles from "../customers.module.css";

export default function CustomerForm({
  initialData = {},
  onSubmit,
  onCancel,
  isTextile = false,
}) {
  const router = useRouter();
  const { showWarning } = useAlert();

  const [form, setForm] = useState({
    name: initialData.name || initialData.companyName || "",
    companyName: initialData.companyName || initialData.name || "",
    contactPerson: initialData.contactPerson || "",
    customerType: initialData.customerType || "Garment Manufacturer",
    phone: initialData.phone || "",
    email: initialData.email || "",
    address: initialData.address || "",
    city: initialData.city || "",
    state: initialData.state || "",
    country: initialData.country || "India",
    gstNumber: initialData.gstNumber || initialData.taxNumber || "",
    taxNumber: initialData.taxNumber || initialData.gstNumber || "",
    paymentTerms: initialData.paymentTerms || "Net 30",
    loyaltyId: initialData.loyaltyId || "",
    creditLimit:
      initialData.creditLimit !== undefined && initialData.creditLimit !== null
        ? String(initialData.creditLimit)
        : "",
    currentBalance: initialData.currentBalance || 0,
    status: initialData.status || "ACTIVE",
  });

  const [submitting, setSubmitting] = useState(false);

  const generateLoyaltyId = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setForm((prev) => ({ ...prev, loyaltyId: `LOY-${num}` }));
  };

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setForm({
        name: initialData.name || initialData.companyName || "",
        companyName: initialData.companyName || initialData.name || "",
        contactPerson: initialData.contactPerson || "",
        customerType: initialData.customerType || "Garment Manufacturer",
        phone: initialData.phone || "",
        email: initialData.email || "",
        address: initialData.address || "",
        city: initialData.city || "",
        state: initialData.state || "",
        country: initialData.country || "India",
        gstNumber: initialData.gstNumber || initialData.taxNumber || "",
        taxNumber: initialData.taxNumber || initialData.gstNumber || "",
        paymentTerms: initialData.paymentTerms || "Net 30",
        loyaltyId: initialData.loyaltyId || `LOY-${Math.floor(100000 + Math.random() * 900000)}`,
        creditLimit:
          initialData.creditLimit !== undefined && initialData.creditLimit !== null
            ? String(initialData.creditLimit)
            : "",
        currentBalance: initialData.currentBalance || 0,
        status: initialData.status || "ACTIVE",
      });
    } else {
      generateLoyaltyId();
    }
  }, [initialData]);

  const [phoneError, setPhoneError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const sanitized = sanitizePhoneInput(value);
      setForm((prev) => ({ ...prev, phone: sanitized }));
      if (sanitized) {
        setPhoneError(getPhoneValidationError(sanitized, false) || "");
      } else {
        setPhoneError("");
      }
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: name === "currentBalance" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showWarning("Invalid form data", "Customer / Buyer name is required.");
      return;
    }

    if (!isValidPhoneNumber(form.phone, true)) {
      const pErr = getPhoneValidationError(form.phone, true) || "Phone number must contain exactly 10 digits.";
      setPhoneError(pErr);
      showWarning("Invalid Phone Number", pErr);
      return;
    }


    try {
      setSubmitting(true);
      const parsedCreditLimit =
        form.creditLimit === "" || form.creditLimit === null || isNaN(Number(form.creditLimit))
          ? 0
          : Number(form.creditLimit);

      const finalForm = {
        ...form,
        name: form.name.trim(),
        companyName: form.companyName ? form.companyName.trim() : form.name.trim(),
        phone: cleanPhone,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
        taxNumber: form.taxNumber.trim() || undefined,
        creditLimit: parsedCreditLimit,
        currentBalance: Number(form.currentBalance) || 0,
        loyaltyId: form.loyaltyId || `LOY-${Math.floor(100000 + Math.random() * 900000)}`,
        isTextile: Boolean(isTextile),
        erpType: isTextile ? "TEXTILE" : undefined,
        category: isTextile ? "TEXTILE" : undefined,
      };
      await onSubmit(finalForm);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/customers");
    }
  };

  return (
    <form className={styles.customerForm} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="name">{isTextile ? "Buyer / Customer Name *" : "Customer Name *"}</label>
        <input
          id="name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder={isTextile ? "e.g. Royal Garments & Exports" : "e.g. John Doe"}
          required
        />
      </div>

      {isTextile && (
        <div className={styles.formGroup}>
          <label htmlFor="customerType">Buyer Industry / Channel</label>
          <select
            id="customerType"
            name="customerType"
            value={form.customerType}
            onChange={handleChange}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              fontSize: "14px",
              width: "100%",
            }}
          >
            <option value="Garment Manufacturer">Garment Manufacturer</option>
            <option value="Fabric Wholesaler">Fabric Wholesaler</option>
            <option value="Export House">Export House</option>
            <option value="Retail Brand Chain">Retail Brand Chain</option>
            <option value="Boutique / Designer">Boutique / Designer</option>
            <option value="General Commercial">General Commercial</option>
          </select>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="phone">Phone Number *</label>
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="10-digit Phone Number"
          required
          style={{
            borderColor: phoneError ? "#ef4444" : undefined,
          }}
        />

        {phoneError && (
          <span
            style={{
              fontSize: "12px",
              color: "#ef4444",
              marginTop: "4px",
              display: "block",
              fontWeight: 500,
            }}
          >
            {phoneError}
          </span>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="buyer@example.com"
        />
      </div>

      {isTextile ? (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="gstNumber">GST / Tax ID Number</label>
            <input
              id="gstNumber"
              type="text"
              name="gstNumber"
              value={form.gstNumber}
              onChange={handleChange}
              placeholder="e.g. 33AAAAA0000A1Z5"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="paymentTerms">Credit / Payment Terms</label>
            <select
              id="paymentTerms"
              name="paymentTerms"
              value={form.paymentTerms}
              onChange={handleChange}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "14px",
                width: "100%",
              }}
            >
              <option value="Immediate / Cash">Immediate / Cash</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 30">Net 30 Days</option>
              <option value="Net 45">Net 45 Days</option>
              <option value="Net 60">Net 60 Days</option>
              <option value="LC at Sight">Letter of Credit (LC)</option>
            </select>
          </div>
        </>
      ) : (
        <div className={styles.formGroup}>
          <label htmlFor="loyaltyId">
            Customer Loyalty ID <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "700" }}>(Auto-Generated)</span>
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="loyaltyId"
              type="text"
              name="loyaltyId"
              value={form.loyaltyId}
              onChange={handleChange}
              placeholder="e.g. LOY-889901"
              style={{ fontWeight: "700", color: "#0f172a" }}
            />
            <button
              type="button"
              onClick={generateLoyaltyId}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}
              title="Generate new Loyalty ID"
            >
              ⚡ Auto Generate
            </button>
          </div>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="creditLimit">Credit Limit (₹)</label>
        <input
          id="creditLimit"
          type="number"
          name="creditLimit"
          value={form.creditLimit}
          onChange={handleChange}
          placeholder="e.g. 50000"
          min="0"
          step="any"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="city">City / Region</label>
        <input
          id="city"
          type="text"
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder={isTextile ? "e.g. Tirupur, Surat, Coimbatore" : "e.g. New York"}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="address">Delivery / Factory Address</label>
        <textarea
          id="address"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Enter address details..."
          rows={3}
        />
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={handleCancelClick}
          disabled={submitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={styles.saveButton}
          disabled={submitting}
          style={isTextile ? { backgroundColor: "#0d9488" } : undefined}
        >
          <FiSave size={16} />
          {submitting ? "Saving..." : isTextile ? "Save Textile Customer" : "Save Customer"}
        </button>
      </div>
    </form>
  );
}