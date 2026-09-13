import prisma from "../../config/prisma.js";

// ==========================================
// LAUNDRY PROFILES REPOSITORY
// ==========================================

export const createLaundryRepo = async (companyId, data) => {
  return await prisma.laundry.create({
    data: {
      ...data,
      companyId,
    },
  });
};

export const getLaundriesRepo = async (companyId) => {
  return await prisma.laundry.findMany({
    where: { companyId },
    include: { branch: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getLaundryByIdRepo = async (companyId, id) => {
  return await prisma.laundry.findFirst({
    where: { id, companyId },
    include: { branch: true },
  });
};

export const updateLaundryRepo = async (companyId, id, data) => {
  return await prisma.laundry.update({
    where: { id, companyId },
    data,
  });
};

export const deleteLaundryRepo = async (companyId, id) => {
  return await prisma.laundry.delete({
    where: { id, companyId },
  });
};

// ==========================================
// LAUNDRY SERVICE CATEGORIES REPOSITORY
// ==========================================

export const createCategoryRepo = async (data) => {
  const { companyId, ...cleanData } = data;
  return await prisma.laundryServiceCategory.create({
    data: cleanData,
  });
};

export const getCategoriesRepo = async (laundryId) => {
  return await prisma.laundryServiceCategory.findMany({
    where: { laundryId },
    orderBy: { sortOrder: "asc" },
  });
};

export const getCategoryByIdRepo = async (id) => {
  return await prisma.laundryServiceCategory.findUnique({
    where: { id },
  });
};

export const updateCategoryRepo = async (id, data) => {
  const { companyId, ...cleanData } = data;
  return await prisma.laundryServiceCategory.update({
    where: { id },
    data: cleanData,
  });
};

export const deleteCategoryRepo = async (id) => {
  return await prisma.laundryServiceCategory.delete({
    where: { id },
  });
};

// ==========================================
// LAUNDRY SERVICES REPOSITORY
// ==========================================

export const createServiceRepo = async (data) => {
  const { companyId, ...cleanData } = data;
  return await prisma.laundryService.create({
    data: cleanData,
  });
};

export const getServicesRepo = async (laundryId, { categoryId, status }) => {
  const where = { laundryId };
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;

  return await prisma.laundryService.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });
};

export const getServiceByIdRepo = async (id) => {
  return await prisma.laundryService.findUnique({
    where: { id },
    include: { category: true },
  });
};

export const updateServiceRepo = async (id, data) => {
  const { companyId, ...cleanData } = data;
  return await prisma.laundryService.update({
    where: { id },
    data: cleanData,
  });
};

export const deleteServiceRepo = async (id) => {
  return await prisma.laundryService.delete({
    where: { id },
  });
};

// ==========================================
// LAUNDRY ORDERS REPOSITORY
// ==========================================

export const createOrderRepo = async (companyId, orderData, itemsData, paymentData, deliveryData) => {
  return await prisma.$transaction(async (tx) => {
    // Generate order number
    const totalCount = await tx.laundryOrder.count();
    let orderNumber = `LND-${(totalCount + 1).toString().padStart(4, "0")}`;
    const existing = await tx.laundryOrder.findFirst({ where: { orderNumber } });
    if (existing) {
      orderNumber = `LND-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100).toString().padStart(2, "0")}`;
    }

    const isUUID = (str) => typeof str === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
    let cleanCustomerId = isUUID(orderData.customerId) ? orderData.customerId : null;
    let cleanBranchId = isUUID(orderData.branchId) ? orderData.branchId : null;

    // Resolve Customer (Ensure a valid database customer ID exists)
    if (!cleanCustomerId) {
      let defaultCustomer = await tx.customer.findFirst({
        where: {
          name: "Walk-in Customer",
          ...(companyId ? { companyId } : {}),
        },
      });

      if (!defaultCustomer) {
        defaultCustomer = await tx.customer.create({
          data: {
            name: "Walk-in Customer",
            phone: `0000000000-${Date.now().toString().slice(-4)}`,
            email: `walkin-${Date.now()}@laundry.local`,
            address: "Over the Counter",
            companyId: companyId || null,
          },
        });
      }
      cleanCustomerId = defaultCustomer.id;
    }

    // Resolve Branch
    if (!cleanBranchId) {
      const laundryProfile = await tx.laundry.findUnique({
        where: { id: orderData.laundryId },
      });
      if (laundryProfile && isUUID(laundryProfile.branchId)) {
        cleanBranchId = laundryProfile.branchId;
      } else {
        const defaultBranch = await tx.branch.findFirst({
          where: companyId ? { companyId } : undefined,
        });
        if (defaultBranch) {
          cleanBranchId = defaultBranch.id;
        }
      }
    }

    // Create the Order
    const order = await tx.laundryOrder.create({
      data: {
        companyId: companyId || null,
        laundryId: orderData.laundryId,
        branchId: cleanBranchId,
        customerId: cleanCustomerId,
        orderNumber,
        status: orderData.status || "RECEIVED",
        subtotal: orderData.subtotal,
        discountAmount: orderData.discountAmount || 0,
        taxAmount: orderData.taxAmount || 0,
        totalAmount: orderData.totalAmount,
        paidAmount: orderData.paidAmount || 0,
        balanceAmount: orderData.balanceAmount || 0,
        specialInstructions: orderData.specialInstructions || null,
        createdBy: orderData.createdBy || null,
        receivedAt: new Date(),
      },
    });

    // Create order items & individual garments
    let garmentSeq = 1;
    for (const item of itemsData) {
      const orderItem = await tx.laundryOrderItem.create({
        data: {
          orderId: order.id,
          serviceId: item.serviceId,
          garmentType: item.garmentType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount || 0,
          taxAmount: item.taxAmount || 0,
          totalAmount: item.totalAmount,
          notes: item.notes || null,
        },
      });

      // Create individual garments for barcode tracking
      for (let i = 0; i < item.quantity; i++) {
        let tagNumber = `${orderNumber}-${garmentSeq.toString().padStart(3, "0")}`;
        const existingTag = await tx.laundryGarment.findUnique({ where: { tagNumber } }).catch(() => null);
        if (existingTag) {
          tagNumber = `${orderNumber}-${garmentSeq.toString().padStart(3, "0")}-${Math.floor(Math.random() * 1000)}`;
        }
        await tx.laundryGarment.create({
          data: {
            orderItemId: orderItem.id,
            tagNumber,
            barcode: tagNumber,
            status: "RECEIVED",
            notes: `Garment ${i + 1} of type ${item.garmentType}`,
          },
        });
        garmentSeq++;
      }
    }

    // Add status history
    await tx.laundryStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: null,
        newStatus: order.status,
        changedBy: orderData.createdBy || "SYSTEM",
        notes: "Order initially received",
      },
    });

    // Add delivery record if home delivery is requested
    if (deliveryData) {
      await tx.laundryDelivery.create({
        data: {
          orderId: order.id,
          deliveryAddress: deliveryData.deliveryAddress,
          phone: deliveryData.phone,
          deliveryDate: deliveryData.deliveryDate ? new Date(deliveryData.deliveryDate) : null,
          deliveryStatus: "PENDING",
          deliveryNotes: deliveryData.deliveryNotes || null,
        },
      });
    }

    // Process payment if amount paid > 0 and branch is available
    if (paymentData && parseFloat(paymentData.amount) > 0 && cleanBranchId) {
      const payNumber = paymentData.paymentNumber || `PAY-LND-${Date.now().toString().slice(-6)}`;
      await tx.payment.create({
        data: {
          companyId: companyId || null,
          branchId: cleanBranchId,
          customerId: cleanCustomerId,
          laundryOrderId: order.id,
          paymentNumber: payNumber,
          paymentDate: new Date(),
          amount: parseFloat(paymentData.amount),
          method: paymentData.method || "CASH",
          referenceNumber: paymentData.referenceNumber || null,
          status: "PAID",
          notes: `Payment for Laundry Order ${orderNumber}`,
        },
      }).catch((payErr) => {
        console.warn("Non-fatal payment record log:", payErr.message);
      });
    }

    return await tx.laundryOrder.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        items: {
          include: {
            service: true,
            garments: true,
          },
        },
        delivery: true,
        payments: true,
      },
    });
  });
};

