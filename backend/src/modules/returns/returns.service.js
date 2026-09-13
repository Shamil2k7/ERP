import returnRepository from "./returns.repository.js";
import ReturnSchema from "./returns.schema.js";

class ReturnService {
  // ==========================================
  // Create Return
  // ==========================================
  async createReturn(data) {
    // Check duplicate return number
    const existingReturn =
      await returnRepository.findByReturnNumber(data.returnNumber);

    if (existingReturn) {
      throw new Error("Return Number already exists.");
    }

    // Business Validation
    if (
      data.type === "SALES_RETURN" &&
      !data.referenceSalesOrderId
    ) {
      throw new Error(
        "Sales Order reference is required for Sales Return."
      );
    }

    if (
      data.type === "PURCHASE_RETURN" &&
      !data.referencePurchaseOrderId
    ) {
      throw new Error(
        "Purchase Order reference is required for Purchase Return."
      );
    }

    const returnData = new ReturnSchema(data);

    return await returnRepository.create(returnData);
  }

  // ==========================================
  // Get All Returns
  // ==========================================
  async getReturns() {
    return await returnRepository.findAll();
  }

  // ==========================================
  // Get Return By ID
  // ==========================================
  async getReturnById(id) {
    const returnRecord = await returnRepository.findById(id);

    if (!returnRecord) {
      throw new Error("Return not found.");
    }

    return returnRecord;
  }

  // ==========================================
  // Update Return
  // ==========================================
  async updateReturn(id, data) {
    const returnRecord = await returnRepository.findById(id);

    if (!returnRecord) {
      throw new Error("Return not found.");
    }

    return await returnRepository.update(id, data);
  }

  // ==========================================
  // Delete Return
  // ==========================================
  async deleteReturn(id) {
    const returnRecord = await returnRepository.findById(id);

    if (!returnRecord) {
      throw new Error("Return not found.");
    }

    return await returnRepository.delete(id);
  }

  // ==========================================
  // Get Sales Returns
  // ==========================================
  async getSalesReturns() {
    return await returnRepository.findByType("SALES_RETURN");
  }

  // ==========================================
  // Get Purchase Returns
  // ==========================================
  async getPurchaseReturns() {
    return await returnRepository.findByType("PURCHASE_RETURN");
  }

  // ==========================================
  // Get Return Count
  // ==========================================
  async getReturnCount() {
    return await returnRepository.count();
  }
}

export default new ReturnService();