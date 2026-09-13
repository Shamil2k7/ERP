import { Server } from "socket.io";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 [SOCKET] Connected: ${socket.id}`);

    // Join company room (multi-tenant isolation)
    socket.on("joinCompany", (data) => {
      const companyId = typeof data === "string" ? data : data?.companyId;
      if (companyId) {
        const roomName = `company:${companyId}`;
        socket.join(roomName);
        console.log(`🏢 [SOCKET] ${socket.id} joined company room: ${roomName}`);
      }
    });

    // Leave company room
    socket.on("leaveCompany", (data) => {
      const companyId = typeof data === "string" ? data : data?.companyId;
      if (companyId) {
        const roomName = `company:${companyId}`;
        socket.leave(roomName);
        console.log(`🏢 [SOCKET] ${socket.id} left company room: ${roomName}`);
      }
    });

    // Join authorized outlet room
    socket.on("joinOutlet", (data) => {
      const restaurantId = typeof data === "string" ? data : data?.restaurantId || data?.outletId;
      const companyId = typeof data === "object" ? data?.companyId : null;

      if (restaurantId) {
        const roomName = `restaurant:${restaurantId}`;
        socket.join(roomName);
        console.log(`👤 [SOCKET] ${socket.id} joined outlet room: ${roomName}`);
      }
      if (companyId) {
        const companyRoom = `company:${companyId}`;
        socket.join(companyRoom);
        console.log(`👤 [SOCKET] ${socket.id} joined company room: ${companyRoom}`);
      }
    });

    // Leave outlet room
    socket.on("leaveOutlet", (data) => {
      const restaurantId = typeof data === "string" ? data : data?.restaurantId || data?.outletId;
      if (restaurantId) {
        const roomName = `restaurant:${restaurantId}`;
        socket.leave(roomName);
        console.log(`👋 [SOCKET] ${socket.id} left outlet room: ${roomName}`);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ [SOCKET] Disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn("⚠️ Socket.io is not initialized yet.");
  }
  return io;
};

/**
 * Helper to emit event to company and restaurant rooms cleanly without duplicates
 */
const emitToTenant = (companyId, restaurantId, eventName, payload) => {
  if (!io) return;
  const rooms = new Set();
  if (companyId) rooms.add(`company:${companyId}`);
  if (restaurantId && restaurantId !== "ALL") rooms.add(`restaurant:${restaurantId}`);
  rooms.add("restaurant:ALL");

  const roomArray = Array.from(rooms);
  if (roomArray.length > 0) {
    io.to(roomArray).emit(eventName, payload);
  }
};

/**
 * Emit kitchen order created event when Waiter sends order to kitchen (KOT created)
 */
export const emitKitchenOrderCreated = (kotData, orderData) => {
  if (!io) return;
  const companyId = orderData?.companyId || kotData?.order?.companyId || kotData?.restaurant?.companyId;
  const restaurantId = orderData?.restaurantId || kotData?.restaurantId;

  const payload = {
    kitchenOrderId: kotData?.id,
    orderId: orderData?.id || kotData?.orderId,
    orderNumber: orderData?.orderNumber || kotData?.order?.orderNumber || kotData?.kotNumber,
    kotNumber: kotData?.kotNumber,
    companyId: companyId,
    restaurantId: restaurantId,
    outletId: restaurantId,
    tableId: orderData?.tableId || kotData?.order?.tableId,
    tableNumber: orderData?.table?.tableNumber || kotData?.tableNumber || null,
    orderType: orderData?.orderType || kotData?.orderType || "DINE_IN",
    status: kotData?.status || "NEW",
    orderStatus: orderData?.status || "CONFIRMED",
    kot: kotData,
    order: orderData,
    items: kotData?.items || orderData?.items || [],
    createdAt: kotData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log(`🍳 [KDS] Kitchen order created: ${payload.orderNumber} (${payload.kotNumber})`);
  console.log(`📢 [SOCKET] Emitting kitchen-order-created to company:${companyId} & restaurant:${restaurantId}`);

  emitToTenant(companyId, restaurantId, "restaurant:kitchen-order-created", payload);
  emitToTenant(companyId, restaurantId, "orderStatusUpdated", payload);
};

/**
 * Emit kitchen order updated event when Kitchen Staff updates KOT status (e.g. PREPARING, READY, SERVED)
 */
export const emitKitchenOrderUpdated = (kotData, orderData) => {
  if (!io) return;
  const companyId = orderData?.companyId || kotData?.order?.companyId || kotData?.restaurant?.companyId;
  const restaurantId = orderData?.restaurantId || kotData?.restaurantId;

  const payload = {
    kitchenOrderId: kotData?.id,
    orderId: orderData?.id || kotData?.orderId,
    orderNumber: orderData?.orderNumber || kotData?.order?.orderNumber || kotData?.kotNumber,
    kotNumber: kotData?.kotNumber,
    companyId: companyId,
    restaurantId: restaurantId,
    outletId: restaurantId,
    tableId: orderData?.tableId || kotData?.order?.tableId,
    tableNumber: orderData?.table?.tableNumber || kotData?.tableNumber || null,
    orderType: orderData?.orderType || kotData?.orderType || "DINE_IN",
    status: kotData?.status,
    orderStatus: orderData?.status || kotData?.status,
    kot: kotData,
    order: orderData,
    items: kotData?.items || orderData?.items || [],
    updatedAt: new Date().toISOString(),
  };

  console.log(`🍳 [KDS] Kitchen order updated: ${payload.kotNumber} -> ${payload.status}`);
  console.log(`📢 [SOCKET] Emitting kitchen-order-updated to company:${companyId} & restaurant:${restaurantId}`);

  emitToTenant(companyId, restaurantId, "restaurant:kitchen-order-updated", payload);
  emitToTenant(companyId, restaurantId, "orderStatusUpdated", payload);
};

/**
 * Emit order status update event to the specific restaurant outlet room and company room
 */
export const emitOrderStatusUpdate = (orderData) => {
  if (!io) return;
  const companyId = orderData?.companyId || orderData?.kot?.restaurant?.companyId;
  const restaurantId = orderData?.restaurantId || orderData?.kot?.restaurantId;

  const payload = {
    orderId: orderData?.id,
    orderNumber: orderData?.orderNumber,
    tableId: orderData?.tableId,
    tableNumber: orderData?.table?.tableNumber || orderData?.tableNumber || null,
    status: orderData?.status,
    companyId: companyId,
    restaurantId: restaurantId,
    orderType: orderData?.orderType,
    items: orderData?.items || [],
    kot: orderData?.kot || null,
    kitchenOrderId: orderData?.kot?.id || null,
    updatedAt: new Date().toISOString(),
    order: orderData,
  };

  console.log(`📢 [SOCKET] Emitting orderStatusUpdated for Order ${orderData.orderNumber || orderData.id} (Status: ${orderData.status})`);

  emitToTenant(companyId, restaurantId, "restaurant:kitchen-order-updated", payload);
  emitToTenant(companyId, restaurantId, "orderStatusUpdated", payload);
};

/**
 * Area & Table Event Emitters (Real-Time Floor Plan & Table Management)
 */
export const emitAreaCreated = (areaData, companyId) => {
  if (!io) return;
  const targetCompId = companyId || areaData?.restaurant?.companyId;
  const targetRestId = areaData?.restaurantId;

  const payload = {
    area: areaData,
    areaId: areaData?.id,
    restaurantId: targetRestId,
    companyId: targetCompId,
    createdAt: new Date().toISOString(),
  };

  console.log(`[TABLES] Area created: "${areaData?.name}" (${areaData?.id})`);
  emitToTenant(targetCompId, targetRestId, "restaurant:area-created", payload);
};

export const emitAreaUpdated = (areaData, companyId) => {
  if (!io) return;
  const targetCompId = companyId || areaData?.restaurant?.companyId;
  const targetRestId = areaData?.restaurantId;

  const payload = {
    area: areaData,
    areaId: areaData?.id,
    restaurantId: targetRestId,
    companyId: targetCompId,
    updatedAt: new Date().toISOString(),
  };

  console.log(`[TABLES] Area updated: "${areaData?.name}" (${areaData?.id})`);
  emitToTenant(targetCompId, targetRestId, "restaurant:area-updated", payload);
};

export const emitAreaDeleted = (areaId, restaurantId, companyId) => {
  if (!io) return;
  const payload = {
    areaId,
    restaurantId,
    companyId,
    deletedAt: new Date().toISOString(),
  };

  console.log(`[TABLES] Area deleted: (${areaId})`);
  emitToTenant(companyId, restaurantId, "restaurant:area-deleted", payload);
};

export const emitTableCreated = (tableData, companyId) => {
  if (!io) return;
  const targetCompId = companyId || tableData?.restaurant?.companyId;
  const targetRestId = tableData?.restaurantId;

  const payload = {
    table: tableData,
    tableId: tableData?.id,
    tableNumber: tableData?.tableNumber,
    areaId: tableData?.areaId,
    status: tableData?.status,
    capacity: tableData?.capacity,
    restaurantId: targetRestId,
    companyId: targetCompId,
    createdAt: new Date().toISOString(),
  };

  console.log(`[TABLES] Table created: "${tableData?.tableNumber}" (${tableData?.id}) in Area ${tableData?.areaId}`);
  emitToTenant(targetCompId, targetRestId, "restaurant:table-created", payload);
};

export const emitTableUpdated = (tableData, companyId) => {
  if (!io) return;
  const targetCompId = companyId || tableData?.restaurant?.companyId;
  const targetRestId = tableData?.restaurantId;

  const payload = {
    table: tableData,
    tableId: tableData?.id,
    tableNumber: tableData?.tableNumber,
    areaId: tableData?.areaId,
    status: tableData?.status,
    capacity: tableData?.capacity,
    restaurantId: targetRestId,
    companyId: targetCompId,
    updatedAt: new Date().toISOString(),
  };

  console.log(`[TABLES] Table updated: "${tableData?.tableNumber}" (${tableData?.id})`);
  emitToTenant(targetCompId, targetRestId, "restaurant:table-updated", payload);
  emitToTenant(targetCompId, targetRestId, "restaurant:table-status-updated", payload);
};

export const emitTableStatusUpdated = (tableData, companyId) => {
  if (!io) return;
  const targetCompId = companyId || tableData?.restaurant?.companyId;
  const targetRestId = tableData?.restaurantId;

  const payload = {
    table: tableData,
    tableId: tableData?.id,
    tableNumber: tableData?.tableNumber,
    areaId: tableData?.areaId,
    status: tableData?.status,
    restaurantId: targetRestId,
    companyId: targetCompId,
    updatedAt: new Date().toISOString(),
  };

  console.log(`[TABLES] Table status changed: "${tableData?.tableNumber || tableData?.id}" -> ${tableData?.status}`);
  emitToTenant(targetCompId, targetRestId, "restaurant:table-status-updated", payload);
};

export const emitTableDeleted = (tableId, restaurantId, companyId) => {
  if (!io) return;
  const payload = {
    tableId,
    restaurantId,
    companyId,
    deletedAt: new Date().toISOString(),
  };

  console.log(`[TABLES] Table deleted: (${tableId})`);
  emitToTenant(companyId, restaurantId, "restaurant:table-deleted", payload);
};

/**
 * Emit real-time dashboard updates (e.g. sale.completed, stock.updated, employee.created)
 */
export const emitDashboardUpdate = (companyId, eventName = "dashboard.updated", payload = {}) => {
  if (!io) return;
  if (companyId) {
    io.to(`company:${companyId}`).emit(eventName, payload);
  }
  // Broadcast to global dashboard listeners as well
  io.emit(eventName, payload);
};

