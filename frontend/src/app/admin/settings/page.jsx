"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiBriefcase,
  FiFileText,
  FiSave,
  FiRefreshCw,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiImage,
  FiTag,
  FiLayout,
  FiPrinter,
  FiAlertTriangle,
} from "react-icons/fi";
import { getSettings, updateSettings, resetSettings } from "@/services/settingsService";
import { getLandingPage, updateLandingPage } from "@/services/landingAdmin.service";
import { useSettings } from "@/context/SettingsContext";
import { useCompany } from "@/context/CompanyContext";
import styles from "./settings.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SettingsPage() {
  const { refreshSettings } = useSettings();
  const { user, loading: contextLoading } = useCompany();
  const [activeTab, setActiveTab] = useState("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [toast, setToast] = useState({ type: null, message: "" });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Landing Page Settings State
  const [landingLoading, setLandingLoading] = useState(false);
  const [landingSaving, setLandingSaving] = useState(false);
  const [landingForm, setLandingForm] = useState({
    logoText: "",
    logoHighlight: "",
    loginText: "",
    heroTag: "",
    heroTitle: "",
    heroDescription: "",
    heroButtonText: "",
    dashboardTitle: "",
    dashboardSubtitle: "",
    aboutTag: "",
    aboutTitle: "",
    aboutDescription: "",
    footerText: "",
  });

  const [landingFiles, setLandingFiles] = useState({
    heroImage: null,
    heroBackgroundImage: null,
    aboutImage1: null,
    aboutImage2: null,
    aboutImage3: null,
    aboutImage4: null,
  });

  const [landingPreview, setLandingPreview] = useState({
    heroImage: "",
    heroBackgroundImage: "",
    aboutImage1: "",
    aboutImage2: "",
    aboutImage3: "",
    aboutImage4: "",
  });

  const [formData, setFormData] = useState({
    // Business Info
    companyName: "",
    legalName: "",
    taxNumber: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    companyLogo: "",

    // Invoicing & Sales
    invoicePrefix: "INV-",
    salesOrderPrefix: "SO-",
    purchaseOrderPrefix: "PO-",
    defaultTaxRate: 0,
    enableMultiBranch: false,

    // Barcode & Paper
    receiptPaperSize: "80mm",
  });

  // Fetch Settings on Mount
  useEffect(() => {
    fetchSettingsData();
    loadLandingData();
  }, []);

  const loadLandingData = async () => {
    try {
      setLandingLoading(true);
      const data = await getLandingPage();
      if (data) {
        setLandingForm({
          logoText: data.logoText || "",
          logoHighlight: data.logoHighlight || "",
          loginText: data.loginText || "",
          heroTag: data.heroTag || "",
          heroTitle: data.heroTitle || "",
          heroDescription: data.heroDescription || "",
          heroButtonText: data.heroButtonText || "",
          dashboardTitle: data.dashboardTitle || "",
          dashboardSubtitle: data.dashboardSubtitle || "",
          aboutTag: data.aboutTag || "",
          aboutTitle: data.aboutTitle || "",
          aboutDescription: data.aboutDescription || "",
          footerText: data.footerText || "",
        });
        setLandingPreview({
          heroImage: data.heroImage ? `${API_URL}/uploads/landingpageimage/${data.heroImage}` : "",
          heroBackgroundImage: data.heroBackgroundImage ? `${API_URL}/uploads/landingpageimage/${data.heroBackgroundImage}` : "",
          aboutImage1: data.aboutImage1 ? `${API_URL}/uploads/landingpageimage/${data.aboutImage1}` : "",
          aboutImage2: data.aboutImage2 ? `${API_URL}/uploads/landingpageimage/${data.aboutImage2}` : "",
          aboutImage3: data.aboutImage3 ? `${API_URL}/uploads/landingpageimage/${data.aboutImage3}` : "",
          aboutImage4: data.aboutImage4 ? `${API_URL}/uploads/landingpageimage/${data.aboutImage4}` : "",
        });
      }
    } catch (err) {
      console.error("Load landing data error:", err);
    } finally {
      setLandingLoading(false);
    }
  };

  const handleLandingChange = (e) => {
    const { name, value } = e.target;
    setLandingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLandingImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = e.target.name;
    setLandingFiles((prev) => ({ ...prev, [name]: file }));
    setLandingPreview((prev) => ({ ...prev, [name]: URL.createObjectURL(file) }));
  };

  const handleLandingSubmit = async (e) => {
    e.preventDefault();
    try {
      setLandingSaving(true);
      const payload = new FormData();
      Object.keys(landingForm).forEach((key) => {
        payload.append(key, landingForm[key]);
      });
      Object.keys(landingFiles).forEach((key) => {
        if (landingFiles[key]) {
          payload.append(key, landingFiles[key]);
        }
      });
      await updateLandingPage(payload);
      showToast("success", "Landing page settings updated successfully!");
      await loadLandingData();
    } catch (err) {
      console.error("Update landing error:", err);
      showToast("error", err.message || "Failed to update landing page settings.");
    } finally {
      setLandingSaving(false);
    }
  };

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      if (data) {
        setFormData({
          companyName: data.companyName || "",
          legalName: data.legalName || "",
          taxNumber: data.taxNumber || "",
          companyEmail: data.companyEmail || "",
          companyPhone: data.companyPhone || "",
          companyAddress: data.companyAddress || "",
          companyLogo: data.companyLogo || "",

          invoicePrefix: data.invoicePrefix || "INV-",
          salesOrderPrefix: data.salesOrderPrefix || "SO-",
          purchaseOrderPrefix: data.purchaseOrderPrefix || "PO-",
          defaultTaxRate: data.defaultTaxRate !== undefined ? Number(data.defaultTaxRate) : 0,
          enableMultiBranch: Boolean(data.enableMultiBranch),

          receiptPaperSize: data.receiptPaperSize || "80mm",
        });

        if (data.companyLogo) {
          setLogoPreview(`${API_URL}/uploads/${data.companyLogo}`);
        } else {
          setLogoPreview(null);
        }
      }
    } catch (error) {
      showToast("error", error.message || "Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast({ type: null, message: "" });
    }, 4000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("error", "Please select a valid image file (PNG, JPG, WEBP).");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let payload;

      if (logoFile) {
        payload = new FormData();
        Object.keys(formData).forEach((key) => {
          payload.append(key, formData[key]);
        });
        payload.append("companyLogo", logoFile);
      } else {
        payload = formData;
      }

      const res = await updateSettings(payload);
      showToast("success", res.message || "Settings saved successfully!");
      if (res.data?.companyLogo) {
        setLogoPreview(`${API_URL}/uploads/${res.data.companyLogo}`);
      }
      setLogoFile(null);
      await refreshSettings();
    } catch (error) {
      showToast("error", error.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfirm = async () => {
    try {
      setResetting(true);
      const res = await resetSettings();
      showToast("success", res.message || "Settings reset to default successfully.");
      setShowResetModal(false);
      await fetchSettingsData();
      await refreshSettings();
    } catch (error) {
      showToast("error", error.message || "Failed to reset settings.");
    } finally {
      setResetting(false);
    }
  };

  const roleUpper = (user?.role || user?.roleRef?.name || user?.type || "").toUpperCase();
  const isSuperAdmin = roleUpper.includes("SUPER");

  if (contextLoading) {
    return (
      <div className={styles.container}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", gap: "12px", color: "#64748b" }}>
          <FiRefreshCw className="animate-spin" style={{ fontSize: "1.5rem" }} />
          <span>Verifying Super Admin privileges...</span>
        </div>
      </div>
    );
  }

  // Access Control: Super Admin Only
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
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px", textAlign: "center", maxWidth: "420px" }}>
          You do not have the required Super Admin privileges to access System Settings. This control center is restricted exclusively to Super Administrators.
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
            fontWeight: "600",
            transition: "all 0.2s ease"
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", gap: "12px", color: "#64748b" }}>
          <FiRefreshCw className="animate-spin" style={{ fontSize: "1.5rem" }} />
          <span>Loading system configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>
            <FiBriefcase /> System Settings
          </h1>
          <p>Configure company profile, invoicing prefixes, tax rates, barcode printing, and landing page settings.</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnReset}
            onClick={() => setShowResetModal(true)}
            disabled={saving || resetting}
          >
            <FiRefreshCw /> Reset Defaults
          </button>

          <button
            type="button"
            className={styles.btnSave}
            onClick={handleSubmit}
            disabled={saving || resetting}
          >
            <FiSave /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast.type && (
        <div className={toast.type === "success" ? styles.toastSuccess : styles.toastError}>
          {toast.type === "success" ? <FiCheckCircle style={{ fontSize: "1.2rem" }} /> : <FiAlertCircle style={{ fontSize: "1.2rem" }} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Tabs Shell */}
      <div className={styles.tabsShell}>
        {/* Navigation Sidebar */}
        <nav className={styles.tabNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "business" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("business")}
          >
            <FiBriefcase className={styles.tabIcon} />
            <span>Business Profile</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "invoicing" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("invoicing")}
          >
            <FiFileText className={styles.tabIcon} />
            <span>Invoicing & Sales</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "barcode" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("barcode")}
          >
            <FiTag className={styles.tabIcon} />
            <span>Barcode Printing</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "landing" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("landing")}
          >
            <FiLayout className={styles.tabIcon} />
            <span>Landing Page Settings</span>
          </button>
        </nav>

        {/* Tab Content Panels */}
        <div className={styles.tabContent}>
          <form onSubmit={handleSubmit}>
            {/* Tab 1: Business Profile */}
            {activeTab === "business" && (
              <div>
                <div className={styles.sectionHeader}>
                  <h2>Business Details & Identity</h2>
                  <p>Company branding, tax registration, contact information, and main address.</p>
                </div>

                <div className={styles.formGrid}>
                  {/* Logo Upload Dropzone */}
                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>Company Logo</label>
                    <div className={styles.logoWrapper}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Company Logo" className={styles.logoPreview} />
                      ) : (
                        <div className={styles.logoPlaceholder}>
                          <FiImage />
                        </div>
                      )}

                      <div className={styles.logoActions}>
                        <label htmlFor="logo-upload" className={styles.uploadBtn}>
                          <FiUploadCloud /> Upload New Logo
                        </label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          style={{ display: "none" }}
                        />
                        <span className={styles.logoHelp}>Recommended format: PNG, JPG, or SVG (Max 5MB).</span>
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.formGrid} ${styles.formGrid2}`}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Company Name *</label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className={styles.input}
                        required
                        placeholder="e.g. ERP Enterprise Ltd"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Legal / Trade Name</label>
                      <input
                        type="text"
                        name="legalName"
                        value={formData.legalName}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="e.g. ERP Solutions Inc."
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Tax / VAT Registration Number</label>
                      <input
                        type="text"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="e.g. TAX-99887766"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Official Business Email</label>
                      <input
                        type="email"
                        name="companyEmail"
                        value={formData.companyEmail}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="support@company.com"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Business Phone Number</label>
                      <input
                        type="text"
                        name="companyPhone"
                        value={formData.companyPhone}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div className={styles.formGroupFull}>
                      <label className={styles.label}>Headquarters Address</label>
                      <textarea
                        name="companyAddress"
                        value={formData.companyAddress}
                        onChange={handleInputChange}
                        className={styles.textarea}
                        placeholder="Enter full street, city, state and country..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Invoicing & Sales */}
            {activeTab === "invoicing" && (
              <div>
                <div className={styles.sectionHeader}>
                  <h2>Invoicing, Sales & Order Prefixes</h2>
                  <p>Customize numbering prefixes for invoices, sales orders, purchase orders, and tax rates.</p>
                </div>

                <div className={`${styles.formGrid} ${styles.formGrid2}`}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Invoice Number Prefix</label>
                    <input
                      type="text"
                      name="invoicePrefix"
                      value={formData.invoicePrefix}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="e.g. INV-"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Sales Order Number Prefix</label>
                    <input
                      type="text"
                      name="salesOrderPrefix"
                      value={formData.salesOrderPrefix}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="e.g. SO-"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Purchase Order Number Prefix</label>
                    <input
                      type="text"
                      name="purchaseOrderPrefix"
                      value={formData.purchaseOrderPrefix}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="e.g. PO-"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Default Sales Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      name="defaultTaxRate"
                      value={formData.defaultTaxRate}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder="10.00"
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <div className={styles.toggleRow}>
                      <div className={styles.toggleText}>
                        <h4>Enable Multi-Branch Mode</h4>
                        <p>Allow managing orders, inventories, and transactions across multiple store branches.</p>
                      </div>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          name="enableMultiBranch"
                          checked={formData.enableMultiBranch}
                          onChange={handleInputChange}
                        />
                        <span className={styles.slider}></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Barcode Printing */}
            {activeTab === "barcode" && (
              <div>
                <div className={styles.sectionHeader}>
                  <h2>Barcode Generation & Printing Configuration</h2>
                  <p>Configure default barcode dimensions, paper sizing, and open the barcode generator tool.</p>
                </div>

                <div className={styles.formCard}>
                  <div style={{ padding: "20px", borderRadius: "12px", background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                      <h3 style={{ margin: 0, color: "#1e3a8a", fontSize: "17px", fontWeight: "700" }}>Barcode Printer & Generator Tool</h3>
                      <p style={{ margin: "4px 0 0 0", color: "#1e40af", fontSize: "13px" }}>Select products, pick paper grid formats, and print customized product price tags and barcodes.</p>
                    </div>
                    <Link href="/admin/pos/barcode-print" style={{ textDecoration: "none" }}>
                      <button type="button" style={{ padding: "10px 20px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <FiPrinter /> Open Barcode Printer
                      </button>
                    </Link>
                  </div>

                  <div className={`${styles.formGrid} ${styles.formGrid2}`}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Default Receipt & Label Paper Size</label>
                      <select
                        name="receiptPaperSize"
                        value={formData.receiptPaperSize}
                        onChange={handleInputChange}
                        className={styles.select}
                      >
                        <option value="80mm">80mm Thermal Receipt Paper</option>
                        <option value="58mm">58mm Small Thermal Paper</option>
                        <option value="grid40">A4 Sheet (40 Labels per Page)</option>
                        <option value="grid24">A4 Sheet (24 Labels per Page)</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Barcode Type / Encoding Standard</label>
                      <select className={styles.select} defaultValue="CODE128">
                        <option value="CODE128">CODE128 (Standard Product Barcode)</option>
                        <option value="EAN13">EAN-13 (International Commercial)</option>
                        <option value="UPC">UPC-A (Retail Universal)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Landing Page Settings */}
            {activeTab === "landing" && (
              <div>
                <div className={styles.sectionHeader}>
                  <h2>Landing Page Content & Branding</h2>
                  <p>Customize hero text, tags, navbar titles, section headings, about section, and landing images.</p>
                </div>

                <div className={styles.formCard}>
                  {landingLoading ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading Landing Page settings...</div>
                  ) : (
                    <div>
                      {/* Navbar Settings */}
                      <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "#0f172a" }}>Navbar Configuration</h3>
                      <div className={`${styles.formGrid} ${styles.formGrid2}`}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Logo Text</label>
                          <input
                            type="text"
                            name="logoText"
                            value={landingForm.logoText}
                            onChange={handleLandingChange}
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Logo Highlight Word</label>
                          <input
                            type="text"
                            name="logoHighlight"
                            value={landingForm.logoHighlight}
                            onChange={handleLandingChange}
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Login Button Label</label>
                          <input
                            type="text"
                            name="loginText"
                            value={landingForm.loginText}
                            onChange={handleLandingChange}
                            className={styles.input}
                          />
                        </div>
                      </div>

                      {/* Hero Section Settings */}
                      <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "24px 0 16px 0", color: "#0f172a" }}>Hero Banner Section</h3>
                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>Hero Badge / Tagline</label>
                        <input
                          type="text"
                          name="heroTag"
                          value={landingForm.heroTag}
                          onChange={handleLandingChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>Hero Main Title</label>
                        <input
                          type="text"
                          name="heroTitle"
                          value={landingForm.heroTitle}
                          onChange={handleLandingChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>Hero Description Paragraph</label>
                        <textarea
                          name="heroDescription"
                          rows="4"
                          value={landingForm.heroDescription}
                          onChange={handleLandingChange}
                          className={styles.textarea}
                        />
                      </div>

                      <div className={`${styles.formGrid} ${styles.formGrid2}`}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Hero Button Text</label>
                          <input
                            type="text"
                            name="heroButtonText"
                            value={landingForm.heroButtonText}
                            onChange={handleLandingChange}
                            className={styles.input}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Dashboard Showcase Title</label>
                          <input
                            type="text"
                            name="dashboardTitle"
                            value={landingForm.dashboardTitle}
                            onChange={handleLandingChange}
                            className={styles.input}
                          />
                        </div>
                      </div>

                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>Hero Image Upload</label>
                        <input
                          type="file"
                          name="heroImage"
                          accept="image/*"
                          onChange={handleLandingImageChange}
                          className={styles.input}
                        />
                        {landingPreview.heroImage && (
                          <div style={{ marginTop: "8px" }}>
                            <img src={landingPreview.heroImage} alt="Hero Preview" style={{ maxHeight: "120px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                          </div>
                        )}
                      </div>

                      {/* About Section Settings */}
                      <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "24px 0 16px 0", color: "#0f172a" }}>About & Features Section</h3>
                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>About Section Title</label>
                        <input
                          type="text"
                          name="aboutTitle"
                          value={landingForm.aboutTitle}
                          onChange={handleLandingChange}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>About Description</label>
                        <textarea
                          name="aboutDescription"
                          rows="4"
                          value={landingForm.aboutDescription}
                          onChange={handleLandingChange}
                          className={styles.textarea}
                        />
                      </div>

                      {/* Footer */}
                      <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "24px 0 16px 0", color: "#0f172a" }}>Footer Note</h3>
                      <div className={styles.formGroupFull}>
                        <label className={styles.label}>Footer Text</label>
                        <input
                          type="text"
                          name="footerText"
                          value={landingForm.footerText}
                          onChange={handleLandingChange}
                          className={styles.input}
                        />
                      </div>

                      <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={handleLandingSubmit}
                          disabled={landingSaving}
                          className={styles.btnSave}
                        >
                          <FiSave /> {landingSaving ? "Saving Landing Page..." : "Save Landing Page Settings"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>
              <FiAlertCircle />
            </div>
            <h3>Reset All Settings?</h3>
            <p>Are you sure you want to restore all system configuration settings to factory default values? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnConfirmDanger}
                onClick={handleResetConfirm}
                disabled={resetting}
              >
                {resetting ? "Resetting..." : "Yes, Reset Defaults"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
