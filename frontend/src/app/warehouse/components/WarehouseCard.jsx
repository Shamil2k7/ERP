"use client";

import Link from "next/link";

export default function WarehouseCard({
  warehouse,
  onDelete,
}) {
  return (
    <div className="warehouse-card">

      <div className="warehouse-card-header">

        <div>
          <h2>
            {warehouse.name || "Unnamed Warehouse"}
          </h2>

          <p>
            {warehouse.code || "No Code"}
          </p>
        </div>

        <span
          className={
            warehouse.status === "INACTIVE"
              ? "status inactive"
              : "status active"
          }
        >
          {warehouse.status || "ACTIVE"}
        </span>

      </div>

      <div className="warehouse-card-body">

        <p>
          <strong>Location:</strong>{" "}
          {warehouse.location || "-"}
        </p>

        <p>
          <strong>Address:</strong>{" "}
          {warehouse.address || "-"}
        </p>

      </div>

      <div className="warehouse-card-actions">

        <Link
          href={`/warehouse/${warehouse.id}`}
          className="btn-card-action secondary"
        >
          View
        </Link>

        <Link
          href={`/warehouse/edit/${warehouse.id}`}
          className="btn-card-action secondary"
        >
          Edit
        </Link>

        <button
          onClick={() => onDelete(warehouse.id)}
          className="btn-card-action danger"
        >
          Delete
        </button>

      </div>

    </div>
  );
}