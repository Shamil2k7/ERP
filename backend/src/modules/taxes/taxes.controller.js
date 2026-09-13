import taxService from "./taxes.service.js";

// ==========================================
// Create Tax
// ==========================================
export const createTax = async (req, res) => {
  try {
    const tax = await taxService.createTax(req.body);

    return res.status(201).json({
      success: true,
      message: "Tax created successfully.",
      data: tax,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get All Taxes
// ==========================================
export const getTaxes = async (req, res) => {
  try {
    const taxes = await taxService.getTaxes();

    return res.status(200).json({
      success: true,
      count: taxes.length,
      data: taxes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Tax By ID
// ==========================================
export const getTax = async (req, res) => {
  try {
    const tax = await taxService.getTax(req.params.id);

    return res.status(200).json({
      success: true,
      data: tax,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Update Tax
// ==========================================
export const updateTax = async (req, res) => {
  try {
    const tax = await taxService.updateTax(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Tax updated successfully.",
      data: tax,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Delete Tax
// ==========================================
export const deleteTax = async (req, res) => {
  try {
    await taxService.deleteTax(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Tax deleted successfully.",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Active Taxes
// ==========================================
export const getActiveTaxes = async (req, res) => {
  try {
    const taxes = await taxService.getActiveTaxes();

    return res.status(200).json({
      success: true,
      count: taxes.length,
      data: taxes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Inactive Taxes
// ==========================================
export const getInactiveTaxes = async (req, res) => {
  try {
    const taxes = await taxService.getInactiveTaxes();

    return res.status(200).json({
      success: true,
      count: taxes.length,
      data: taxes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Inclusive Taxes
// ==========================================
export const getInclusiveTaxes = async (req, res) => {
  try {
    const taxes = await taxService.getInclusiveTaxes();

    return res.status(200).json({
      success: true,
      count: taxes.length,
      data: taxes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Exclusive Taxes
// ==========================================
export const getExclusiveTaxes = async (req, res) => {
  try {
    const taxes = await taxService.getExclusiveTaxes();

    return res.status(200).json({
      success: true,
      count: taxes.length,
      data: taxes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Tax Count
// ==========================================
export const getTaxCount = async (req, res) => {
  try {
    const count = await taxService.getTaxCount();

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};