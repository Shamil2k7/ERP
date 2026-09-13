import { io } from "socket.io-client";

let socket = null;
let currentOutletId = null;
let currentCompanyId = null;

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      return process.env.NEXT_PUBLIC_SOCKET_URL;
    }
    if (process.env.NEXT_PUBLIC_API_URL) {
      try {
        const url = new URL(process.env.NEXT_PUBLIC_API_URL);
        return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`;
      } catch (e) {
        return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
      }
    }
    const host = window.location.hostname || "localhost";
    return `http://${host}:5000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
};

export const getSocket = () => {
  if (!socket) {
    const backendUrl = getBackendUrl();
    console.log(`🔌 [SOCKET] Initializing connection to: ${backendUrl}`);

    socket = io(backendUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log(`✅ [SOCKET] Connected successfully. Socket ID: ${socket.id}`);
      if (currentCompanyId) {
        socket.emit("joinCompany", { companyId: currentCompanyId });
        console.log(`🏢 [SOCKET] Joined company room: company:${currentCompanyId}`);
      }
      if (currentOutletId) {
        socket.emit("joinOutlet", { restaurantId: currentOutletId, companyId: currentCompanyId });
        console.log(`👤 [SOCKET] Joined outlet room: restaurant:${currentOutletId}`);
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn(`❌ [SOCKET] Disconnected:`, reason);
    });

    socket.on("connect_error", (error) => {
      console.warn("⚠️ [SOCKET] Connection Error:", error.message);
    });
  }

  return socket;
};

export const joinCompanyRoom = (companyId) => {
  if (!companyId) return;
  currentCompanyId = companyId;
  const s = getSocket();
  if (s.connected) {
    s.emit("joinCompany", { companyId });
    console.log(`🏢 [SOCKET] Joined company room: company:${companyId}`);
  }
};

export const joinOutletRoom = (restaurantId, companyId) => {
  if (restaurantId) currentOutletId = restaurantId;
  if (companyId) currentCompanyId = companyId;

  const s = getSocket();
  if (s.connected) {
    if (currentCompanyId) {
      s.emit("joinCompany", { companyId: currentCompanyId });
      console.log(`🏢 [SOCKET] Joined company room: company:${currentCompanyId}`);
    }
    if (currentOutletId) {
      s.emit("joinOutlet", { restaurantId: currentOutletId, companyId: currentCompanyId });
      console.log(`👤 [SOCKET] Joined outlet room: restaurant:${currentOutletId}`);
    }
  }
};

export const leaveOutletRoom = (restaurantId) => {
  if (!restaurantId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit("leaveOutlet", { restaurantId });
  }
};

export const subscribeToKitchenOrderCreated = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received kitchen-order-created:", data?.orderNumber || data?.kotNumber || data?.orderId);
    callback(data);
  };
  s.on("restaurant:kitchen-order-created", handler);
  return () => {
    s.off("restaurant:kitchen-order-created", handler);
  };
};

export const subscribeToKitchenOrderUpdated = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received kitchen-order-updated:", data?.orderNumber || data?.kotNumber, `-> ${data?.status}`);
    callback(data);
  };
  s.on("restaurant:kitchen-order-updated", handler);
  return () => {
    s.off("restaurant:kitchen-order-updated", handler);
  };
};

export const subscribeToOrderStatus = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received orderStatusUpdated:", data?.orderNumber || data?.id, `-> ${data?.status}`);
    callback(data);
  };
  s.on("orderStatusUpdated", handler);
  return () => {
    s.off("orderStatusUpdated", handler);
  };
};

export const subscribeToAreaCreated = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received area-created:", data?.area?.name || data?.areaId);
    callback(data);
  };
  s.on("restaurant:area-created", handler);
  return () => {
    s.off("restaurant:area-created", handler);
  };
};

export const subscribeToAreaUpdated = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received area-updated:", data?.area?.name || data?.areaId);
    callback(data);
  };
  s.on("restaurant:area-updated", handler);
  return () => {
    s.off("restaurant:area-updated", handler);
  };
};

export const subscribeToAreaDeleted = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received area-deleted:", data?.areaId);
    callback(data);
  };
  s.on("restaurant:area-deleted", handler);
  return () => {
    s.off("restaurant:area-deleted", handler);
  };
};

export const subscribeToTableCreated = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received table-created:", data?.tableNumber || data?.table?.tableNumber || data?.tableId);
    callback(data);
  };
  s.on("restaurant:table-created", handler);
  return () => {
    s.off("restaurant:table-created", handler);
  };
};

export const subscribeToTableUpdated = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received table-updated:", data?.tableNumber || data?.table?.tableNumber || data?.tableId);
    callback(data);
  };
  s.on("restaurant:table-updated", handler);
  return () => {
    s.off("restaurant:table-updated", handler);
  };
};

export const subscribeToTableStatusUpdated = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received table-status-updated:", data?.tableNumber || data?.table?.tableNumber || data?.tableId, `-> ${data?.status}`);
    callback(data);
  };
  s.on("restaurant:table-status-updated", handler);
  return () => {
    s.off("restaurant:table-status-updated", handler);
  };
};

export const subscribeToTableDeleted = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    console.log("⚡ [SOCKET] Received table-deleted:", data?.tableId);
    callback(data);
  };
  s.on("restaurant:table-deleted", handler);
  return () => {
    s.off("restaurant:table-deleted", handler);
  };
};

export const subscribeToReconnect = (callback) => {
  const s = getSocket();
  s.on("connect", callback);
  return () => {
    s.off("connect", callback);
  };
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentOutletId = null;
    currentCompanyId = null;
  }
};

export const socketService = {
  getSocket,
  joinCompanyRoom,
  joinOutletRoom,
  leaveOutletRoom,
  subscribeToKitchenOrderCreated,
  subscribeToKitchenOrderUpdated,
  subscribeToOrderStatus,
  subscribeToAreaCreated,
  subscribeToAreaUpdated,
  subscribeToAreaDeleted,
  subscribeToTableCreated,
  subscribeToTableUpdated,
  subscribeToTableStatusUpdated,
  subscribeToTableDeleted,
  subscribeToReconnect,
  disconnectSocket,
  on: (event, callback) => {
    const s = getSocket();
    s.on(event, callback);
  },
  off: (event, callback) => {
    const s = getSocket();
    s.off(event, callback);
  },
};

export default socketService;

