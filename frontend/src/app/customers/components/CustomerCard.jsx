"use client";

import Link from "next/link";
import {
  FiArrowLeft,
  FiEdit2,
  FiPrinter,
  FiTrash2,
  FiPhone,
  FiMail,
  FiMapPin,
  FiAward,
  FiCreditCard,
  FiDollarSign,
  FiCalendar,
  FiUserCheck,
} from "react-icons/fi";
import styles from "../customers.module.css";

export default function CustomerCard({ customer, onDelete }) {
  if (!customer) return null;

  const customerName =
    customer.name ||
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "Customer Profile";
  const initials = customerName.substring(0, 2).toUpperCase();
  const creditLimit = Number(customer.creditLimit || 0);
  const currentBalance = Number(customer.currentBalance || 0);
  const availableCredit = Math.max(0, creditLimit - currentBalance);
  const formattedDate = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : customer.joinedDate || "N/A";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.page} style={{ padding: "0" }}>
      {/* HEADER BAR */}
      <div className={styles.detailsHeader}>
        <div className={styles.headerLeft}>
          <Link href="/customers" className={styles.backButton} title="Back to Customers">
            <FiArrowLeft size={18} />
          </Link>
          <div>
            <h1>{customerName}</h1>
            <p>Customer Profile • ID: #{customer.id}</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={handlePrint}>
            <FiPrinter size={15} />
            Print Profile
          </button>

          <Link href={`/customers/edit/${customer.id}`} className={styles.addButton}>
            <FiEdit2 size={15} />
            Edit Profile
          </Link>

          {onDelete && (
            <button
              type="button"
              className={styles.secondaryButton}
              style={{ color: "#dc2626", borderColor: "#fecaca" }}
              onClick={() => onDelete(customer)}
            >
              <FiTrash2 size={15} />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* OVERVIEW PROFILE CARD */}
      <div className={styles.profileCard}>
        <div className={styles.profileTop}>
          <div className={styles.profileMain}>
            <div className={styles.avatarLarge}>{initials}</div>
            <div className={styles.profileInfo}>
              <h2>{customerName}</h2>
              <p>ID: {customer.id}</p>
            </div>
          </div>

          <span className={styles.activeBadge}>
            <FiUserCheck style={{ display: "inline", marginRight: "4px" }} />
            Active Customer
          </span>
        </div>

        <div className={styles.profileMetaGrid}>
          <div className={styles.metaItem}>
            <span>Phone Number</span>
            <strong>{customer.phone || "—"}</strong>
          </div>

          <div className={styles.metaItem}>
            <span>Email Address</span>
            <strong>{customer.email || "—"}</strong>
          </div>

          <div className={styles.metaItem}>
            <span>Loyalty ID</span>
            <strong>{customer.loyaltyId || "—"}</strong>
          </div>

          <div className={styles.metaItem}>
            <span>Registered Date</span>
            <strong>{formattedDate}</strong>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
            <FiAward />
          </div>
          <div className={styles.statMeta}>
            <span>Loyalty Tier</span>
            <h3>{customer.loyaltyId ? "Member" : "Standard"}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <FiCreditCard />
          </div>
          <div className={styles.statMeta}>
            <span>Credit Limit</span>
            <h3>${creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <FiDollarSign />
          </div>
          <div className={styles.statMeta}>
            <span>Current Balance</span>
            <h3>${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
            <FiCreditCard />
          </div>
          <div className={styles.statMeta}>
            <span>Available Credit</span>
            <h3>${availableCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* TWO COLUMN CONTENT GRID */}
      <div className={styles.contentGrid}>
        {/* LEFT COLUMN: Customer Information */}
        <div className={styles.leftColumn}>
          <div className={styles.cardSection}>
            <div className={styles.cardSectionHeader}>
              <h3>Customer Contact Information</h3>
            </div>

            <div className={styles.infoGrid2}>
              <div className={styles.metaItem}>
                <span>Full Name</span>
                <strong>{customerName}</strong>
              </div>

              <div className={styles.metaItem}>
                <span>Phone Number</span>
                <strong>{customer.phone || "—"}</strong>
              </div>

              <div className={styles.metaItem}>
                <span>Email Address</span>
                <strong>{customer.email || "—"}</strong>
              </div>

              <div className={styles.metaItem}>
                <span>Loyalty ID</span>
                <strong>{customer.loyaltyId || "None"}</strong>
              </div>

              <div className={styles.formGroupFull} style={{ gridColumn: "1 / -1", marginTop: "10px" }}>
                <span style={{ fontSize: "12px", color: "#8992a2", marginBottom: "5px", fontWeight: 500 }}>
                  Billing Address
                </span>
                <strong style={{ fontSize: "14px", color: "#1e293b" }}>
                  {customer.address || "No address on file."}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Financial Summary */}
        <div className={styles.rightColumn}>
          <div className={styles.cardSection}>
            <div className={styles.cardSectionHeader}>
              <h3>Financial Summary</h3>
            </div>

            <div className={styles.infoGrid2} style={{ gridTemplateColumns: "1fr" }}>
              <div className={styles.metaItem}>
                <span>Credit Limit</span>
                <strong style={{ fontSize: "16px", color: "#2563eb" }}>
                  ${creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div className={styles.metaItem}>
                <span>Current Outstanding Balance</span>
                <strong style={{ fontSize: "16px", color: "#059669" }}>
                  ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
              </div>

              <div className={styles.metaItem}>
                <span>Available Remaining Credit</span>
                <strong style={{ fontSize: "16px", color: "#ea580c" }}>
                  ${availableCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}