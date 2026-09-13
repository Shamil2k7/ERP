import prisma from "../../config/prisma.js";

class InvoiceRepository {
  // ==========================================
  // Create Invoice
  // ==========================================
  async create(data) {
    return await prisma.invoice.create({
      data,
    });
  }

  // ==========================================
  // Get All Invoices
  // ==========================================
  async findAll() {
    const invoices = await prisma.invoice.findMany({
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }).catch(() => []);

    // Collect all product IDs to resolve product names and descriptions
    const productIds = [...new Set(invoices.flatMap(inv => (inv.items || []).map(item => item.productId)))];
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        description: true,
        sellingPrice: true,
        retailPrice: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
      }
    }).catch(() => []) : [];
    
    const productMap = products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const enrichedInvoices = await Promise.all(
      invoices.map(async (inv) => {
        let customerName = "Walk-in Customer";
        let customerPhone = "";
        let customerEmail = "";
        let customerAddress = "";
        if (inv.customerId) {
          const customer = await prisma.customer.findUnique({
            where: { id: inv.customerId },
            select: { name: true, phone: true, email: true, address: true },
          }).catch(() => null);
          if (customer) {
            customerName = customer.name;
            customerPhone = customer.phone || "";
            customerEmail = customer.email || "";
            customerAddress = customer.address || "";
          }
        }

        let salesOrderNumber = null;
        if (inv.salesOrderId) {
          const so = await prisma.salesOrder.findUnique({
            where: { id: inv.salesOrderId },
            select: { orderNumber: true },
          }).catch(() => null);
          if (so) {
            salesOrderNumber = so.orderNumber;
          }
        }

        const enrichedItems = (inv.items || []).map((item) => {
          const prod = productMap[item.productId];
          const qty = Number(item.quantity || 1);
          const price = Number(item.unitPrice || prod?.sellingPrice || 0);
          const disc = Number(item.discount || 0);
          const tax = Number(item.tax || 0);
          const tot = Number(item.total || (qty * price));
          return {
            ...item,
            productId: item.productId,
            productName: prod?.name || "Product Item",
            product: prod?.name || "Product Item",
            name: prod?.name || "Product Item",
            description: prod?.description || item.description || "",
            sku: prod?.sku || item.sku || "",
            barcode: prod?.barcode || item.barcode || "",
            categoryName: prod?.category?.name || "",
            brandName: prod?.brand?.name || "",
            quantity: qty,
            qty,
            unitPrice: price,
            price,
            discount: disc,
            tax,
            total: tot,
            totalPrice: tot,
          };
        });

        const subtotal = Number(inv.subtotal || 0);
        const taxAmount = Number(inv.taxAmount || 0);
        const discountAmount = Number(inv.discountAmount || 0);
        const totalAmount = Number(inv.totalAmount || (subtotal + taxAmount - discountAmount));

        return {
          ...inv,
          items: enrichedItems,
          customerName,
          customer: customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          salesOrderNumber: salesOrderNumber || inv.invoiceNumber,
          referenceNumber: salesOrderNumber || inv.invoiceNumber,
          orderNumber: salesOrderNumber || inv.invoiceNumber,
          subtotal,
          subTotal: subtotal,
          taxAmount,
          tax: taxAmount,
          discountAmount,
          discount: discountAmount,
          totalAmount,
          total: totalAmount,
          netAmount: totalAmount,
          paidAmount: Number(inv.paidAmount || totalAmount),
          balanceAmount: Number(inv.balanceAmount || 0),
          paymentStatus: inv.paymentStatus || (inv.status === "ISSUED" ? "PAID" : "PENDING"),
          date: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split("T")[0] : new Date(inv.createdAt).toISOString().split("T")[0],
          invoiceNo: inv.invoiceNumber,
          paymentMethod: "Cash",
          cashier: "POS Staff",
        };
      })
    );

    // Also include sales orders as invoices so no transaction is missed
    const salesOrders = await prisma.salesOrder.findMany({
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    const salesInvoices = await Promise.all(
      salesOrders.map(async (so) => {
        const invNum = `INV-${so.orderNumber.replace(/^SO-/, "")}`;
        if (enrichedInvoices.some((i) => i.invoiceNumber === invNum || i.salesOrderId === so.id || i.invoiceNo === invNum || i.id === so.id)) {
          return null;
        }

        let customerName = "Walk-in Customer";
        let customerPhone = "";
        let customerEmail = "";
        let customerAddress = "";
        if (so.customerId) {
          const customer = await prisma.customer.findUnique({
            where: { id: so.customerId },
            select: { name: true, phone: true, email: true, address: true },
          }).catch(() => null);
          if (customer) {
            customerName = customer.name;
            customerPhone = customer.phone || "";
            customerEmail = customer.email || "";
            customerAddress = customer.address || "";
          }
        }

        let items = [];
        const linkedInv = await prisma.invoice.findFirst({
          where: { salesOrderId: so.id },
          include: { items: true },
        }).catch(() => null);

        if (linkedInv && linkedInv.items && linkedInv.items.length > 0) {
          const pIds = [...new Set(linkedInv.items.map((item) => item.productId))];
          const prods = pIds.length > 0 ? await prisma.product.findMany({
            where: { id: { in: pIds } },
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              description: true,
              sellingPrice: true,
              retailPrice: true,
              category: { select: { name: true } },
              brand: { select: { name: true } },
            }
          }).catch(() => []) : [];
          const pMap = prods.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

          items = linkedInv.items.map((item) => {
            const prod = pMap[item.productId];
            const qty = Number(item.quantity || 1);
            const price = Number(item.unitPrice || prod?.sellingPrice || 0);
            const disc = Number(item.discount || 0);
            const tax = Number(item.tax || 0);
            const tot = Number(item.total || (qty * price));
            return {
              ...item,
              productId: item.productId,
              productName: prod?.name || "Product Item",
              product: prod?.name || "Product Item",
              name: prod?.name || "Product Item",
              description: prod?.description || item.description || "",
              sku: prod?.sku || item.sku || "",
              barcode: prod?.barcode || item.barcode || "",
              categoryName: prod?.category?.name || "",
              brandName: prod?.brand?.name || "",
              quantity: qty,
              qty,
              unitPrice: price,
              price,
              discount: disc,
              tax,
              total: tot,
              totalPrice: tot,
            };
          });
        }

        const subtotal = Number(so.totalAmount || 0);
        const taxAmount = Number(so.taxAmount || 0);
        const discountAmount = Number(so.discountAmount || 0);
        const totalAmount = Number(so.netAmount || so.totalAmount || (subtotal + taxAmount - discountAmount));

        return {
          id: so.id,
          companyId: so.companyId,
          branchId: so.branchId,
          salesOrderId: so.id,
          customerId: so.customerId,
          invoiceNumber: invNum,
          invoiceNo: invNum,
          customerName,
          customer: customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          salesOrderNumber: so.orderNumber,
          referenceNumber: so.orderNumber,
          orderNumber: so.orderNumber,
          date: so.orderDate ? new Date(so.orderDate).toISOString().split("T")[0] : new Date(so.createdAt).toISOString().split("T")[0],
          subtotal,
          subTotal: subtotal,
          taxAmount,
          tax: taxAmount,
          discountAmount,
          discount: discountAmount,
          totalAmount,
          total: totalAmount,
          netAmount: totalAmount,
          paidAmount: totalAmount,
          balanceAmount: 0,
          paymentStatus: so.status === "COMPLETED" ? "PAID" : (so.status === "CANCELLED" ? "CANCELLED" : "PENDING"),
          status: so.status || "PAID",
          notes: `Sales Order ${so.orderNumber}`,
          paymentMethod: "Cash",
          cashier: "POS Staff",
          items,
        };
      })
    );

    const nonNullSalesInvoices = salesInvoices.filter(Boolean);
    return [...enrichedInvoices, ...nonNullSalesInvoices];
  }

  // ==========================================
  // Get Invoice By ID
  // ==========================================
  async findById(id) {
    let inv = await prisma.invoice.findFirst({
      where: {
        OR: [
          { id },
          { invoiceNumber: id },
          { salesOrderId: id },
        ],
      },
      include: {
        items: true,
      },
    }).catch(() => null);

    if (!inv) {
      // Fallback: check if id matches a sales order
      const so = await prisma.salesOrder.findFirst({
        where: {
          OR: [
            { id },
            { orderNumber: id },
          ],
        },
      }).catch(() => null);

      if (so) {
        // Check if there is an invoice linked to this sales order
        inv = await prisma.invoice.findFirst({
          where: { salesOrderId: so.id },
          include: { items: true },
        }).catch(() => null);

        if (!inv) {
          let customerName = "Walk-in Customer";
          let customerPhone = "";
          let customerEmail = "";
          let customerAddress = "";
          if (so.customerId) {
            const customer = await prisma.customer.findUnique({
              where: { id: so.customerId },
              select: { name: true, phone: true, email: true, address: true },
            }).catch(() => null);
            if (customer) {
              customerName = customer.name;
              customerPhone = customer.phone || "";
              customerEmail = customer.email || "";
              customerAddress = customer.address || "";
            }
          }

          const subtotal = Number(so.totalAmount || 0);
          const taxAmount = Number(so.taxAmount || 0);
          const discountAmount = Number(so.discountAmount || 0);
          const totalAmount = Number(so.netAmount || so.totalAmount || (subtotal + taxAmount - discountAmount));

          return {
            id: so.id,
            companyId: so.companyId,
            branchId: so.branchId,
            salesOrderId: so.id,
            customerId: so.customerId,
            invoiceNumber: `INV-${so.orderNumber.replace(/^SO-/, "")}`,
            invoiceNo: `INV-${so.orderNumber.replace(/^SO-/, "")}`,
            customerName,
            customer: customerName,
            customerPhone,
            customerEmail,
            customerAddress,
            salesOrderNumber: so.orderNumber,
            referenceNumber: so.orderNumber,
            orderNumber: so.orderNumber,
            date: so.orderDate ? new Date(so.orderDate).toISOString().split("T")[0] : new Date(so.createdAt).toISOString().split("T")[0],
            subtotal,
            subTotal: subtotal,
            taxAmount,
            tax: taxAmount,
            discountAmount,
            discount: discountAmount,
            totalAmount,
            total: totalAmount,
            netAmount: totalAmount,
            paidAmount: totalAmount,
            balanceAmount: 0,
            paymentStatus: so.status === "COMPLETED" ? "PAID" : (so.status === "CANCELLED" ? "CANCELLED" : "PENDING"),
            status: so.status || "PAID",
            paymentMethod: "Cash",
            cashier: "POS Staff",
            items: [],
          };
        }
      }
    }

    if (!inv) return null;

    // Collect product IDs to resolve product names and descriptions
    const productIds = [...new Set((inv.items || []).map(item => item.productId))];
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        description: true,
        sellingPrice: true,
        retailPrice: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
      }
    }).catch(() => []) : [];
    
    const productMap = products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const enrichedItems = (inv.items || []).map((item) => {
      const prod = productMap[item.productId];
      const qty = Number(item.quantity || 1);
      const price = Number(item.unitPrice || prod?.sellingPrice || 0);
      const disc = Number(item.discount || 0);
      const tax = Number(item.tax || 0);
      const tot = Number(item.total || (qty * price));
      return {
        ...item,
        productId: item.productId,
        productName: prod?.name || "Product Item",
        product: prod?.name || "Product Item",
        name: prod?.name || "Product Item",
        description: prod?.description || item.description || "",
        sku: prod?.sku || item.sku || "",
        barcode: prod?.barcode || item.barcode || "",
        categoryName: prod?.category?.name || "",
        brandName: prod?.brand?.name || "",
        quantity: qty,
        qty,
        unitPrice: price,
        price,
        discount: disc,
        tax,
        total: tot,
        totalPrice: tot,
      };
    });

    let customerName = "Walk-in Customer";
    let customerPhone = "";
    let customerEmail = "";
    let customerAddress = "";
    if (inv.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: inv.customerId },
        select: { name: true, phone: true, email: true, address: true },
      }).catch(() => null);
      if (customer) {
        customerName = customer.name;
        customerPhone = customer.phone || "";
        customerEmail = customer.email || "";
        customerAddress = customer.address || "";
      }
    }

    let salesOrderNumber = null;
    if (inv.salesOrderId) {
      const so = await prisma.salesOrder.findUnique({
        where: { id: inv.salesOrderId },
        select: { orderNumber: true },
      }).catch(() => null);
      if (so) {
        salesOrderNumber = so.orderNumber;
      }
    }

    const subtotal = Number(inv.subtotal || 0);
    const taxAmount = Number(inv.taxAmount || 0);
    const discountAmount = Number(inv.discountAmount || 0);
    const totalAmount = Number(inv.totalAmount || (subtotal + taxAmount - discountAmount));

    return {
      ...inv,
      items: enrichedItems,
      customerName,
      customer: customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      salesOrderNumber: salesOrderNumber || inv.invoiceNumber,
      referenceNumber: salesOrderNumber || inv.invoiceNumber,
      orderNumber: salesOrderNumber || inv.invoiceNumber,
      subtotal,
      subTotal: subtotal,
      taxAmount,
      tax: taxAmount,
      discountAmount,
      discount: discountAmount,
      totalAmount,
      total: totalAmount,
      netAmount: totalAmount,
      paidAmount: Number(inv.paidAmount || totalAmount),
      balanceAmount: Number(inv.balanceAmount || 0),
      paymentStatus: inv.paymentStatus || (inv.status === "ISSUED" ? "PAID" : "PENDING"),
      date: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split("T")[0] : new Date(inv.createdAt).toISOString().split("T")[0],
      invoiceNo: inv.invoiceNumber,
      paymentMethod: "Cash",
      cashier: "POS Staff",
    };
  }

  // ==========================================
  // Find By Invoice Number
  // ==========================================
  async findByInvoiceNumber(invoiceNumber) {
    return await prisma.invoice.findUnique({
      where: {
        invoiceNumber,
      },
    });
  }

  // ==========================================
  // Find By Customer
  // ==========================================
  async findByCustomer(customerId) {
    return await prisma.invoice.findMany({
      where: {
        customerId,
      },
      orderBy: {
        invoiceDate: "desc",
      },
    });
  }

  // ==========================================
  // Find By Branch
  // ==========================================
  async findByBranch(branchId) {
    return await prisma.invoice.findMany({
      where: {
        branchId,
      },
      orderBy: {
        invoiceDate: "desc",
      },
    });
  }

  // ==========================================
  // Find By Payment Status
  // ==========================================
  async findByPaymentStatus(paymentStatus) {
    return await prisma.invoice.findMany({
      where: {
        paymentStatus,
      },
      orderBy: {
        invoiceDate: "desc",
      },
    });
  }

  // ==========================================
  // Find By Invoice Status
  // ==========================================
  async findByStatus(status) {
    return await prisma.invoice.findMany({
      where: {
        status,
      },
      orderBy: {
        invoiceDate: "desc",
      },
    });
  }

  // ==========================================
  // Update Invoice
  // ==========================================
  async update(id, data) {
    return await prisma.invoice.update({
      where: {
        id,
      },
      data,
    });
  }

  // ==========================================
  // Update Invoice Status
  // ==========================================
  async updateStatus(id, status) {
    return await prisma.invoice.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  // ==========================================
  // Delete Invoice
  // ==========================================
  async delete(id) {
    return await prisma.invoice.delete({
      where: {
        id,
      },
    });
  }

  // ==========================================
  // Count Invoices
  // ==========================================
  async count() {
    return await prisma.invoice.count();
  }
}

export default new InvoiceRepository();