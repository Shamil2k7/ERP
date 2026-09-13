export const validateSettingsInput = (req, res, next) => {
  const { companyEmail, defaultTaxRate, lowStockThreshold, sessionTimeoutMinutes } = req.body;

  if (companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid company email address.",
    });
  }

  if (defaultTaxRate !== undefined && defaultTaxRate !== "") {
    const tax = parseFloat(defaultTaxRate);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      return res.status(400).json({
        success: false,
        message: "Default Tax Rate must be a number between 0 and 100.",
      });
    }
  }

  if (lowStockThreshold !== undefined && lowStockThreshold !== "") {
    const threshold = parseInt(lowStockThreshold, 10);
    if (isNaN(threshold) || threshold < 0) {
      return res.status(400).json({
        success: false,
        message: "Low stock threshold must be a non-negative integer.",
      });
    }
  }

  if (sessionTimeoutMinutes !== undefined && sessionTimeoutMinutes !== "") {
    const timeout = parseInt(sessionTimeoutMinutes, 10);
    if (isNaN(timeout) || timeout < 5 || timeout > 1440) {
      return res.status(400).json({
        success: false,
        message: "Session timeout must be between 5 and 1440 minutes (24 hours).",
      });
    }
  }

  next();
};
