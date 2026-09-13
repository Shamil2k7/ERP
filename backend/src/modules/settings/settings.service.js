import settingsRepository from "./settings.repository.js";
import { validatePhoneNumber, cleanPhoneNumber } from "../../utils/phoneValidator.js";

class SettingsService {
  // ==========================================
  // Fetch System Settings
  // ==========================================
  async getSettings() {
    return await settingsRepository.getSettings();
  }

  // ==========================================
  // Update Settings Data
  // ==========================================
  async updateSettings(updateData, logoFilename = null) {
    const currentSettings = await settingsRepository.getSettings();

    const formattedData = {};

    if (updateData.companyPhone !== undefined && updateData.companyPhone !== null && String(updateData.companyPhone).trim() !== "") {
      const cleaned = cleanPhoneNumber(updateData.companyPhone);
      if (!validatePhoneNumber(cleaned, true)) {
        throw new Error("Phone number must contain exactly 10 digits");
      }
      formattedData.companyPhone = cleaned;
    }


    // String fields
    const stringFields = [
      "companyName",
      "legalName",
      "taxNumber",
      "companyEmail",
      "companyPhone",
      "companyAddress",
      "currency",
      "currencySymbol",
      "timezone",
      "dateFormat",
      "fiscalYearStart",
      "invoicePrefix",
      "salesOrderPrefix",
      "purchaseOrderPrefix",
      "receiptHeader",
      "receiptFooter",
      "receiptPaperSize",
      "themePreference",
    ];

    stringFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        formattedData[field] = String(updateData[field]).trim();
      }
    });

    // Boolean fields
    const booleanFields = [
      "enableMultiBranch",
      "enableStockAlerts",
      "autoPrintReceipt",
      "showTaxOnReceipt",
      "emailNotifications",
      "dailyReportEmail",
    ];

    booleanFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        formattedData[field] = updateData[field] === true || updateData[field] === "true";
      }
    });

    // Numeric fields
    if (updateData.defaultTaxRate !== undefined && updateData.defaultTaxRate !== "") {
      formattedData.defaultTaxRate = parseFloat(updateData.defaultTaxRate);
    }

    if (updateData.lowStockThreshold !== undefined && updateData.lowStockThreshold !== "") {
      formattedData.lowStockThreshold = parseInt(updateData.lowStockThreshold, 10);
    }

    if (updateData.sessionTimeoutMinutes !== undefined && updateData.sessionTimeoutMinutes !== "") {
      formattedData.sessionTimeoutMinutes = parseInt(updateData.sessionTimeoutMinutes, 10);
    }

    // Logo image file
    if (logoFilename) {
      formattedData.companyLogo = logoFilename;
    }

    return await settingsRepository.updateSettings(currentSettings.id, formattedData);
  }

  // ==========================================
  // Upload Company Logo
  // ==========================================
  async uploadLogo(filename) {
    const currentSettings = await settingsRepository.getSettings();
    return await settingsRepository.updateSettings(currentSettings.id, {
      companyLogo: filename,
    });
  }

  // ==========================================
  // Reset Settings
  // ==========================================
  async resetSettings() {
    const currentSettings = await settingsRepository.getSettings();
    return await settingsRepository.resetSettings(currentSettings.id);
  }
}

export default new SettingsService();
