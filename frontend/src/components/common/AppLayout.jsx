"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/adminPanel/Sidebar/Sidebar";
import Header from "@/components/adminPanel/Header/Header";
import CashierNavbar from "@/components/common/CashierNavbar";
import { SettingsProvider } from "@/context/SettingsContext";
import { AlertProvider } from "@/context/AlertContext";
import { CompanyProvider, useCompany } from "@/context/CompanyContext";
import IndustryRouteGuard from "@/components/common/IndustryRouteGuard";
import styles from "./AppLayout.module.css";

function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLaundry, isRestaurant, isGym, isTextile, clearSession } = useCompany();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const roleUpper = (user?.role || "").toUpperCase();
  const isCashier = roleUpper.includes("CASHIER");
  const isRetailCashier = isCashier && !isLaundry && !isRestaurant && !isGym && !isTextile;

  const posRoute = isLaundry ? "/laundry/pos" : isRestaurant ? "/restaurant/pos" : "/pos";

  // Redirect Cashier away from Dashboard directly to POS Screen
  useEffect(() => {
    if (isCashier && (pathname === "/dashboard" || pathname === "/")) {
      router.replace(posRoute);
    }
  }, [isCashier, pathname, posRoute, router]);

  // Dedicated Full-Width Top-Nav Layout for Retail Cashier Only
  if (isRetailCashier) {
    return (
      <div className={styles.cashierAppWrapper}>
        <CashierNavbar />
        <main className={styles.cashierPageBody}>
          <IndustryRouteGuard>{children}</IndustryRouteGuard>
        </main>
      </div>
    );
  }

  // Standard ERP Layout with Sidebar for Admins/Managers and other ERP modes
  return (
    <div className={styles.appWrapper}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {sidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}

      <div className={styles.mainContent}>
        <Header toggleSidebar={toggleSidebar} />
        <main className={styles.pageBody}>
          <IndustryRouteGuard>{children}</IndustryRouteGuard>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  const pathname = usePathname();

  // Exclude public landing page and auth routes from ERP sidebar/topbar shell
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/auth");

  if (isPublicPage) {
    return (
      <CompanyProvider>
        <SettingsProvider>
          <AlertProvider>{children}</AlertProvider>
        </SettingsProvider>
      </CompanyProvider>
    );
  }

  return (
    <CompanyProvider>
      <SettingsProvider>
        <AlertProvider>
          <AppShell>{children}</AppShell>
        </AlertProvider>
      </SettingsProvider>
    </CompanyProvider>
  );
}
