"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import { FiShield, FiHome } from "react-icons/fi";

export default function RestaurantRoleGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isRestaurant } = useCompany();
  const [authorized, setAuthorized] = useState(true);
  const [defaultLanding, setDefaultLanding] = useState("/restaurant/pos");

  useEffect(() => {
    if (!isRestaurant || !pathname || !pathname.startsWith("/restaurant")) {
      setAuthorized(true);
      return;
    }

    const roleUpper = (user?.role || user?.roleRef?.name || user?.type || "").toUpperCase();
    const isAdmin = roleUpper.includes("SUPER") || roleUpper.includes("ADMIN") || roleUpper.includes("OWNER");
    const isManager = roleUpper.includes("MANAGER");
    const isCashier = roleUpper.includes("CASHIER") || roleUpper.includes("BILLING") || roleUpper.includes("COUNTER");
    const isWaiter = roleUpper.includes("WAITER") || roleUpper.includes("STEWARD") || roleUpper.includes("SERVER");
    const isKitchen = roleUpper.includes("KITCHEN") || roleUpper.includes("CHEF") || roleUpper.includes("COOK");

    if (isAdmin) {
      setAuthorized(true);
      return;
    }

    if (isManager) {
      if (pathname.startsWith("/restaurant/manage")) {
        setAuthorized(false);
        setDefaultLanding("/restaurant/dashboard");
      } else {
        setAuthorized(true);
      }
      return;
    }

    if (isCashier) {
      const allowed = ["/restaurant/pos", "/restaurant/tables", "/restaurant/orders"];
      const isAllowed = allowed.some((prefix) => pathname.startsWith(prefix));
      setAuthorized(isAllowed);
      setDefaultLanding("/restaurant/pos");
      return;
    }


    if (isWaiter) {
      const allowed = ["/restaurant/pos", "/restaurant/tables", "/restaurant/reservations", "/restaurant/orders"];
      const isAllowed = allowed.some((prefix) => pathname.startsWith(prefix));
      setAuthorized(isAllowed);
      setDefaultLanding("/restaurant/pos");
      return;
    }

    if (isKitchen) {
      const allowed = ["/restaurant/kitchen"];
      const isAllowed = allowed.some((prefix) => pathname.startsWith(prefix));
      setAuthorized(isAllowed);
      setDefaultLanding("/restaurant/kitchen");
      return;
    }

    // Default fallback: allow
    setAuthorized(true);
  }, [pathname, user, isRestaurant]);

  if (!authorized) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "75vh", padding: "24px", textAlign: "center" }}>
        <div style={{ padding: "24px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "16px", maxWidth: "480px", width: "100%", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}>
          <FiShield size={48} color="#ef4444" style={{ marginBottom: "16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#991b1b", margin: "0 0 8px 0" }}>403 — Access Denied</h2>
          <p style={{ fontSize: "14px", color: "#7f1d1d", lineHeight: "1.5", margin: "0 0 20px 0" }}>
            Your employee account role (<strong>{(user?.role || "Staff").toUpperCase()}</strong>) is not authorized to access this module page.
          </p>
          <button
            onClick={() => router.push(defaultLanding)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FiHome size={16} /> Return to My Module
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
