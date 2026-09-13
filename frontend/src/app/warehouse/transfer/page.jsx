"use client";

import Link from "next/link";
import TransferForm from "../components/TransferForm";
import "../warehouse.css";

export default function TransferPage() {
  return (
    <div className="warehouse-page-wrapper">
      {/* Sub-Navigation */}
      <nav className="warehouse-nav-tabs">
        <Link href="/warehouse" className="nav-tab-item">
          Warehouse Overview
        </Link>
        <Link href="/warehouse/stock" className="nav-tab-item">
          Stock Inventory
        </Link>
        <Link href="/warehouse/transfer" className="nav-tab-item active">
          Stock Transfer
        </Link>
      </nav>


      {/* Main Content Area */}
      <main className="warehouse-main-content">
        <TransferForm />
      </main>
    </div>
  );
}