"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RestaurantWastagePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/restaurant/dashboard");
  }, [router]);

  return (
    <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
      <p>Redirecting to Restaurant Dashboard...</p>
    </div>
  );
}
