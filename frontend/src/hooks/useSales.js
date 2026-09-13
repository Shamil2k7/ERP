"use client";

import { useEffect, useState } from "react";
import { getSalesOrders } from "@/services/salesService";

export default function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSales = async () => {
    try {
      setLoading(true);

      const response = await getSalesOrders();
      const rawSales = response.data || [];

      const mappedSales = rawSales.map((sale) => {
        const orderDateObj = sale.orderDate ? new Date(sale.orderDate) : new Date(sale.createdAt);
        const formattedDate = orderDateObj.toISOString().split("T")[0];

        let paymentStatus = "Pending";
        if (sale.status === "COMPLETED" || sale.status === "CONFIRMED") {
          paymentStatus = "Paid";
        } else if (sale.status === "CANCELLED") {
          paymentStatus = "Cancelled";
        }

        return {
          id: sale.id,
          orderNumber: sale.orderNumber || sale.invoiceNumber || "SO-N/A",
          invoiceNo: sale.orderNumber || sale.invoiceNumber || "SO-N/A",
          customer: sale.customerName || sale.customer || "Walk-in Customer",
          branch: sale.branch?.name || "Main Branch",
          cashier: "Admin",
          date: formattedDate,
          paymentMethod: sale.paymentMethod || "Cash",
          paymentStatus,
          orderStatus: sale.status || "CONFIRMED",
          subTotal: Number(sale.totalAmount || 0),
          discount: Number(sale.discountAmount || 0),
          tax: Number(sale.taxAmount || 0),
          total: Number(sale.netAmount || sale.totalAmount || 0),
          totalAmount: Number(sale.netAmount || sale.totalAmount || 0),
          items: sale.items || [],
        };
      });

      setSales(mappedSales);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  return {
    sales,
    loading,
    error,
    refresh: loadSales,
  };
}