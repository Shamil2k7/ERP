"use client";

import { useCallback, useEffect, useState } from "react";
import { getWarehouses } from "@/services/warehouseService";

export default function useWarehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getWarehouses();

      /*
       * Supports:
       *
       * { data: [...] }
       *
       * and
       *
       * [...]
       */

      const data = Array.isArray(response)
        ? response
        : response?.data || [];

      setWarehouses(data);
    } catch (error) {
      console.error("Warehouse Error:", error);
      setError(error.message || "Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  return {
    warehouses,
    loading,
    error,
    refresh: loadWarehouses,
  };
}