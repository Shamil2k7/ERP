import prisma from "../../config/prisma.js";

const DEFAULT_SETTINGS = {
  companyName: "ERP Enterprise Ltd",
  legalName: "ERP Enterprise Solutions Inc.",
  taxNumber: "TAX-99887766",
  companyEmail: "support@erp-enterprise.com",
  companyPhone: "+1 (555) 019-2834",
  companyAddress: "100 Innovation Way, Suite 400, Tech Park, NY 10001",
  companyLogo: null,

  currency: "USD",
  currencySymbol: "$",
  timezone: "UTC",
  dateFormat: "YYYY-MM-DD",
  fiscalYearStart: "January",

  invoicePrefix: "INV-",
  salesOrderPrefix: "SO-",
  purchaseOrderPrefix: "PO-",
  defaultTaxRate: 10.00,
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

class SettingsRepository {
  // ==========================================
  // Get or Initialize System Settings
  // ==========================================
  async getSettings() {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return settings;
  }

  // ==========================================
  // Update Settings
  // ==========================================
  async updateSettings(id, data) {
    return await prisma.systemSettings.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // Reset Settings to Defaults
  // ==========================================
  async resetSettings(id) {
    return await prisma.systemSettings.update({
      where: { id },
      data: DEFAULT_SETTINGS,
    });
  }
}

export default new SettingsRepository();
