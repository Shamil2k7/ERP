"use client";

import { useEffect, useState } from "react";
import { getSuppliers } from "@/services/supplierService";

export default function SupplierSelect({ value, onChange }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        setLoading(true);
        const res = await getSuppliers();
        if (res?.data) {
          setSuppliers(res.data);
        } else if (Array.isArray(res)) {
          setSuppliers(res);
        }
      } catch (err) {
        console.error("Failed to fetch suppliers in SupplierSelect:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSuppliers();
  }, []);

  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white font-medium shadow-sm transition-all"
      disabled={loading}
      required
    >
      <option value="">
        {loading ? "Loading suppliers..." : "Select Supplier"}
      </option>

      {suppliers.map((supplier) => {
        const name = supplier.companyName || supplier.name || "Unnamed Supplier";
        return (
          <option key={supplier.id} value={supplier.id}>
            {name} {supplier.phone ? `(${supplier.phone})` : ""}
          </option>
        );
      })}
    </select>
  );
}
