"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiTrendingUp,
  FiPackage,
  FiDollarSign,
  FiMonitor,
  FiUsers,
} from "react-icons/fi";
import styles from "./DashboardNav.module.css";

const DASHBOARD_TABS = [
  { label: "ERP Overview", href: "/dashboard", icon: FiGrid },
  { label: "Sales Analytics", href: "/dashboard/sales-dashboard", icon: FiTrendingUp },
  { label: "Inventory & Stock", href: "/dashboard/inventory-dashboard", icon: FiPackage },
  { label: "Finance & Revenue", href: "/dashboard/finance-dashboard", icon: FiDollarSign },
  { label: "POS Operations", href: "/dashboard/pos-dashboard", icon: FiMonitor },
  { label: "HRM & Staff", href: "/dashboard/hrm-dashboard", icon: FiUsers },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className={styles.navWrapper}>
      <div className={styles.navContainer}>
        {DASHBOARD_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tabBtn} ${isActive ? styles.activeTab : ""}`}
            >
              <Icon className={styles.icon} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
