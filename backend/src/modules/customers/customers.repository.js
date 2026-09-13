import prisma from "../../config/prisma.js";

class CustomerRepository {
  async create(data) {
    return prisma.customer.create({
      data,
    });
  }

  async findAll(companyId) {
    const where = companyId ? { OR: [{ companyId }, { companyId: null }] } : {};
    return prisma.customer.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id) {
    return prisma.customer.findUnique({
      where: { id },
    });
  }

  async findByPhone(phone) {
    return prisma.customer.findFirst({
      where: { phone },
    });
  }

  async findByEmail(email) {
    return prisma.customer.findFirst({
      where: { email },
    });
  }

  async update(id, data) {
    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return prisma.customer.delete({
      where: { id },
    });
  }
}

export default new CustomerRepository();