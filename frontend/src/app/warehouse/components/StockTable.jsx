"use client";

import { useState, useEffect, useRef } from "react";

export default function StockTable({ stock = [], onEdit, onDelete }) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const dropdownRef = useRef(null);

  // Close active dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }

    if (activeMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenuId]);

  const handleToggleMenu = (itemId) => {
    setActiveMenuId((prev) => (prev === itemId ? null : itemId));
  };

  return (
    <div className="warehouse-table-container">
      <table className="warehouse-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>PRODUCT</th>
            <th>CATEGORY</th>
            <th>WAREHOUSE</th>
            <th style={{ textAlign: "center" }}>QUANTITY</th>
            <th style={{ textAlign: "center" }}>REORDER LEVEL</th>
            <th style={{ textAlign: "center" }}>STATUS</th>
            <th style={{ width: "60px", textAlign: "center" }}>ACTIONS</th>
          </tr>
        </thead>

        <tbody>
          {stock.length === 0 && (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "40px 0", color: "#71717a" }}>
                No stock records found matching criteria.
              </td>
            </tr>
          )}

          {stock.map((item) => {
            const status =
              item.quantity === 0
                ? "Out of Stock"
                : item.quantity <= item.reorder
                ? "Low Stock"
                : "In Stock";

            const statusClass =
              status === "In Stock"
                ? "instock"
                : status === "Low Stock"
                ? "lowstock"
                : "outofstock";

            return (
              <tr key={item.id}>
                <td className="sku-cell">{item.sku}</td>

                <td className="product-name-cell">{item.product}</td>

                <td>{item.category}</td>

                <td>{item.warehouse}</td>

                <td style={{ textAlign: "center" }}>
                  <span className="quantity-badge">{item.quantity}</span>
                </td>

                <td style={{ textAlign: "center", color: "#71717a", fontWeight: 600 }}>
                  {item.reorder}
                </td>

                <td style={{ textAlign: "center" }}>
                  <span className={`badge-status ${statusClass}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {status}
                  </span>
                </td>

                <td style={{ textAlign: "center", position: "relative" }}>
                  <button
                    className="action-dots-btn"
                    title="Options"
                    onClick={() => handleToggleMenu(item.id)}
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === item.id && (
                    <div ref={dropdownRef} className="table-action-dropdown">
                      <button
                        onClick={() => {
                          onEdit(item);
                          setActiveMenuId(null);
                        }}
                        className="dropdown-item"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: "8px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Edit Stock
                      </button>
                      <button
                        onClick={() => {
                          onDelete(item);
                          setActiveMenuId(null);
                        }}
                        className="dropdown-item danger"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: "8px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        Delete Stock
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}