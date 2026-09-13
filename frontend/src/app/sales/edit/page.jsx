"use client";

import SalesForm from "../components/SalesForm";

export default function EditSalePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">
        Edit Sale
      </h1>

      <SalesForm />
    </div>
  );
}