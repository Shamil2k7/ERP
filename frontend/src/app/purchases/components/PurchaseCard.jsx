"use client";

import Link from "next/link";
import { FiArrowLeft, FiPrinter, FiTruck, FiHome, FiCalendar, FiPackage } from "react-icons/fi";

export default function PurchaseCard({ purchase }) {
  if (!purchase) return null;

  const statusLower = (purchase.status || "PENDING").toLowerCase();

  let statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  if (statusLower === "received" || statusLower === "completed" || statusLower === "delivered") {
    statusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (statusLower === "partial") {
    statusBadgeClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (statusLower === "cancelled") {
    statusBadgeClass = "bg-red-50 text-red-700 border-red-200";
  }

  const items = purchase.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.totalPrice) || (item.quantity || item.qty || 1) * Number(item.unitPrice || item.price || 0)),
    0
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-slate-900">
              {purchase.purchaseNo || "Purchase Details"}
            </h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass}`}>
              {purchase.status || "PENDING"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <FiCalendar /> Issued Date: {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : purchase.date || "—"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <FiPrinter /> Print Invoice
          </button>
          <Link
            href="/purchases"
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] rounded-lg shadow-sm flex items-center gap-2 transition-colors"
          >
            <FiArrowLeft /> Back to Purchases
          </Link>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <FiTruck className="text-slate-700" /> Supplier Details
          </h3>
          <p className="font-bold text-slate-900 text-base">
            {purchase.supplier?.companyName || purchase.supplier?.name || purchase.supplier || "—"}
          </p>
          {purchase.supplier?.phone && (
            <p className="text-xs text-slate-600 mt-1">Phone: {purchase.supplier.phone}</p>
          )}
          {purchase.supplier?.email && (
            <p className="text-xs text-slate-600">Email: {purchase.supplier.email}</p>
          )}
        </div>

        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
            <FiHome className="text-slate-700" /> Warehouse Destination
          </h3>
          <p className="font-bold text-slate-900 text-base">
            {purchase.warehouse?.name || purchase.warehouse || "—"}
          </p>
          {purchase.warehouse?.code && (
            <p className="text-xs text-slate-600 mt-1">Code: {purchase.warehouse.code}</p>
          )}
          {purchase.warehouse?.city && (
            <p className="text-xs text-slate-600">City: {purchase.warehouse.city}</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-6">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FiPackage className="text-slate-700" /> Purchased Items ({items.length})
        </h3>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-[12px] font-bold uppercase tracking-wider text-slate-600 px-4 py-3">
                  Product
                </th>
                <th className="text-[12px] font-bold uppercase tracking-wider text-slate-600 px-4 py-3 text-center">
                  Quantity
                </th>
                <th className="text-[12px] font-bold uppercase tracking-wider text-slate-600 px-4 py-3 text-right">
                  Unit Price
                </th>
                <th className="text-[12px] font-bold uppercase tracking-wider text-slate-600 px-4 py-3 text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const prodName = item.product?.name || item.product || "Product";
                const qty = item.quantity || item.qty || 1;
                const unitPrice = Number(item.unitPrice || item.price || 0);
                const lineTotal = Number(item.totalPrice || qty * unitPrice);

                return (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-medium text-slate-800 text-sm">
                      {prodName}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-700 text-sm font-semibold">
                      {qty}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-600 text-sm">
                      ₹{unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 text-sm">
                      ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grand Total Summary */}
      <div className="flex justify-end mt-6">
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 w-80 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-800">
              ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-900 text-base">Grand Total</span>
            <span className="font-extrabold text-xl text-slate-900">
              ₹{Number(purchase.totalAmount || purchase.total || subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}