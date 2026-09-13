"use client";

export default function PurchaseFilter({
  search,
  setSearch,
  status,
  setStatus,
  supplier,
  setSupplier,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5 mb-6">

      <div className="grid md:grid-cols-3 gap-4">

        <input
          type="text"
          placeholder="Search Purchase..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-3"
        />

        <select
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className="border rounded-lg px-4 py-3"
        >
          <option value="">All Suppliers</option>
          <option>ABC Traders</option>
          <option>Global Suppliers</option>
          <option>Tech Distributors</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg px-4 py-3"
        >
          <option value="">All Status</option>
          <option>Pending</option>
          <option>Received</option>
          <option>Cancelled</option>
        </select>

      </div>

    </div>
  );
}