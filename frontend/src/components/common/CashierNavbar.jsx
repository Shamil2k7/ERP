"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import { FiMonitor, FiClock, FiLogOut, FiUser, FiShoppingBag } from "react-icons/fi";
import styles from "./CashierNavbar.module.css";

export default function CashierNavbar() {
  const pathname = usePathname();
  const { user, company, clearSession } = useCompany();

  const handleLogout = () => {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  };

  const isPosActive = pathname === "/pos";
  const isHistoryActive = pathname === "/pos/history";

  return (
    <header className={styles.navbar}>
      {/* Brand & Mode */}
      <div className={styles.leftSection}>
        <div className={styles.brandLogo}>
          <FiShoppingBag className={styles.brandIcon} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>{company?.name || "Retail ERP"}</span>
            <span className={styles.roleBadge}>POS CASHIER</span>
          </div>
        </div>

        {/* Cashier Navigation Items */}
        <nav className={styles.navMenu}>
          <Link
            href="/pos"
            className={`${styles.navItem} ${isPosActive ? styles.active : ""}`}
            id="nav-cashier-pos"
          >
            <FiMonitor className={styles.navIcon} />
            <span>POS Terminal</span>
          </Link>

          <Link
            href="/pos/history"
            className={`${styles.navItem} ${isHistoryActive ? styles.active : ""}`}
            id="nav-cashier-history"
          >
            <FiClock className={styles.navIcon} />
            <span>POS Sales History</span>
          </Link>
        </nav>
      </div>

      {/* Right User Section */}
      <div className={styles.rightSection}>
        <div className={styles.userProfile}>
          <div className={styles.avatarBox}>
            <FiUser />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name || "Cashier User"}</span>
            <span className={styles.userRole}>Cashier</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className={styles.logoutBtn}
          title="Sign Out"
          id="btn-cashier-logout"
        >
          <FiLogOut className={styles.logoutIcon} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
