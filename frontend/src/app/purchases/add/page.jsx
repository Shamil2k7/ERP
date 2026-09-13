"use client";

import Link from "next/link";
import { FiPrinter, FiDownload, FiX } from "react-icons/fi";
import { showInfo } from "@/utils/swal";
import PurchaseForm from "../components/PurchaseForm";
import "../purchases.css";

export default function AddPurchasePage() {
  return (
    <div className="page">
      {/* PAGE HEADER */}
      <header className="header">
        <div>
          <h1 className="pageTitle">New Purchase Order</h1>
          <p className="pageSubtitle">Create a new purchase order for stock replenishment.</p>
        </div>

        <div className="headerActions">
          <button
            className="secondaryButton"
            onClick={() => window.print()}
          >
            <FiPrinter size={15} />
            Print
          </button>

          <button
            className="secondaryButton"
            onClick={() => showInfo("Export Template", "Exporting template...")}
          >
            <FiDownload size={15} />
            Export
          </button>

          <Link href="/purchases" className="addButton">
            <FiX size={17} />
            Close
          </Link>
        </div>
      </header>

      {/* ADD CARD */}
      <PurchaseForm />
    </div>
  );
}



