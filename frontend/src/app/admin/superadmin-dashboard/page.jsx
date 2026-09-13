"use client";

import { useCompany } from "@/context/CompanyContext";
import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import {
  FiMonitor,
  FiUsers,
  FiLayers,
  FiGrid,
  FiRefreshCw,
  FiShield,
  FiAlertTriangle,
  FiArrowLeft,
  FiBriefcase,
  FiCoffee,
  FiSearch,
  FiFilter,
  FiPlay,
  FiActivity,
  FiDatabase,
  FiHome,
  FiShoppingBag,
  FiEye,
  FiX,
  FiFileText
} from "react-icons/fi";
import Link from "next/link";
import styles from "./superAdminDashboard.module.css";

export default function SuperAdminDashboard() {
  const {
    user,
    industryOverride,
    changeIndustryOverride,
    industryCode,
    loading: contextLoading,
    changeCompanyOverride,
    companyOverride
  } = useCompany();

  const [activeTab, setActiveTab] = useState("clients");
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("ALL");
  
  // New States
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState(null);

  useEffect(() => {
    if (activeTab === "clients") {
      fetchCompanies();
    }
  }, [activeTab]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const res = await apiClient.get("/companies");
      if (res.data?.success) {
        setCompanies(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const roleUpper = (user?.role || "").toUpperCase();
  const isSuperAdmin = roleUpper.includes("SUPER");

  if (contextLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        Loading Super Admin Context...
      </div>
    );
  }

  // Access control
  if (!isSuperAdmin) {
    return (
      <div style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Inter, sans-serif"
      }}>
        <FiAlertTriangle size={48} style={{ color: "#ef4444", marginBottom: "16px" }} />
        <h2 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "22px", fontWeight: "700" }}>Access Denied</h2>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px", textAlign: "center", maxWidth: "400px" }}>
          You do not have the required Super Admin privileges to access this control center.
        </p>
        <Link 
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#0f172a",
            color: "#ffffff",
            padding: "10px 20px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "600"
          }}
        >
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const filteredCompanies = companies.filter((comp) => {
    const matchesSearch = comp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          comp.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === "ALL" || comp.industry?.code === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  return (
    <main className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <h1>
          <FiShield style={{ color: "#4f46e5" }} /> Super Admin Control Center
        </h1>
        <p>
          Oversee SaaS clients and manage global industry settings. Simulate tenant scopes to inspect live configurations.
        </p>
      </header>

      {/* TABS HEADER */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === "clients" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("clients")}
        >
          <FiDatabase size={16} /> SaaS Clients Directory
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "simulation" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("simulation")}
        >
          <FiRefreshCw size={16} /> Industry Simulation overrides
        </button>
      </div>

      {activeTab === "clients" && (
        <section>
          {/* SEARCH & FILTERS */}
          <div className={styles.filterSection}>
            <div style={{ display: "flex", flex: 1, gap: "10px", alignItems: "center" }}>
              <FiSearch style={{ color: "#94a3b8" }} />
              <input 
                type="text" 
                placeholder="Search clients by name or ID..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <FiFilter style={{ color: "#94a3b8" }} />
              <select 
                className={styles.filterSelect}
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <option value="ALL">All Industries</option>
                <option value="RETAIL">Retail & Commerce</option>
                <option value="GYM">Gym & Fitness</option>
                <option value="RESTAURANT">Restaurant & Food</option>
                <option value="TEXTILE">Textile Mill</option>
              </select>

              {/* View Toggle Columns Button */}
              <button 
                className={`${styles.toggleBtn} ${showAllColumns ? styles.toggleBtnActive : ""}`}
                onClick={() => setShowAllColumns(!showAllColumns)}
              >
                <FiEye size={14} />
                {showAllColumns ? "Basic View" : "View All Columns"}
              </button>
            </div>
            <button className={styles.resetBtn} onClick={() => { setSearchTerm(""); setIndustryFilter("ALL"); fetchCompanies(); }}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* ACTIVE SIMULATION BANNER */}
          {companyOverride && (
            <div className={styles.activeBanner} style={{ borderColor: "#10b981", background: "#f0fdf4" }}>
              <div className={styles.activeInfo}>
                <span className={styles.activeLabel} style={{ color: "#15803d" }}>Simulating Client:</span>
                <span className={styles.activeVal} style={{ background: "#dcfce7", color: "#15803d" }}>
                  {companyOverride.name} ({companyOverride.industry?.code})
                </span>
              </div>
              <button 
                className={styles.resetBtn}
                style={{ borderColor: "#15803d", color: "#15803d" }}
                onClick={() => changeCompanyOverride(null)}
              >
                Exit Simulation
              </button>
            </div>
          )}

          {/* CLIENTS TABLE */}
          {loadingCompanies ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
              Loading SaaS Client Data...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              No companies found matching filters.
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={`${styles.table} ${showAllColumns ? styles.tableWide : ""}`}>
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Industry</th>
                    <th>Status</th>
                    {showAllColumns && (
                      <>
                        <th>Branches</th>
                        <th>Warehouses</th>
                        <th>Products</th>
                        <th>Customers</th>
                        <th>Sales</th>
                        <th>Purchases</th>
                        <th>Staff / Users</th>
                      </>
                    )}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((comp) => (
                    <tr key={comp.id}>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>
                        <div>{comp.name}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 400, marginTop: "2px" }}>ID: {comp.id}</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.indBadge}`}>
                          {comp.industry?.name || comp.industryId}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${comp.status === "ACTIVE" ? styles.badgeActive : styles.badgeSuspended}`}>
                          {comp.status}
                        </span>
                      </td>
                      {showAllColumns && (
                        <>
                          <td>
                            <span className={styles.metricBadge}><FiHome size={12} /> {comp._count?.branches || 0}</span>
                          </td>
                          <td>
                            <span className={styles.metricBadge}><FiLayers size={12} /> {comp._count?.warehouses || 0}</span>
                          </td>
                          <td>
                            <span className={styles.metricBadge}><FiShoppingBag size={12} /> {comp._count?.products || 0}</span>
                          </td>
                          <td>
                            <span className={styles.metricBadge}><FiUsers size={12} /> {comp._count?.customers || 0}</span>
                          </td>
                          <td>
                            <span className={styles.metricBadge}><FiActivity size={12} /> {comp._count?.salesOrders || 0}</span>
                          </td>
                          <td>
                            <span className={styles.metricBadge}><FiBriefcase size={12} /> {comp._count?.purchases || 0}</span>
                          </td>
                          <td>
                            <span className={styles.metricBadge} style={{ background: "#f3e8ff", color: "#7e22ce" }}>
                              <FiUsers size={12} /> {comp._count?.users || 0}
                            </span>
                          </td>
                        </>
                      )}
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button 
                            className={styles.simulateLink}
                            onClick={() => changeCompanyOverride(comp)}
                          >
                            <FiPlay size={12} /> Simulate
                          </button>
                          <button 
                            className={styles.viewBtn}
                            onClick={() => setSelectedCompanyDetails(comp)}
                          >
                            <FiEye size={12} /> View Stats
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === "simulation" && (
        <section>
          {/* ACTIVE STATUS BANNER */}
          <section className={styles.activeBanner}>
            <div className={styles.activeInfo}>
              <span className={styles.activeLabel}>Active Context View:</span>
              <span className={styles.activeVal}>
                {industryOverride ? <FiRefreshCw size={14} style={{ marginRight: "4px" }} /> : null}
                {industryCode} {industryOverride ? "(OVERRIDDEN)" : "(DEFAULT)"}
              </span>
            </div>

            {industryOverride && (
              <button 
                className={styles.resetBtn}
                onClick={() => changeIndustryOverride(null)}
              >
                <FiRefreshCw size={14} />
                Reset to Default
              </button>
            )}
          </section>

          {/* CARDS GRID */}
          <div className={styles.cardsGrid}>
            {/* RETAIL CARD */}
            <div className={`${styles.card} ${styles.cardRetail} ${industryCode === "RETAIL" ? styles.cardActive : ""}`}>
              <div className={`${styles.cardIcon} ${styles.iconRetail}`}>
                <FiMonitor />
              </div>
              <h3>Retail & Commerce</h3>
              <p>Standard retail workflow including POS transactions, warehouses, product listings, invoices, and customers.</p>
              
              <div className={styles.modulesList}>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotRetail}`} />
                  <span>POS Sales Terminal & Barcodes</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotRetail}`} />
                  <span>Product, Brands, & Categories</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotRetail}`} />
                  <span>Inventory Stock & Vendors</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotRetail}`} />
                  <span>Invoices & Sales Orders</span>
                </div>
              </div>

              <button 
                className={`${styles.actionBtn} ${styles.btnRetail} ${industryCode === "RETAIL" ? styles.btnActive : ""}`}
                onClick={() => changeIndustryOverride("RETAIL")}
                disabled={industryCode === "RETAIL"}
              >
                {industryCode === "RETAIL" ? "Currently Simulating" : "Activate Retail View"}
              </button>
            </div>

            {/* GYM CARD */}
            <div className={`${styles.card} ${styles.cardGym} ${industryCode === "GYM" ? styles.cardActive : ""}`}>
              <div className={`${styles.cardIcon} ${styles.iconGym}`}>
                <FiUsers />
              </div>
              <h3>Gym & Fitness Club</h3>
              <p>Manage membership subscription plans, member profile logins, trainers, daily attendance logs, and fee payments.</p>
              
              <div className={styles.modulesList}>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotGym}`} />
                  <span>Member Profile Registration</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotGym}`} />
                  <span>Membership Subscription Plans</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotGym}`} />
                  <span>Trainer Allocation & Payroll</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotGym}`} />
                  <span>Attendance Logging & Payments</span>
                </div>
              </div>

              <button 
                className={`${styles.actionBtn} ${styles.btnGym} ${industryCode === "GYM" ? styles.btnActive : ""}`}
                onClick={() => changeIndustryOverride("GYM")}
                disabled={industryCode === "GYM"}
              >
                {industryCode === "GYM" ? "Currently Simulating" : "Activate Gym View"}
              </button>
            </div>

            {/* TEXTILE CARD */}
            <div className={`${styles.card} ${styles.cardTextile} ${industryCode === "TEXTILE" ? styles.cardActive : ""}`}>
              <div className={`${styles.cardIcon} ${styles.iconTextile}`}>
                <FiLayers />
              </div>
              <h3>Textile ERP Mill</h3>
              <p>Heavy manufacturing tracking for yarn mills, dye batches, production workflow status, raw materials, and quality audits.</p>
              
              <div className={styles.modulesList}>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotTextile}`} />
                  <span>Production Tracking & Mill Scheduling</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotTextile}`} />
                  <span>Yarn, Fabric, & Raw Materials</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotTextile}`} />
                  <span>Batch Quality Control Auditing</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={`${styles.moduleDot} ${styles.dotTextile}`} />
                  <span>Export Shipments & Mill Warehouses</span>
                </div>
              </div>

              <button 
                className={`${styles.actionBtn} ${styles.btnTextile} ${industryCode === "TEXTILE" ? styles.btnActive : ""}`}
                onClick={() => changeIndustryOverride("TEXTILE")}
                disabled={industryCode === "TEXTILE"}
              >
                {industryCode === "TEXTILE" ? "Currently Simulating" : "Activate Textile View"}
              </button>
            </div>

            {/* RESTAURANT CARD */}
            <div className={`${styles.card} ${industryCode === "RESTAURANT" ? styles.cardActive : ""}`} style={{ borderColor: industryCode === "RESTAURANT" ? "#f59e0b" : "#e2e8f0" }}>
              <div className={styles.cardIcon} style={{ background: "#fef3c7", color: "#d97706" }}>
                <FiCoffee />
              </div>
              <h3>Restaurant & Food ERP</h3>
              <p>Complete food service management with Dine-In/Takeaway POS, Table floor plans, KOT kitchen displays, recipe BOM, and food costing.</p>
              
              <div className={styles.modulesList}>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#f59e0b" }} />
                  <span>Restaurant POS & Floor Table Map</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#f59e0b" }} />
                  <span>Kitchen Display System (KDS) & KOT</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#f59e0b" }} />
                  <span>Recipe BOM & Auto Stock Deduction</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#f59e0b" }} />
                  <span>Food Costing & Wastage Logs</span>
                </div>
              </div>

              <button 
                className={styles.actionBtn}
                style={{
                  background: industryCode === "RESTAURANT" ? "#f59e0b" : "#fef3c7",
                  color: industryCode === "RESTAURANT" ? "#ffffff" : "#d97706",
                  border: "none"
                }}
                onClick={() => changeIndustryOverride("RESTAURANT")}
                disabled={industryCode === "RESTAURANT"}
              >
                {industryCode === "RESTAURANT" ? "Currently Simulating" : "Activate Restaurant View"}
              </button>
            </div>

            {/* LAUNDRY CARD */}
            <div className={`${styles.card} ${industryCode === "LAUNDRY" ? styles.cardActive : ""}`} style={{ borderColor: industryCode === "LAUNDRY" ? "#3b82f6" : "#e2e8f0" }}>
              <div className={styles.cardIcon} style={{ background: "#dbeafe", color: "#2563eb" }}>
                <FiLayers />
              </div>
              <h3>Laundry & Dry Cleaning</h3>
              <p>Complete laundry workflow covering POS orders, garments tracking, service categories, washing queue processing, pickup and delivery.</p>
              
              <div className={styles.modulesList}>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#3b82f6" }} />
                  <span>Laundry POS & Customer Order Creation</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#3b82f6" }} />
                  <span>Individual Garment Tagging & Barcodes</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#3b82f6" }} />
                  <span>Processing, Ready, & Delivery Queues</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#3b82f6" }} />
                  <span>Service Analytics & Performance Reports</span>
                </div>
              </div>

              <button 
                className={styles.actionBtn}
                style={{
                  background: industryCode === "LAUNDRY" ? "#3b82f6" : "#dbeafe",
                  color: industryCode === "LAUNDRY" ? "#ffffff" : "#2563eb",
                  border: "none"
                }}
                onClick={() => changeIndustryOverride("LAUNDRY")}
                disabled={industryCode === "LAUNDRY"}
              >
                {industryCode === "LAUNDRY" ? "Currently Simulating" : "Activate Laundry View"}
              </button>
            </div>

            {/* MEDICAL SHOP CARD */}
            <div className={`${styles.card} ${(industryCode === "MEDICAL_SHOP" || industryCode === "MEDICAL") ? styles.cardActive : ""}`} style={{ borderColor: (industryCode === "MEDICAL_SHOP" || industryCode === "MEDICAL") ? "#10b981" : "#e2e8f0" }}>
              <div className={styles.cardIcon} style={{ background: "#d1fae5", color: "#059669" }}>
                <FiActivity />
              </div>
              <h3>Medical Shop & Pharmacy</h3>
              <p>Regulatory-compliant pharmacy system with FEFO batch management, expiry warnings, prescription tracking, and supplier return logs.</p>
              
              <div className={styles.modulesList}>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#10b981" }} />
                  <span>Pharmacy POS with FEFO Batch Auto-Deduction</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#10b981" }} />
                  <span>Medicine Database & Expiry Warning periods</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#10b981" }} />
                  <span>Expiry & Low Stock Dashboard Alerts</span>
                </div>
                <div className={styles.moduleItem}>
                  <span className={styles.moduleDot} style={{ background: "#10b981" }} />
                  <span>Doctor Prescriptions & Batch Purchases</span>
                </div>
              </div>

              <button 
                className={styles.actionBtn}
                style={{
                  background: (industryCode === "MEDICAL_SHOP" || industryCode === "MEDICAL") ? "#10b981" : "#d1fae5",
                  color: (industryCode === "MEDICAL_SHOP" || industryCode === "MEDICAL") ? "#ffffff" : "#059669",
                  border: "none"
                }}
                onClick={() => changeIndustryOverride("MEDICAL_SHOP")}
                disabled={industryCode === "MEDICAL_SHOP" || industryCode === "MEDICAL"}
              >
                {(industryCode === "MEDICAL_SHOP" || industryCode === "MEDICAL") ? "Currently Simulating" : "Activate Medical View"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CLIENT STATS MODAL POPUP */}
      {selectedCompanyDetails && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCompanyDetails(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{selectedCompanyDetails.name} Overview</h2>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Client ID: {selectedCompanyDetails.id}</div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedCompanyDetails(null)}>
                <FiX />
              </button>
            </div>

            <div className={styles.modalGrid}>
              <div className={styles.modalCard}>
                <div className={styles.modalCardIcon}><FiHome /></div>
                <div className={styles.modalCardInfo}>
                  <span className={styles.modalCardLabel}>Branches</span>
                  <span className={styles.modalCardValue}>{selectedCompanyDetails._count?.branches || 0}</span>
                </div>
              </div>
              <div className={styles.modalCard}>
                <div className={styles.modalCardIcon}><FiLayers /></div>
                <div className={styles.modalCardInfo}>
                  <span className={styles.modalCardLabel}>Warehouses</span>
                  <span className={styles.modalCardValue}>{selectedCompanyDetails._count?.warehouses || 0}</span>
                </div>
              </div>
              <div className={styles.modalCard}>
                <div className={styles.modalCardIcon}><FiShoppingBag /></div>
                <div className={styles.modalCardInfo}>
                  <span className={styles.modalCardLabel}>Products</span>
                  <span className={styles.modalCardValue}>{selectedCompanyDetails._count?.products || 0}</span>
                </div>
              </div>
              <div className={styles.modalCard}>
                <div className={styles.modalCardIcon}><FiUsers /></div>
                <div className={styles.modalCardInfo}>
                  <span className={styles.modalCardLabel}>Customers</span>
                  <span className={styles.modalCardValue}>{selectedCompanyDetails._count?.customers || 0}</span>
                </div>
              </div>
              <div className={styles.modalCard}>
                <div className={styles.modalCardIcon}><FiActivity /></div>
                <div className={styles.modalCardInfo}>
                  <span className={styles.modalCardLabel}>Sales Orders</span>
                  <span className={styles.modalCardValue}>{selectedCompanyDetails._count?.salesOrders || 0}</span>
                </div>
              </div>
              <div className={styles.modalCard}>
                <div className={styles.modalCardIcon}><FiBriefcase /></div>
                <div className={styles.modalCardInfo}>
                  <span className={styles.modalCardLabel}>Purchases</span>
                  <span className={styles.modalCardValue}>{selectedCompanyDetails._count?.purchases || 0}</span>
                </div>
              </div>
              <div className={styles.modalCard} style={{ gridColumn: "span 2", background: "#f3e8ff" }}>
                <div className={styles.modalCardIcon} style={{ color: "#7e22ce" }}><FiUsers /></div>
                <div className={styles.modalCardInfo}>
                  <span className={styles.modalCardLabel} style={{ color: "#7e22ce" }}>Total Staff Accounts / Users</span>
                  <span className={styles.modalCardValue} style={{ color: "#7e22ce" }}>{selectedCompanyDetails._count?.users || 0}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                className={styles.resetBtn} 
                onClick={() => setSelectedCompanyDetails(null)}
              >
                Close
              </button>
              <button 
                className={styles.simulateLink} 
                onClick={() => {
                  changeCompanyOverride(selectedCompanyDetails);
                  setSelectedCompanyDetails(null);
                }}
              >
                <FiPlay /> Simulate Tenant Environment
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
