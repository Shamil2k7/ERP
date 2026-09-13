"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PurchaseReportPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reports?tab=purchases");
  }, [router]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting to Purchase Reports...</p>
    </div>
  );
}
