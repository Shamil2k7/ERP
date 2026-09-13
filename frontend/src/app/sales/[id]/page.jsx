"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FiLoader } from "react-icons/fi";
import SalesCard from "../components/SalesCard";
import { getSalesOrderById } from "@/services/salesService";

export default function SaleDetailsPage() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSale() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await getSalesOrderById(id);
        const data = res.data;
        if (!data) {
          throw new Error("No sale order found");
        }

        const orderDateObj = data.orderDate ? new Date(data.orderDate) : new Date(data.createdAt);
        const formattedDate = orderDateObj.toISOString().split("T")[0];

        let paymentStatus = "Pending";
        if (data.status === "COMPLETED") {
          paymentStatus = "Paid";
        } else if (data.status === "CANCELLED") {
          paymentStatus = "Cancelled";
        }

        // Fetch products or mock details for display if none are provided
        const items = data.items || [
          {
            product: "Sales Order Item",
            qty: 1,
            price: Number(data.totalAmount || 0),
          }
        ];

        setSale({
          id: data.id,
          invoiceNo: data.orderNumber || "INV-N/A",
          customer: data.customerName || "Walk-in Customer",
          cashier: "Admin",
          date: formattedDate,
          paymentMethod: "Cash",
          paymentStatus,
          subTotal: Number(data.totalAmount || 0),
          discount: Number(data.discountAmount || 0),
          tax: Number(data.taxAmount || 0),
          total: Number(data.netAmount || data.totalAmount || 0),
          items,
        });
      } catch (err) {
        console.error("Error loading sale order:", err);
        setError("Failed to load sale details.");
      } finally {
        setLoading(false);
      }
    }
    loadSale();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center gap-2 text-gray-500">
        <FiLoader className="animate-spin" size={24} />
        <span className="text-lg font-semibold">Loading sale details...</span>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-md max-w-md w-full text-center">
          <p className="font-bold text-lg mb-2">Error</p>
          <p>{error || "Sale details not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">
        Sale Details
      </h1>
      <SalesCard sale={sale} />
    </div>
  );
}