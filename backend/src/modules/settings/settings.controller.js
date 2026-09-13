import settingsService from "./settings.service.js";

// ==========================================
// Get System Settings
// ==========================================
export const getSettings = async (req, res) => {
  try {
    const settings = await settingsService.getSettings();
    return res.status(200).json({
      success: true,
      message: "Settings fetched successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings.",
    });
  }
};

// ==========================================
// Update System Settings
// ==========================================
export const updateSettings = async (req, res) => {
  try {
    const logoFilename = req.file ? req.file.filename : null;
    const updatedSettings = await settingsService.updateSettings(req.body, logoFilename);

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update settings.",
    });
  }
};

// ==========================================
// Upload Company Logo Only
// ==========================================
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No logo image file uploaded.",
      });
    }

    const updatedSettings = await settingsService.uploadLogo(req.file.filename);

    return res.status(200).json({
      success: true,
      message: "Company logo uploaded successfully.",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Upload Logo Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload logo image.",
    });
  }
};

// ==========================================
// Reset System Settings to Defaults
// ==========================================
export const resetSettings = async (req, res) => {
  try {
    const resetData = await settingsService.resetSettings();

    return res.status(200).json({
      success: true,
      message: "Settings reset to default successfully.",
      data: resetData,
    });
  } catch (error) {
    console.error("Reset Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset settings.",
    });
  }
};
