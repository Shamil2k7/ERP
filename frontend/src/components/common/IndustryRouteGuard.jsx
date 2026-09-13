"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import { ROUTE_MODULE_MAP } from "@/config/industries";
import { FiLock, FiHome, FiShield } from "react-icons/fi";

export default function IndustryRouteGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isModuleEnabled, company, user, loading } = useCompany();

  if (loading) {
    return <>{children}</>;
  }

  // Super Admin bypasses route guards
  const roleUpper = (user?.role || "").toUpperCase();
  if (roleUpper.includes("SUPER")) {
    return <>{children}</>;
  }

  // Laundry ERP Role-Based Access Control check
  if (company?.industry?.code?.toUpperCase().includes("LAUNDRY") || user?.type?.toUpperCase().includes("LAUNDRY")) {
    const { canAccessLaundryRoute } = require("@/config/laundryPermissions");
    const isLaundryRoute = pathname.startsWith("/laundry") || pathname.startsWith("/admin/employees") || pathname.startsWith("/admin/branches") || pathname === "/customers";
    if (isLaundryRoute && !canAccessLaundryRoute(user, pathname)) {
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
            Your assigned role (<strong>{(user?.role || "Staff").toUpperCase()}</strong>) is not authorized to access this module in Laundry ERP.
          </p>

          <button
            onClick={() => router.push("/laundry/dashboard")}
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
            Return to Dashboard
          </button>
        </div>
      );
    }
  }

  // Match current route against ROUTE_MODULE_MAP
  let requiredModule = null;
  for (const [routePattern, modCode] of Object.entries(ROUTE_MODULE_MAP)) {
    if (pathname === routePattern || pathname.startsWith(routePattern + "/")) {
      requiredModule = modCode;
      break;
    }
  }


  if (requiredModule && !isModuleEnabled(requiredModule)) {
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
          Your role (<strong>{user?.role || user?.roleRef?.name || "Employee"}</strong>) does not have permission to access the <strong>{requiredModule}</strong> module in {company?.name || "the system"}.
        </p>

        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 24px",
            background: "#4f46e5",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
            transition: "transform 0.2s ease, background 0.2s ease",
          }}
        >
          <FiHome size={16} />
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
