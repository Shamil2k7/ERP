import discountService from "./discounts.service.js";

// ==========================================
// Create Discount
// ==========================================
export const createDiscount = async (req, res) => {
  try {
    const discount = await discountService.createDiscount(req.body);

    return res.status(201).json({
      success: true,
      message: "Discount created successfully.",
      data: discount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get All Discounts
// ==========================================
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getDiscounts();

    return res.status(200).json({
      success: true,
      count: discounts.length,
      data: discounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Discount By ID
// ==========================================
export const getDiscount = async (req, res) => {
  try {
    const discount = await discountService.getDiscount(req.params.id);

    return res.status(200).json({
      success: true,
      data: discount,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Update Discount
// ==========================================
export const updateDiscount = async (req, res) => {
  try {
    const discount = await discountService.updateDiscount(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Discount updated successfully.",
      data: discount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Delete Discount
// ==========================================
export const deleteDiscount = async (req, res) => {
  try {
    await discountService.deleteDiscount(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Discount deleted successfully.",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Active Discounts
// ==========================================
export const getActiveDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getActiveDiscounts();

    return res.status(200).json({
      success: true,
      count: discounts.length,
      data: discounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Inactive Discounts
// ==========================================
export const getInactiveDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getInactiveDiscounts();

    return res.status(200).json({
      success: true,
      count: discounts.length,
      data: discounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Expired Discounts
// ==========================================
export const getExpiredDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getExpiredDiscounts();

    return res.status(200).json({
      success: true,
      count: discounts.length,
      data: discounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Percentage Discounts
// ==========================================
export const getPercentageDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getPercentageDiscounts();

    return res.status(200).json({
      success: true,
      count: discounts.length,
      data: discounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Fixed Discounts
// ==========================================
export const getFixedDiscounts = async (req, res) => {
  try {
    const discounts = await discountService.getFixedDiscounts();

    return res.status(200).json({
      success: true,
      count: discounts.length,
      data: discounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Discount Count
// ==========================================
export const getDiscountCount = async (req, res) => {
  try {
    const count = await discountService.getDiscountCount();

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