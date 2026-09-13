import TaxSchema from "./taxes.schema.js";
import taxRepository from "./taxes.repository.js";

class TaxService {
  // ==========================================
  // Create Tax
  // ==========================================
  async createTax(data) {
    // Check duplicate name
    const existingTax = await taxRepository.findByName(data.name);

    if (existingTax) {
      throw new Error("Tax already exists.");
    }

    // Validate rate
    if (Number(data.rate) < 0 || Number(data.rate) > 100) {
      throw new Error("Tax rate must be between 0 and 100.");
    }

    const tax = new TaxSchema(data);

    return await taxRepository.create(tax);
  }

  // ==========================================
  // Get All Taxes
  // ==========================================
  async getTaxes() {
    return await taxRepository.findAll();
  }

  // ==========================================
  // Get Tax By ID
  // ==========================================
  async getTax(id) {
    const tax = await taxRepository.findById(id);

    if (!tax) {
      throw new Error("Tax not found.");
    }

    return tax;
  }

  // ==========================================
  // Update Tax
  // ==========================================
  async updateTax(id, data) {
    await this.getTax(id);

    if (data.name) {
      const existingTax = await taxRepository.findByName(data.name);

      if (existingTax && existingTax.id !== id) {
        throw new Error("Tax name already exists.");
      }
    }

    if (data.rate !== undefined) {
      if (Number(data.rate) < 0 || Number(data.rate) > 100) {
        throw new Error("Tax rate must be between 0 and 100.");
      }
    }

    return await taxRepository.update(id, data);
  }

  // ==========================================
  // Delete Tax
  // ==========================================
  async deleteTax(id) {
    await this.getTax(id);

    return await taxRepository.delete(id);
  }

  // ==========================================
  // Get Active Taxes
  // ==========================================
  async getActiveTaxes() {
    return await taxRepository.findByStatus("ACTIVE");
  }

  // ==========================================
  // Get Inactive Taxes
  // ==========================================
  async getInactiveTaxes() {
    return await taxRepository.findByStatus("INACTIVE");
  }

  // ==========================================
  // Get Inclusive Taxes
  // ==========================================
  async getInclusiveTaxes() {
    return await taxRepository.findByType("INCLUSIVE");
  }

  // ==========================================
  // Get Exclusive Taxes
  // ==========================================
  async getExclusiveTaxes() {
    return await taxRepository.findByType("EXCLUSIVE");
  }

  // ==========================================
  // Count Taxes
  // ==========================================
  async getTaxCount() {
    return await taxRepository.count();
  }
}

export default new TaxService();