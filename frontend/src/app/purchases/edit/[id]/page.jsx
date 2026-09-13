"use client";

import { use } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiEdit3 } from "react-icons/fi";
import PurchaseForm from "../../components/PurchaseForm";

export default function EditPurchasePage({ params }) {
  const routeParams = useParams();
  const purchaseId = routeParams?.id || (params ? (typeof params.then === "function" ? use(params)?.id : params?.id) : undefined);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      {/* Header & Navigation */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/purchases" className="hover:text-blue-600 transition-colors">
              Purchases
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Edit Order</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <FiEdit3 className="text-slate-700" /> Edit Purchase Order
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Modify purchase order details, supplier, items, or status.
          </p>
        </div>

        <Link
          href="/purchases"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-start md:self-auto"
        >
          <FiArrowLeft /> Back to Purchases
        </Link>
      </div>

      {/* Dynamic Form */}
      <PurchaseForm purchaseId={purchaseId} isEdit={true} />
    </div>
  );
}
