"use client";

import { useRouter } from "next/navigation";
import { FiShield, FiArrowLeft, FiHome } from "react-icons/fi";
import { useCompany } from "@/context/CompanyContext";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, isTextile, isRetail, isRestaurant, isLaundry, isGym } = useCompany();

  const handleGoBack = () => {
    if (isTextile) {
      const role = (user?.role || "").toLowerCase();
      if (role.includes("weaver") || role.includes("dyer")) {
        router.push("/textile/production");
        return;
      }
      if (role.includes("quality") || role.includes("qc")) {
        router.push("/textile/quality-control");
        return;
      }
      router.push("/admin/dashboard");
      return;
    }
    router.push("/admin/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "40px 32px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#fee2e2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
          }}
        >
          <FiShield size={32} />
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>
          Access Restricted (403)
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0", lineHeight: "1.5" }}>
          Your role <strong>{user?.role || "Staff Member"}</strong> does not have permission to access this module or URL.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={handleGoBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "#0d9488",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <FiHome size={16} /> Return to Allowed Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
