import repository from "./customers.repository.js";
import { validatePhoneNumber, cleanPhoneNumber } from "../../utils/phoneValidator.js";

class CustomerService {

  async createCustomer(data) {
    if (!validatePhoneNumber(data.phone, true)) {
      throw new Error("Phone number must contain exactly 10 digits");
    }
    data.phone = cleanPhoneNumber(data.phone);

    const phone = await repository.findByPhone(data.phone);


    if (phone) {
      throw new Error("Phone number already exists");
    }

    if (data.email) {
      const email = await repository.findByEmail(data.email);

      if (email) {
        throw new Error("Email already exists");
      }
    }

    if (!data.loyaltyId) {
      data.loyaltyId = `LOY-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    return repository.create(data);
  }

  async getCustomers(companyId) {
    return repository.findAll(companyId);
  }

  async getCustomer(id) {

    const customer = await repository.findById(id);

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  }

  async updateCustomer(id, data) {
    await this.getCustomer(id);

    if (data.phone !== undefined) {
      if (!validatePhoneNumber(data.phone, true)) {
        throw new Error("Phone number must contain exactly 10 digits");
      }
      data.phone = cleanPhoneNumber(data.phone);
    }

    return repository.update(id, data);
  }


  async deleteCustomer(id) {

    await this.getCustomer(id);

    return repository.delete(id);
  }
}

export default new CustomerService();