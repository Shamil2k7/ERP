"use client";

export default function SalesFilter({
  search,
  setSearch,
  customer,
  setCustomer,
  paymentStatus,
  setPaymentStatus,
  customers = [],
}) {
  return (
    <div className="filterCard">
      <div className="filterGrid">
        
        <div className="filterGroup">
          <label>Search Sales</label>
          <input
            type="text"
            placeholder="Search Invoice, Cashier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filterGroup">
          <label>Customer</label>
          <select
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          >
            <option value="">All Customers</option>
            <option value="Walk-in Customer">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filterGroup">
          <label>Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <option value="">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

      </div>
    </div>
  );
}