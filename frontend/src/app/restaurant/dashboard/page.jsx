"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RestaurantDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontFamily: "Inter, sans-serif" }}>
      Redirecting to Main Operations Dashboard...
    </div>
  );
}
