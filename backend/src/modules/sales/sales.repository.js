import prisma from "../../config/prisma.js";

class SalesRepository {
  // ===============================
  // Create Sales Order
  // ===============================
  async create(data) {
    let branchId = data.branchId;

    if (!branchId || branchId === "00000000-0000-0000-0000-000000000000") {
      let firstBranch = await prisma.branch.findFirst().catch(() => null);
      if (!firstBranch) {
        firstBranch = await prisma.branch.create({
          data: {
            name: "Main Branch",
            code: "MAIN-01",
            address: "Main Store",
            companyId: data.companyId || null,
            isActive: true,
          },
        }).catch(() => null);
      }
      if (firstBranch) {
        branchId = firstBranch.id;
      }
    }

    return await prisma.salesOrder.create({
      data: {
        ...data,
        branchId,
      },
    });
  }

  // ===============================
  // Get All Sales Orders
  // ===============================
  async findAll() {
    const orders = await prisma.salesOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return await Promise.all(
      orders.map(async (order) => {
        let customerName = "Walk-in Customer";
        if (order.customerId) {
          const customer = await prisma.customer.findUnique({
            where: { id: order.customerId },
            select: { name: true }
          }).catch(() => null);
          if (customer) {
            customerName = customer.name;
          }
        }
        return {
          ...order,
          customerName
        };
      })
    );
  }

  // ===============================
  // Get Sales Order By ID
  // ===============================
  async findById(id) {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
    }).catch(() => null);
    
    if (!order) return null;
    
    let customerName = "Walk-in Customer";
    let customerPhone = "";
    let customerEmail = "";
    if (order.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: order.customerId },
        select: { name: true, phone: true, email: true }
      }).catch(() => null);
      if (customer) {
        customerName = customer.name;
        customerPhone = customer.phone || "";
        customerEmail = customer.email || "";
      }
    }

    // Look up associated invoice items to display real sold products
    const invoice = await prisma.invoice.findFirst({
      where: { salesOrderId: order.id },
      include: { items: true },
    }).catch(() => null);

    let items = [];
    if (invoice && invoice.items && invoice.items.length > 0) {
      const productIds = [...new Set(invoice.items.map(item => item.productId))];
      const products = productIds.length > 0 ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      }).catch(() => []) : [];

      const productMap = products.reduce((acc, p) => {
        acc[p.id] = p.name;
        return acc;
      }, {});

      items = invoice.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: productMap[item.productId] || "Walk-in Product",
        product: productMap[item.productId] || "Walk-in Product",
        qty: item.quantity,
        price: Number(item.unitPrice),
      }));
    }
    
    return {
      ...order,
      customerName,
      customerPhone,
      customerEmail,
      items,
    };
  }

  // ===============================
  // Find By Order Number
  // ===============================
  async findByOrderNumber(orderNumber) {
    return await prisma.salesOrder.findFirst({
      where: { orderNumber },
    }).catch(() => null);
  }

  // ===============================
  // Find By Customer
  // ===============================
  async findByCustomer(customerId) {
    return await prisma.salesOrder.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ===============================
  // Find By Branch
  // ===============================
  async findByBranch(branchId) {
    return await prisma.salesOrder.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
    });
  }

  // ===============================
  // Find By Status
  // ===============================
  async findByStatus(status) {
    return await prisma.salesOrder.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });
  }

  // ===============================
  // Update Sales Order
  // ===============================
  async update(id, data) {
    return await prisma.salesOrder.update({
      where: { id },
      data,
    });
  }

  // ===============================
  // Update Order Status
  // ===============================
  async updateStatus(id, status) {
    return await prisma.salesOrder.update({
      where: { id },
      data: { status },
    });
  }

  // ===============================
  // Delete Sales Order
  // ===============================
  async delete(id) {
    return await prisma.salesOrder.delete({
      where: { id },
    });
  }

  // ===============================
  // Count Orders
  // ===============================
  async count() {
    return await prisma.salesOrder.count();
  }
}

export default new SalesRepository();