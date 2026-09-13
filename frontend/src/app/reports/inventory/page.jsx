"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InventoryReportPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reports?tab=inventory");
  }, [router]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting to Inventory Reports...</p>
    </div>
  );
}
