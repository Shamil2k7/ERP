"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSettings } from "@/services/settingsService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DEFAULT_SETTINGS = {
  companyName: "ERP Enterprise Ltd",
  legalName: "ERP Enterprise Solutions Inc.",
  taxNumber: "TAX-99887766",
  companyEmail: "support@erp-enterprise.com",
  companyPhone: "+1 (555) 019-2834",
  companyAddress: "100 Innovation Way, Suite 400, Tech Park, NY 10001",
  companyLogo: null,
  currency: "INR",
  currencySymbol: "₹",
  timezone: "UTC",
  dateFormat: "YYYY-MM-DD",
  fiscalYearStart: "January",
  invoicePrefix: "INV-",
  salesOrderPrefix: "SO-",
  purchaseOrderPrefix: "PO-",
  defaultTaxRate: 10.0,
  enableMultiBranch: false,
  enableStockAlerts: true,
  lowStockThreshold: 10,
  receiptHeader: "Welcome to ERP Store",
  receiptFooter: "Thank you for shopping with us! Please come again.",
  receiptPaperSize: "80mm",
  autoPrintReceipt: true,
  showTaxOnReceipt: true,
  emailNotifications: true,
  dailyReportEmail: false,
  sessionTimeoutMinutes: 60,
  themePreference: "system",
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  logoUrl: null,
  loading: true,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (error) {
      console.warn("Failed to load settings in SettingsProvider:", error?.message || error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const logoUrl = settings.companyLogo
    ? `${API_URL}/uploads/${settings.companyLogo}`
    : null;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        logoUrl,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