export const getOrdersRepo = async (companyId, { laundryId, status, search }) => {
  const where = {};
  if (companyId) where.companyId = companyId;
  if (laundryId) where.laundryId = laundryId;
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { phone: { contains: search, mode: "insensitive" } } },
    ];
  }

  return await prisma.laundryOrder.findMany({
    where,
    include: {
      customer: true,
      laundry: true,
      branch: true,
      items: {
        include: {
          service: true,
          garments: true,
        },
      },
      delivery: true,
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getOrderByIdRepo = async (companyId, id) => {
  return await prisma.laundryOrder.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      laundry: true,
      branch: true,
      items: {
        include: {
          service: true,
          garments: true,
        },
      },
      delivery: true,
      statusHistory: { orderBy: { timestamp: "desc" } },
      payments: true,
    },
  });
};

export const updateOrderStatusRepo = async (companyId, orderId, { status, notes, changedBy }) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.laundryOrder.findFirst({
      where: { id: orderId, companyId },
    });

    if (!order) throw new Error("Order not found");

    const oldStatus = order.status;
    const updateData = { status };

    if (status === "PROCESSING" && !order.processingAt) {
      updateData.processingAt = new Date();
    } else if (status === "READY" && !order.readyAt) {
      updateData.readyAt = new Date();
    } else if ((status === "DELIVERED" || status === "COMPLETED") && !order.completedAt) {
      updateData.completedAt = new Date();
    }

    // Update main order status
    const updatedOrder = await tx.laundryOrder.update({
      where: { id: orderId },
      data: updateData,
    });

    // Update all garments in the order to follow the status
    const items = await tx.laundryOrderItem.findMany({
      where: { orderId },
    });
    for (const item of items) {
      await tx.laundryGarment.updateMany({
        where: { orderItemId: item.id },
        data: { status },
      });
    }

    // Add status history
    await tx.laundryStatusHistory.create({
      data: {
        orderId,
        oldStatus,
        newStatus: status,
        changedBy: changedBy || "SYSTEM",
        notes: notes || `Order status moved from ${oldStatus} to ${status}`,
      },
    });

    // If status is DELIVERED, update the LaundryDelivery status if it exists
    if (status === "DELIVERED" || status === "COMPLETED") {
      await tx.laundryDelivery.updateMany({
        where: { orderId },
        data: { deliveryStatus: "DELIVERED", deliveryDate: new Date() },
      });
    }

    return updatedOrder;
  });
};

