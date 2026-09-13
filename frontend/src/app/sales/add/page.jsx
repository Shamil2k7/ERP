"use client";

import SalesForm from "../components/SalesForm";

export default function AddSalePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          Create New Sale
        </h1>

        <p className="text-gray-500 mt-2">
          Create a new customer invoice.
        </p>

      </div>

      <SalesForm />

    </div>
  );
}