"use client";

import { useEffect } from "react";
import DashboardHome from "@/components/adminPanel/DashboardHome/DashboardHome";
import GymDashboard from "@/components/gym/GymDashboard";
import TextileDashboard from "@/components/textile/TextileDashboard";
import SingleRestaurantDashboard from "@/components/restaurant/SingleRestaurantDashboard";
import LaundryDashboardPage from "@/app/laundry/dashboard/page";
import MedicalDashboardPage from "@/app/medical/dashboard/page";
import { useCompany } from "@/context/CompanyContext";
import { useRouter } from "next/navigation";

const DASHBOARD_REGISTRY = {
  RETAIL: DashboardHome,
  GYM: GymDashboard,
  TEXTILE: TextileDashboard,
  RESTAURANT: SingleRestaurantDashboard,
  LAUNDRY: LaundryDashboardPage,
  MEDICAL_SHOP: MedicalDashboardPage,
  MEDICAL: MedicalDashboardPage,
};

export default function DashboardPage() {
  const { user, industryCode, loading } = useCompany();
  const router = useRouter();

  const codeUpper = (industryCode || "RETAIL").toUpperCase();

  useEffect(() => {
    if (!loading && user && codeUpper === "LAUNDRY") {
      const roleUpper = (user.role || user.roleRef?.name || user.type || "").toUpperCase().replace(/[\s-]+/g, "_");
      const isAdmin = roleUpper.includes("SUPER") || roleUpper.includes("ADMIN") || roleUpper.includes("OWNER");
      const isManager = roleUpper.includes("MANAGER");

      if (!isAdmin && !isManager) {
        if (roleUpper.includes("CASHIER") || roleUpper.includes("BILLING") || roleUpper.includes("COUNTER") || roleUpper.includes("POS")) {
          router.replace("/laundry/pos");
        } else if (roleUpper.includes("DELIVERY") || roleUpper.includes("DRIVER") || roleUpper.includes("RIDER")) {
          router.replace("/laundry/delivery");
        } else {
          router.replace("/laundry/orders");
        }
      }
    }
  }, [user, loading, codeUpper, router]);

  if (loading) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
        Loading Dashboard...
      </div>
    );
  }

  const DashboardComponent = DASHBOARD_REGISTRY[codeUpper] || DashboardHome;

  return (
    <div>
      <DashboardComponent />
    </div>
  );
}
