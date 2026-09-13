"use client";

import { useEffect, useState } from "react";
import { getCustomers, getTextileCustomers } from "@/services/customerService";
import { useCompany } from "@/context/CompanyContext";

export default function CustomerSelect({ value, onChange }) {
  const { isGym, isTextile } = useCompany();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        const res = isTextile ? await getTextileCustomers() : await getCustomers();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setCustomers(list);
      } catch (err) {
        console.error("Failed to load customers in CustomerSelect:", err);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, [isGym, isTextile]);

  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full border rounded-lg p-3"
      disabled={loading}
    >
      <option value="">
        {loading
          ? "Loading customers..."
          : customers.length === 0
          ? isTextile
            ? "No Textile Customers Found"
            : "No Customers Found"
          : isTextile
          ? "Select Textile Buyer / Customer"
          : "Select Customer"}
      </option>

      {customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name || c.companyName || "Customer"} {c.phone ? `(${c.phone})` : ""} {c.customerType ? `— ${c.customerType}` : ""}
        </option>
      ))}
    </select>
  );
}