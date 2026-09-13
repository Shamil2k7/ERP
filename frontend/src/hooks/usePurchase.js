"use client";

import { useEffect, useState } from "react";
import { getPurchases } from "@/services/purchaseService";

export default function usePurchase() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPurchases = async () => {
    try {
      setLoading(true);

      const data = await getPurchases();

      setPurchases(data.data || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  return {
    purchases,
    loading,
    refresh: loadPurchases,
  };
}