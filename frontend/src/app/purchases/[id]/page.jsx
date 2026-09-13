"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PurchaseCard from "../components/PurchaseCard";
import { getPurchase } from "@/services/purchaseService";

export default function PurchaseDetailsPage() {
  const params = useParams();
  const id = params?.id;

  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function loadPurchase() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPurchase(id);
        setPurchase(data.data || data);
      } catch (err) {
        console.error("Failed to load purchase details:", err);
        setError(err.message || "Purchase order not found.");
      } finally {
        setLoading(false);
      }
    }

    loadPurchase();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-medium shadow-sm">
          Loading purchase order details...
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center text-red-600 font-medium shadow-sm">
          {error}
        </div>
      ) : (
        <PurchaseCard purchase={purchase} />
      )}
    </div>
  );
}