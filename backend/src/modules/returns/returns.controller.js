import returnService from "./returns.service.js";

// ==========================================
// Create Return
// ==========================================
export const createReturn = async (req, res) => {
  try {
    const returnData = await returnService.createReturn(req.body);

    return res.status(201).json({
      success: true,
      message: "Return created successfully.",
      data: returnData,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get All Returns
// ==========================================
export const getReturns = async (req, res) => {
  try {
    const returns = await returnService.getReturns();

    return res.status(200).json({
      success: true,
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Return By ID
// ==========================================
export const getReturnById = async (req, res) => {
  try {
    const returnData = await returnService.getReturnById(req.params.id);

    return res.status(200).json({
      success: true,
      data: returnData,
    });
  } catch (error) {
    console.error(error);

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Update Return
// ==========================================
export const updateReturn = async (req, res) => {
  try {
    const returnData = await returnService.updateReturn(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Return updated successfully.",
      data: returnData,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Delete Return
// ==========================================
export const deleteReturn = async (req, res) => {
  try {
    await returnService.deleteReturn(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Return deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Sales Returns
// ==========================================
export const getSalesReturns = async (req, res) => {
  try {
    const returns = await returnService.getSalesReturns();

    return res.status(200).json({
      success: true,
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Purchase Returns
// ==========================================
export const getPurchaseReturns = async (req, res) => {
  try {
    const returns = await returnService.getPurchaseReturns();

    return res.status(200).json({
      success: true,
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// Get Return Count
// ==========================================
export const getReturnCount = async (req, res) => {
  try {
    const count = await returnService.getReturnCount();

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};