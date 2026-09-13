import salesService from "./sales.service.js";

// ======================================
// Create Sales Order
// ======================================
export const createSalesOrder = async (req, res) => {
  try {
    const salesOrder = await salesService.createSalesOrder(req.body, req);

    return res.status(201).json({
      success: true,
      message: "Sales Order created successfully.",
      data: salesOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get All Sales Orders
// ======================================
export const getSalesOrders = async (req, res) => {
  try {
    const salesOrders = await salesService.getSalesOrders();

    return res.status(200).json({
      success: true,
      count: salesOrders.length,
      data: salesOrders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Sales Order By ID
// ======================================
export const getSalesOrderById = async (req, res) => {
  try {
    const salesOrder = await salesService.getSalesOrderById(req.params.id);

    return res.status(200).json({
      success: true,
      data: salesOrder,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Update Sales Order
// ======================================
export const updateSalesOrder = async (req, res) => {
  try {
    const salesOrder = await salesService.updateSalesOrder(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Sales Order updated successfully.",
      data: salesOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Delete Sales Order
// ======================================
export const deleteSalesOrder = async (req, res) => {
  try {
    await salesService.deleteSalesOrder(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Sales Order deleted successfully.",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Update Order Status
// ======================================
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const salesOrder = await salesService.updateOrderStatus(
      req.params.id,
      status
    );

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: salesOrder,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Orders By Customer
// ======================================
export const getCustomerOrders = async (req, res) => {
  try {
    const orders = await salesService.getCustomerOrders(req.params.customerId);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Orders By Branch
// ======================================
export const getBranchOrders = async (req, res) => {
  try {
    const orders = await salesService.getBranchOrders(req.params.branchId);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Orders By Status
// ======================================
export const getStatusOrders = async (req, res) => {
  try {
    const orders = await salesService.getStatusOrders(req.params.status);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};