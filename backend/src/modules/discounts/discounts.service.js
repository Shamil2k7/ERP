import DiscountSchema from "./discounts.schema.js";
import discountRepository from "./discounts.repository.js";

class DiscountService {
  // ==========================================
  // Create Discount
  // ==========================================
  async createDiscount(data) {
    // Check duplicate code
    const code = await discountRepository.findByCode(data.code);

    if (code) {
      throw new Error("Discount code already exists.");
    }

    // Optional: Check duplicate name
    const name = await discountRepository.findByName(data.name);

    if (name) {
      throw new Error("Discount name already exists.");
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate < startDate) {
      throw new Error("End date cannot be earlier than start date.");
    }

    // Percentage validation
    if (
      data.type === "PERCENTAGE" &&
      (Number(data.value) <= 0 || Number(data.value) > 100)
    ) {
      throw new Error(
        "Percentage discount must be between 1 and 100."
      );
    }

    const discount = new DiscountSchema(data);

    return await discountRepository.create(discount);
  }

  // ==========================================
  // Get All Discounts
  // ==========================================
  async getDiscounts() {
    return await discountRepository.findAll();
  }

  // ==========================================
  // Get Discount By ID
  // ==========================================
  async getDiscount(id) {
    const discount = await discountRepository.findById(id);

    if (!discount) {
      throw new Error("Discount not found.");
    }

    return discount;
  }

  // ==========================================
  // Update Discount
  // ==========================================
  async updateDiscount(id, data) {
    await this.getDiscount(id);

    if (data.code) {
      const existing = await discountRepository.findByCode(data.code);

      if (existing && existing.id !== id) {
        throw new Error("Discount code already exists.");
      }
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (endDate < startDate) {
        throw new Error(
          "End date cannot be earlier than start date."
        );
      }
    }

    return await discountRepository.update(id, data);
  }

  // ==========================================
  // Delete Discount
  // ==========================================
  async deleteDiscount(id) {
    await this.getDiscount(id);

    return await discountRepository.delete(id);
  }

  // ==========================================
  // Active Discounts
  // ==========================================
  async getActiveDiscounts() {
    return await discountRepository.findByStatus("ACTIVE");
  }

  // ==========================================
  // Inactive Discounts
  // ==========================================
  async getInactiveDiscounts() {
    return await discountRepository.findByStatus("INACTIVE");
  }

  // ==========================================
  // Expired Discounts
  // ==========================================
  async getExpiredDiscounts() {
    return await discountRepository.findByStatus("EXPIRED");
  }

  // ==========================================
  // Percentage Discounts
  // ==========================================
  async getPercentageDiscounts() {
    return await discountRepository.findByType("PERCENTAGE");
  }

  // ==========================================
  // Fixed Discounts
  // ==========================================
  async getFixedDiscounts() {
    return await discountRepository.findByType("FIXED");
  }

  // ==========================================
  // Discount Count
  // ==========================================
  async getDiscountCount() {
    return await discountRepository.count();
  }
}

export default new DiscountService();