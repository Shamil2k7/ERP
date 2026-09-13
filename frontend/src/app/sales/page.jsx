"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import SalesTable from "./components/SalesTable";
import SalesFilter from "./components/SalesFilter";
import useSales from "@/hooks/useSales";
import apiClient from "@/services/apiClient";
import "./sales.css";

export default function SalesPage() {
  const { sales, loading } = useSales();

  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    apiClient
      .get("/customers")
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setCustomers(res.data.data);
        }
      })
      .catch(console.error);
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        (sale.invoiceNo || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (sale.customer || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (sale.cashier || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCustomer =
        customer === "" || sale.customer === customer;

      const matchesPayment =
        paymentStatus === "" ||
        sale.paymentStatus === paymentStatus;

      return (
        matchesSearch &&
        matchesCustomer &&
        matchesPayment
      );
    });
  }, [sales, search, customer, paymentStatus]);

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600" }}>
          Loading Sales...
        </h2>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1>Sales Management</h1>
          <p>Manage invoices and customer sales.</p>
        </div>
      </div>

      <SalesFilter
        search={search}
        setSearch={setSearch}
        customer={customer}
        setCustomer={setCustomer}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
        customers={customers}
      />

      <div className="tableCard">
        <SalesTable sales={filteredSales} />
      </div>
    </div>
  );
}