// ==========================================
// LAUNDRY GARMENTS REPOSITORY
// ==========================================

export const getGarmentByBarcodeRepo = async (companyId, barcode) => {
  return await prisma.laundryGarment.findFirst({
    where: {
      OR: [
        { barcode },
        { tagNumber: barcode }
      ],
      orderItem: {
        order: {
          companyId
        }
      }
    },
    include: {
      orderItem: {
        include: {
          order: {
            include: {
              customer: true,
              branch: true
            }
          },
          service: true
        }
      }
    }
  });
};

export const updateGarmentStatusRepo = async (id, status) => {
  return await prisma.laundryGarment.update({
    where: { id },
    data: { status },
  });
};

export const getGarmentsRepo = async (companyId, { status, search } = {}) => {
  const where = {
    orderItem: {
      order: {
        companyId
      }
    }
  };

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { tagNumber: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
      {
        orderItem: {
          order: {
            orderNumber: { contains: search, mode: "insensitive" }
          }
        }
      }
    ];
  }

  return await prisma.laundryGarment.findMany({
    where,
    include: {
      orderItem: {
        include: {
          order: {
            include: {
              customer: true,
              branch: true
            }
          },
          service: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
};

export const createGarmentRepo = async (companyId, garmentData) => {
  const { orderItemId, tagNumber, barcode, status, notes } = garmentData;

  const orderItem = await prisma.laundryOrderItem.findFirst({
    where: {
      id: orderItemId,
      order: {
        companyId
      }
    }
  });

  if (!orderItem) {
    throw new Error("Order Item not found or unauthorized access.");
  }

  const generatedTag = tagNumber || `TAG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return await prisma.laundryGarment.create({
    data: {
      orderItemId,
      tagNumber: generatedTag,
      barcode: barcode || generatedTag,
      status: status || "RECEIVED",
      notes: notes || null
    },
    include: {
      orderItem: {
        include: {
          order: {
            include: {
              customer: true,
              branch: true
            }
          },
          service: true
        }
      }
    }
  });
};

// ==========================================
// LAUNDRY DELIVERIES REPOSITORY
// ==========================================

export const getDeliveriesRepo = async (companyId, { status, search, startDate, endDate, page = 1, limit = 50 } = {}) => {
  const where = {
    order: {
      companyId,
    },
  };

  if (status && status !== "ALL") {
    where.deliveryStatus = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  if (search && search.trim() !== "") {
    const s = search.trim();
    where.OR = [
      { deliveryAddress: { contains: s, mode: "insensitive" } },
      { phone: { contains: s, mode: "insensitive" } },
      {
        order: {
          orderNumber: { contains: s, mode: "insensitive" },
        },
      },
      {
        order: {
          customer: {
            name: { contains: s, mode: "insensitive" },
          },
        },
      },
    ];
  }

  const [totalCount, deliveries] = await Promise.all([
    prisma.laundryDelivery.count({ where }),
    prisma.laundryDelivery.findMany({
      where,
      include: {
        order: {
          include: {
            customer: true,
            branch: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
  ]);

  return {
    totalCount,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(totalCount / Number(limit)) || 1,
    data: deliveries.map((d) => ({
      id: d.id,
      companyId,
      orderId: d.orderId,
      orderNumber: d.order?.orderNumber || "N/A",
      customerId: d.order?.customerId,
      customerName: d.order?.customer?.name || "Walk-in Customer",
      deliveryAddress: d.deliveryAddress,
      contactNumber: d.phone,
      scheduledDate: d.deliveryDate,
      dispatchedAt: d.deliveryStatus === "OUT_FOR_DELIVERY" || d.deliveryStatus === "DELIVERED" ? d.updatedAt : null,
      deliveredAt: d.deliveryStatus === "DELIVERED" ? d.deliveryDate || d.updatedAt : null,
      deliveryStatus: d.deliveryStatus,
      assignedDeliveryStaff: d.deliveryNotes?.includes("Assigned to") ? d.deliveryNotes : null,
      totalAmount: d.order?.totalAmount,
      paidAmount: d.order?.paidAmount,
      balanceAmount: d.order?.balanceAmount,
      orderStatus: d.order?.status,
      deliveryNotes: d.deliveryNotes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
  };
};

export const updateDeliveryStatusRepo = async (orderId, { deliveryStatus, deliveryNotes }) => {
  const data = { deliveryStatus };
  if (deliveryStatus === "DELIVERED") {
    data.deliveryDate = new Date();
  }

  if (deliveryNotes) {
    data.deliveryNotes = deliveryNotes;
  }

  return await prisma.$transaction(async (tx) => {
    const delivery = await tx.laundryDelivery.update({
      where: { orderId },
      data,
    });

    let newOrderStatus = null;
    if (deliveryStatus === "OUT_FOR_DELIVERY") {
      newOrderStatus = "OUT_FOR_DELIVERY";
    } else if (deliveryStatus === "DELIVERED") {
      newOrderStatus = "DELIVERED";
    }

    if (newOrderStatus) {
      const order = await tx.laundryOrder.findUnique({ where: { id: orderId } });
      if (order) {
        await tx.laundryOrder.update({
          where: { id: orderId },
          data: { status: newOrderStatus },
        });

        await tx.laundryStatusHistory.create({
          data: {
            orderId,
            oldStatus: order.status,
            newStatus: newOrderStatus,
            changedBy: "SYSTEM",
            notes: deliveryNotes || `Delivery status changed to ${deliveryStatus}`,
          },
        });
      }
    }

    return delivery;
  });
};

// ==========================================
// LAUNDRY DASHBOARD & REPORTS REPOSITORY
// ==========================================

export const getLaundryStatsRepo = async (companyId, laundryId) => {
  const where = { companyId };
  if (laundryId) where.laundryId = laundryId;

  const orders = await prisma.laundryOrder.findMany({
    where,
    include: {
      items: {
        include: {
          service: true,
        },
      },
    },
  });

  const activeStatuses = ["RECEIVED", "INSPECTING", "PROCESSING"];
  const readyStatuses = ["READY", "OUT_FOR_DELIVERY"];

  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter(o => activeStatuses.includes(o.status)).length,
    readyOrders: orders.filter(o => readyStatuses.includes(o.status)).length,
    completedOrders: orders.filter(o => o.status === "COMPLETED" || o.status === "DELIVERED").length,
    revenue: orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0),
    paidAmount: orders.reduce((sum, o) => sum + parseFloat(o.paidAmount || 0), 0),
    balanceAmount: orders.reduce((sum, o) => sum + parseFloat(o.balanceAmount || 0), 0),
  };

  // Fetch 5 most recent active queue orders with customer details
  const activeQueue = await prisma.laundryOrder.findMany({
    where: {
      companyId,
      ...(laundryId ? { laundryId } : {}),
      status: { in: activeStatuses },
    },
    include: {
      customer: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Calculate popular services from order items
  const serviceCounts = {};
  let totalItemsQty = 0;
  for (const o of orders) {
    for (const item of o.items) {
      if (item.service) {
        const serviceName = item.service.name || "Unknown Service";
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + (item.quantity || 0);
        totalItemsQty += (item.quantity || 0);
      }
    }
  }

  const popularServices = Object.entries(serviceCounts).map(([name, count]) => {
    const percentage = totalItemsQty > 0 ? Math.round((count / totalItemsQty) * 100) : 0;
    return { name, count, percentage };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  return {
    stats,
    activeQueue,
    popularServices,
  };
};

export const getLaundryReportsRepo = async (companyId, laundryId) => {
  const where = { companyId };
  if (laundryId) where.laundryId = laundryId;

  const orders = await prisma.laundryOrder.findMany({
    where,
    include: {
      customer: true,
      items: {
        include: {
          service: true,
        },
      },
    },
  });

  // 1. Avg Turnaround Time calculation
  const completedOrders = orders.filter(o => o.completedAt && (o.receivedAt || o.createdAt));
  let turnaroundTime = "N/A";
  if (completedOrders.length > 0) {
    const totalDiffMs = completedOrders.reduce((sum, o) => {
      const start = new Date(o.receivedAt || o.createdAt);
      const end = new Date(o.completedAt);
      return sum + (end - start);
    }, 0);
    const avgMs = totalDiffMs / completedOrders.length;
    const avgDays = (avgMs / (1000 * 60 * 60 * 24)).toFixed(1);
    turnaroundTime = `${avgDays} days`;
  }

  // 2. Top Customer Spend
  const customerSpends = {};
  for (const o of orders) {
    if (o.customer) {
      const name = o.customer.name || "Unknown Customer";
      customerSpends[name] = (customerSpends[name] || 0) + parseFloat(o.totalAmount || 0);
    }
  }
  const topCustomerEntry = Object.entries(customerSpends).sort((a, b) => b[1] - a[1])[0];
  const topCustomer = topCustomerEntry 
    ? `${topCustomerEntry[0]} ($${topCustomerEntry[1].toFixed(2)})` 
    : "No Customer spend data";

  // 3. Washing Capacity Utilization
  const activeStatuses = ["RECEIVED", "INSPECTING", "PROCESSING"];
  const totalActive = orders.filter(o => activeStatuses.includes(o.status)).length;
  const processing = orders.filter(o => o.status === "PROCESSING").length;
  const activeCapacity = totalActive > 0 ? `${Math.round((processing / totalActive) * 100)}%` : "0%";

  // 4. Revenue contribution by service
  const serviceRevenue = {};
  for (const o of orders) {
    for (const item of o.items) {
      if (item.service) {
        const name = item.service.name || "Unknown Service";
        const amt = parseFloat(item.totalAmount || 0);
        serviceRevenue[name] = (serviceRevenue[name] || 0) + amt;
      }
    }
  }

  const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#cbd5e1"];
  const revenueByService = Object.entries(serviceRevenue).map(([name, value], idx) => {
    return {
      name,
      value,
      color: colors[idx % colors.length]
    };
  }).sort((a, b) => b.value - a.value);

  return {
    revenueByService,
    turnaroundTime,
    topCustomer,
    activeCapacity
  };
};
