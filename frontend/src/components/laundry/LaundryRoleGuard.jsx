"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import { canAccessLaundryRoute, normalizeLaundryRole, LAUNDRY_ROLES } from "@/config/laundryPermissions";
import { FiShield, FiHome } from "react-icons/fi";

export default function LaundryRoleGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLaundry, loading } = useCompany();
  const [authorized, setAuthorized] = useState(true);
  const [defaultLanding, setDefaultLanding] = useState("/laundry/dashboard");

  useEffect(() => {
    if (loading || !isLaundry || !pathname) {
      setAuthorized(true);
      return;
    }

    // Only guard routes relevant to Laundry ERP
    const isLaundryRoute = pathname.startsWith("/laundry") || pathname.startsWith("/admin/employees") || pathname.startsWith("/admin/branches") || pathname === "/customers";
    if (!isLaundryRoute) {
      setAuthorized(true);
      return;
    }

    const roleUpper = (user?.role || user?.roleRef?.name || user?.type || "").toUpperCase().replace(/[\s-]+/g, "_");
    const isSuper = roleUpper.includes("SUPER") || roleUpper.includes("ADMIN") || roleUpper.includes("OWNER");
    if (isSuper) {
      setAuthorized(true);
      return;
    }

    const normalizedRole = normalizeLaundryRole(user?.role || user?.roleRef?.name);

    if (normalizedRole === LAUNDRY_ROLES.CASHIER) {
      setDefaultLanding("/laundry/pos");
    } else if (normalizedRole === LAUNDRY_ROLES.PROCESSING_STAFF) {
      setDefaultLanding("/laundry/processing");
    } else if (normalizedRole === LAUNDRY_ROLES.DELIVERY_DRIVER) {
      setDefaultLanding("/laundry/delivery");
    } else {
      setDefaultLanding("/laundry/dashboard");
    }

    const isAllowed = canAccessLaundryRoute(user, pathname);
    setAuthorized(isAllowed);
  }, [pathname, user, isLaundry, loading]);

  if (!authorized) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "75vh",
          padding: "32px",
          textAlign: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          borderRadius: "16px",
          margin: "24px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "#fee2e2",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
            marginBottom: "20px",
          }}
        >
          <FiShield />
        </div>

        <span
          style={{
            padding: "4px 12px",
            background: "#ef4444",
            color: "#ffffff",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "0.5px",
            marginBottom: "12px",
            textTransform: "uppercase",
          }}
        >
          403 Access Forbidden
        </span>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: "10px",
          }}
        >
          Access Denied
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: "#64748b",
            maxWidth: "480px",
            lineHeight: "1.6",
            marginBottom: "28px",
          }}
        >
          Your assigned role (
          <strong style={{ color: "#0f172a" }}>
            {(user?.role || "Staff").toUpperCase()}
          </strong>
          ) does not have permission to access this module in Laundry ERP.
        </p>

        <button
          onClick={() => router.push(defaultLanding)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)",
          }}
        >
          <FiHome size={18} />
          Return to My Workspace
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
