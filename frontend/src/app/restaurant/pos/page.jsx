"use client";

import { Suspense, useState, useEffect, useRef } from "react";

import { useSearchParams, useRouter } from "next/navigation";
import styles from "./RestaurantPOS.module.css";
import { restaurantService } from "@/services/restaurantService";
import { getCustomers } from "@/services/customerService";
import { useCompany } from "@/context/CompanyContext";
import Swal, { showSuccess, showError, showWarning, showConfirm, showToastNotification } from "@/utils/swal";
import {
  joinCompanyRoom,
  joinOutletRoom,
  leaveOutletRoom,
  subscribeToKitchenOrderCreated,
  subscribeToKitchenOrderUpdated,
  subscribeToOrderStatus,
  subscribeToTableStatusUpdated,
  subscribeToTableCreated,
  subscribeToTableDeleted,
  subscribeToTableUpdated,
  subscribeToReconnect,
} from "@/services/socketService";

const ACTIVE_ORDER_STATUSES = [
  "NEW",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "HELD",
  "DRAFT",
];


import {
  FiCoffee,
  FiShoppingBag,
  FiUser,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiSend,
  FiCheckCircle,
  FiPrinter,
  FiCreditCard,
  FiAlertTriangle,
  FiClock,
  FiList,
  FiPauseCircle,
  FiPlay,
  FiX,
  FiCheck,
  FiBell,
} from "react-icons/fi";

function RestaurantPOSContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryTableId = searchParams.get("tableId") || "";
  const queryOrderId = searchParams.get("orderId") || "";
  const queryOutletId = searchParams.get("outletId") || searchParams.get("restaurantId") || "";
  const queryMode = searchParams.get("mode") || "";

  const { user, company } = useCompany();
  const roleStr = String(user?.role || user?.roleRef?.name || user?.type || "").toUpperCase();

  const isWaiter = roleStr.includes("WAITER") || roleStr.includes("STEWARD") || roleStr.includes("SERVER");
  const isCashier = roleStr.includes("CASHIER") || roleStr.includes("BILLING") || roleStr.includes("COUNTER");
  const isAdmin = roleStr.includes("SUPER") || roleStr.includes("ADMIN") || roleStr.includes("OWNER") || roleStr.includes("MANAGER");

  const canDoBilling = (isCashier || isAdmin) && !isWaiter;
  const isBillingMode = queryMode === "billing" || canDoBilling;


  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(queryOutletId);

  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);

  // POS State
  const [orderType, setOrderType] = useState("DINE_IN");
  const [selectedTableId, setSelectedTableId] = useState(queryTableId);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");


  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Active Order State
  const [activeOrder, setActiveOrder] = useState(null);
  const activeOrderRef = useRef(activeOrder);
  const selectedTableIdRef = useRef(selectedTableId);

  useEffect(() => {
    activeOrderRef.current = activeOrder;
  }, [activeOrder]);

  useEffect(() => {
    selectedTableIdRef.current = selectedTableId;
  }, [selectedTableId]);

  // Modals & Held Orders / Bills
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [processingPayment, setProcessingPayment] = useState(false);

  const [showHeldModal, setShowHeldModal] = useState(false);
  const [heldOrders, setHeldOrders] = useState([]);

  const [showHeldBillsModal, setShowHeldBillsModal] = useState(false);
  const [heldBills, setHeldBills] = useState([]);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");
  const [historyTableFilter, setHistoryTableFilter] = useState("ALL");

  const [showReadyModal, setShowReadyModal] = useState(false);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState(null);

  useEffect(() => {
    fetchPOSData();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      loadMenuData(selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  const menuSyncTimeoutRef = useRef(null);
  const debouncedSyncMenuData = (restId) => {
    if (menuSyncTimeoutRef.current) clearTimeout(menuSyncTimeoutRef.current);
    menuSyncTimeoutRef.current = setTimeout(() => {
      if (restId) loadMenuData(restId);
    }, 400);
  };

  useEffect(() => {
    const currentCompId = company?.id || user?.companyId;
    if (currentCompId) {
      joinCompanyRoom(currentCompId);
    }
  }, [company?.id, user?.companyId]);

  // Real-Time Order & Table Status Update Listener (Socket.IO)
  useEffect(() => {
    if (!selectedRestaurantId) return;

    const currentCompId = company?.id || user?.companyId;
    if (currentCompId) joinCompanyRoom(currentCompId);
    joinOutletRoom(selectedRestaurantId, currentCompId);

    const handleRealTimeUpdate = (data) => {
      console.log("⚡ [Waiter POS] Real-time order update received:", data);

      // Verify company isolation
      if (data.companyId && currentCompId && data.companyId !== currentCompId) {
        return;
      }
      // Verify outlet matches assigned restaurant
      if (
        data.restaurantId &&
        selectedRestaurantId !== "ALL" &&
        data.restaurantId !== selectedRestaurantId
      ) {
        return;
      }

      const targetStatus = data.status || data.orderStatus;

      // 1. When payment is completed or order is cancelled -> Table becomes AVAILABLE
      if (
        targetStatus === "COMPLETED" ||
        targetStatus === "CANCELLED" ||
        targetStatus === "PAID" ||
        targetStatus === "CLOSED"
      ) {
        // If this order is currently loaded in cart/activeOrder, clear cart immediately
        if (
          data.orderId &&
          (activeOrderRef.current?.id === data.orderId ||
            activeOrderRef.current?.orderNumber === data.orderNumber)
        ) {
          setActiveOrder(null);
          setCart([]);
          setDiscountAmount(0);
          setNotes("");
        }

        // If the order belonged to the currently selected table, clear cart
        if (data.tableId && selectedTableIdRef.current === data.tableId) {
          setActiveOrder(null);
          setCart([]);
          setDiscountAmount(0);
          setNotes("");
        }

        // Update table in-memory: clear active order & set status to AVAILABLE
        if (data.tableId) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === data.tableId
                ? {
                    ...t,
                    status: "AVAILABLE",
                    orders: (t.orders || []).filter(
                      (o) => o.id !== data.orderId && o.orderNumber !== data.orderNumber
                    ),
                  }
                : t
            )
          );
        }
      } else if (targetStatus === "SERVED") {
        // 2. When order is SERVED -> Table MUST REMAIN OCCUPIED!
        if (
          isWaiter &&
          data.orderId &&
          (activeOrderRef.current?.id === data.orderId ||
            activeOrderRef.current?.orderNumber === data.orderNumber)
        ) {
          setActiveOrder(null);
          setCart([]);
          setDiscountAmount(0);
          setNotes("");
        }

        // Update table in-memory: status remains OCCUPIED, update order status to SERVED
        if (data.tableId) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === data.tableId
                ? {
                    ...t,
                    status: "OCCUPIED",
                    orders: (t.orders || []).map((o) =>
                      o.id === data.orderId || o.orderNumber === data.orderNumber
                        ? { ...o, status: "SERVED" }
                        : o
                    ),
                  }
                : t
            )
          );
        }
      } else if (data.orderId) {
        // 3. For NEW, CONFIRMED, PREPARING, READY -> Table is OCCUPIED
        if (data.tableId) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === data.tableId
                ? {
                    ...t,
                    status: "OCCUPIED",
                    orders: (t.orders || []).map((o) =>
                      o.id === data.orderId || o.orderNumber === data.orderNumber
                        ? { ...o, status: targetStatus }
                        : o
                    ),
                  }
                : t
            )
          );
        }

        // Update active order state dynamically if open
        setActiveOrder((prev) => {
          if (prev && (prev.id === data.orderId || prev.orderNumber === data.orderNumber)) {
            return { ...prev, status: targetStatus };
          }
          return prev;
        });
      }


      // Automatically sync POS state in background with debouncing
      debouncedSyncMenuData(selectedRestaurantId);

      // Trigger non-blocking SweetAlert2 toast notification ONLY for Waiters when order becomes READY
      if (targetStatus === "READY" && !isCashier && isWaiter) {
        const tblNum = data.tableNumber || (data.table ? data.table.tableNumber : "");
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "info",
          title: `Order Ready for Table ${tblNum || ""}`,
          text: `Order #${data.orderNumber || ""} is ready to serve!`,
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
        });
      }
    };

    // Table Real-Time Updates from Table Management
    const handleTableStatusUpdate = (data) => {
      console.log("⚡ [Waiter POS] Real-time table status update received:", data);
      if (data.companyId && currentCompId && data.companyId !== currentCompId) return;
      if (
        data.restaurantId &&
        selectedRestaurantId !== "ALL" &&
        data.restaurantId !== selectedRestaurantId
      ) {
        return;
      }

      const tblId = data.tableId || data.table?.id || data.id;
      const targetStatus = data.status || data.table?.status;

      if (tblId && targetStatus) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === tblId || (data.tableNumber && t.tableNumber === data.tableNumber)
              ? { ...t, status: targetStatus }
              : t
          )
        );

        if (
          targetStatus === "AVAILABLE" &&
          (selectedTableIdRef.current === tblId || (data.tableNumber && tables.find(t => t.id === selectedTableIdRef.current)?.tableNumber === data.tableNumber))
        ) {
          // If table becomes AVAILABLE and had a non-active order in view, clear cart
          if (activeOrderRef.current && !ACTIVE_ORDER_STATUSES.includes(activeOrderRef.current.status)) {
            setActiveOrder(null);
            setCart([]);
            setDiscountAmount(0);
            setNotes("");
          }
        }
      }
    };

    const unsubscribeUpdated = subscribeToKitchenOrderUpdated(handleRealTimeUpdate);
    const unsubscribeCreated = subscribeToKitchenOrderCreated(handleRealTimeUpdate);
    const unsubscribeStatus = subscribeToOrderStatus(handleRealTimeUpdate);
    const unsubscribeTableStatus = subscribeToTableStatusUpdated(handleTableStatusUpdate);
    const unsubscribeTableCreated = subscribeToTableCreated(() => debouncedSyncMenuData(selectedRestaurantId));
    const unsubscribeTableDeleted = subscribeToTableDeleted(() => debouncedSyncMenuData(selectedRestaurantId));
    const unsubscribeTableUpdated = subscribeToTableUpdated(() => debouncedSyncMenuData(selectedRestaurantId));

    // Handle auto-reconnection synchronization
    const unsubscribeReconnect = subscribeToReconnect(() => {
      console.log("🔄 [Waiter POS] Socket reconnected - resynchronizing active orders...");
      const compId = company?.id || user?.companyId;
      if (compId) joinCompanyRoom(compId);
      if (selectedRestaurantId) joinOutletRoom(selectedRestaurantId, compId);
      debouncedSyncMenuData(selectedRestaurantId);
    });

    return () => {
      if (menuSyncTimeoutRef.current) clearTimeout(menuSyncTimeoutRef.current);
      unsubscribeUpdated();
      unsubscribeCreated();
      unsubscribeStatus();
      unsubscribeTableStatus();
      unsubscribeTableCreated();
      unsubscribeTableDeleted();
      unsubscribeTableUpdated();
      unsubscribeReconnect();
      leaveOutletRoom(selectedRestaurantId);
    };
  }, [selectedRestaurantId, company?.id]);


  // Check whether current table order has unsaved changes
  const isCartDirty = () => {
    if (!selectedTableId || orderType !== "DINE_IN") return false;
    if (!activeOrder) {
      return cart.length > 0;
    }
    const origItems = (activeOrder.items || []).map((i) => ({
      menuItemId: i.menuItemId,
      quantity: Number(i.quantity),
      notes: i.notes || "",
    }));
    const currentItems = cart.map((i) => ({
      menuItemId: i.menuItemId,
      quantity: Number(i.quantity),
      notes: i.notes || "",
    }));
    if (origItems.length !== currentItems.length) return true;
    return (
      JSON.stringify(origItems.sort((a, b) => a.menuItemId.localeCompare(b.menuItemId))) !==
      JSON.stringify(currentItems.sort((a, b) => a.menuItemId.localeCompare(b.menuItemId)))
    );
  };

  // Save / Hold current table order before switching if requested
  const saveCurrentTableOrderOnHold = async () => {
    if (cart.length === 0) return true;
    try {
      const selectedRest = restaurants.find((r) => r.id === selectedRestaurantId);
      const branchId = selectedRest?.branchId;
      const holdNote = notes ? `${notes} | HELD` : "HELD";

      if (activeOrder?.id) {
        await restaurantService.updateOrder(activeOrder.id, {
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
          notes: holdNote,
          status: activeOrder.status === "DRAFT" ? "HELD" : activeOrder.status,
        });
      } else {
        await restaurantService.createOrder({
          restaurantId: selectedRestaurantId,
          branchId,
          tableId: orderType === "DINE_IN" ? selectedTableId : null,
          customerId: selectedCustomerId || null,
          orderType,
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
          notes: holdNote,
          status: "HELD",
        });
      }
      showSuccess("Order Saved", "Current table order saved/held successfully.");
      await loadMenuData(selectedRestaurantId);
      return true;
    } catch (err) {
      showError("Failed to Save Order", err.response?.data?.message || err.message || "Failed to save order");
      return false;
    }
  };

  // Open / Load Table Active Order (Handles both orderId from Floor & Tables and table active order lookup)
  const openTableActiveOrder = async (targetTableId, orderId = null, tableList = tables, restaurantId = selectedRestaurantId) => {
    if (!targetTableId) return;

    setSelectedTableId(targetTableId);
    setOrderType("DINE_IN");

    // 1. If explicit orderId is provided from Floor & Tables, fetch the exact order directly
    if (orderId) {
      try {
        const orderRes = await restaurantService.getOrderById(orderId);
        const order = orderRes?.data || orderRes;
        const isValidForMode = isBillingMode
          ? (order && order.status !== "COMPLETED" && order.status !== "CANCELLED")
          : (order && ACTIVE_ORDER_STATUSES.includes(order.status));

        if (
          order &&
          isValidForMode &&
          (order.tableId === targetTableId || !order.tableId)
        ) {
          setActiveOrder(order);
          const rawItems = order.items || order.orderItems || order.restaurantOrderItems || [];
          const mappedItems = rawItems.map((i) => ({
            menuItemId: i.menuItemId || i.productId || i.id,
            name: i.menuItem?.name || i.product?.name || i.productName || i.name || "Item",
            unitPrice: parseFloat(i.unitPrice || i.price || i.sellingPrice || 0),
            quantity: Number(i.quantity || 1),
            notes: i.notes || "",
          }));
          setCart(mappedItems);
          setDiscountAmount(parseFloat(order.discountAmount || 0));
          setNotes(order.notes || "");
          if (order.customerId) setSelectedCustomerId(order.customerId);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch order by orderId, falling back to table active orders:", err);
      }
    }

    // 2. Otherwise find the active order within the table's orders (distinguishes Waiter vs Cashier Billing)
    const tbl = (tableList || []).find((t) => t.id === targetTableId);
    const validStatuses = isBillingMode
      ? ["CONFIRMED", "PREPARING", "READY", "SERVED", "DRAFT", "HELD"]
      : ACTIVE_ORDER_STATUSES;

    const activeTableOrder = tbl?.orders?.find(
      (o) =>
        (!o.restaurantId || !restaurantId || o.restaurantId === restaurantId) &&
        validStatuses.includes(o.status)
    );

    if (activeTableOrder) {
      setActiveOrder(activeTableOrder);
      const rawItems = activeTableOrder.items || activeTableOrder.orderItems || activeTableOrder.restaurantOrderItems || [];
      const mappedItems = rawItems.map((i) => ({
        menuItemId: i.menuItemId || i.productId || i.id,
        name: i.menuItem?.name || i.product?.name || i.productName || i.name || "Item",
        unitPrice: parseFloat(i.unitPrice || i.price || i.sellingPrice || 0),
        quantity: Number(i.quantity || 1),
        notes: i.notes || "",
      }));
      setCart(mappedItems);
      setDiscountAmount(parseFloat(activeTableOrder.discountAmount || 0));
      setNotes(activeTableOrder.notes || "");
      if (activeTableOrder.customerId) setSelectedCustomerId(activeTableOrder.customerId);
    } else {
      // Clean empty cart for table with no active order
      setActiveOrder(null);
      setCart([]);
      setDiscountAmount(0);
      setNotes("");
    }
  };


  const loadTableOrder = (targetTableId, tableList = tables) => {
    openTableActiveOrder(targetTableId, null, tableList, selectedRestaurantId);
  };

  // Table Switching with Unsaved Cart Protection
  const handleTableChange = async (newTableId) => {
    if (newTableId === selectedTableId) return;

    // Check for unsaved changes on current table
    if (orderType === "DINE_IN" && selectedTableId && isCartDirty()) {
      const result = await Swal.fire({
        title: "Unsaved Order Changes",
        text: "You have unsaved items in the current table order. What would you like to do?",
        icon: "warning",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Save / Hold Order",
        denyButtonText: "Discard Changes",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563eb",
        denyButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        allowOutsideClick: false,
      });

      if (result.isConfirmed) {
        const saved = await saveCurrentTableOrderOnHold();
        if (!saved) return;
      } else if (result.isDenied) {
        // Discard unsaved changes and proceed
      } else {
        // Cancel -> stay on current table
        return;
      }
    }

    openTableActiveOrder(newTableId, null, tables, selectedRestaurantId);
  };

  // Order Type Switching with Unsaved Cart Protection
  const handleOrderTypeChange = async (newType) => {
    if (newType === orderType) return;

    if (orderType === "DINE_IN" && selectedTableId && isCartDirty()) {
      const result = await Swal.fire({
        title: "Unsaved Order Changes",
        text: "You have unsaved items in the current table order. What would you like to do?",
        icon: "warning",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Save / Hold Order",
        denyButtonText: "Discard Changes",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563eb",
        denyButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        allowOutsideClick: false,
      });

      if (result.isConfirmed) {
        const saved = await saveCurrentTableOrderOnHold();
        if (!saved) return;
      } else if (result.isDenied) {
        // Discard
      } else {
        return;
      }
    }

    setOrderType(newType);
    if (newType !== "DINE_IN") {
      setSelectedTableId("");
      setActiveOrder(null);
      setCart([]);
      setDiscountAmount(0);
      setNotes("");
    }
  };

  const fetchPOSData = async () => {
    try {
      setLoading(true);
      const [restRes, custRes] = await Promise.all([
        restaurantService.getRestaurants(),
        getCustomers(),
      ]);

      const restList = restRes.data || [];
      setRestaurants(restList);

      // Prioritize URL outlet parameter or user assigned outlet
      let targetRestId = "";
      if (queryOutletId && restList.some((r) => r.id === queryOutletId)) {
        targetRestId = queryOutletId;
      } else if (restList.length > 0) {
        targetRestId = restList[0].id;
        if (user?.restaurantId) {
          const match = restList.find((r) => r.id === user.restaurantId);
          if (match) targetRestId = match.id;
        } else if (user?.branchId) {
          const match = restList.find((r) => r.branchId === user.branchId);
          if (match) targetRestId = match.id;
        }
      }

      setSelectedRestaurantId(targetRestId);

      const rawCustList = custRes.data || custRes || [];
      setCustomers(rawCustList);

      if (targetRestId) {
        await loadMenuData(targetRestId);
      }
    } catch (err) {
      console.error("Error loading POS data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuData = async (restaurantId) => {
    try {
      const [catRes, itemRes, tblRes] = await Promise.all([
        restaurantService.getMenuCategories(restaurantId),
        restaurantService.getMenuItems(restaurantId),
        restaurantService.getTables(restaurantId),
      ]);
      setCategories(catRes.data || []);
      setMenuItems(itemRes.data || []);
      const tblList = tblRes.data || [];
      setTables(tblList);

      // Automatically load active table order if navigating from Floor & Tables
      const targetTableId = queryTableId || selectedTableIdRef.current;
      if (targetTableId) {
        await openTableActiveOrder(targetTableId, queryOrderId, tblList, restaurantId);
      }
    } catch (err) {
      console.error("Error loading menu data:", err);
    }
  };


  // Fetch Waiter Held Draft Orders
  const loadHeldOrders = async () => {
    if (!selectedRestaurantId) return;
    try {
      const res = await restaurantService.getOrders({
        restaurantId: selectedRestaurantId,
        status: "HELD",
      });
      setHeldOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching held orders:", err);
    }
  };

  // Fetch Cashier Held Bills
  const loadHeldBills = async () => {
    if (!selectedRestaurantId) return;
    try {
      const res = await restaurantService.getOrders({
        restaurantId: selectedRestaurantId,
        search: "BILL_ON_HOLD",
      });
      const uncompletedBills = (res.data || []).filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED");
      setHeldBills(uncompletedBills);
    } catch (err) {
      console.error("Error fetching held bills:", err);
    }
  };

  // Fetch Order History
  const loadOrderHistory = async () => {
    if (!selectedRestaurantId) return;
    try {
      const res = await restaurantService.getOrders({
        restaurantId: selectedRestaurantId,
      });
      setHistoryOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching order history:", err);
    }
  };

  // Cart operations
  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: parseFloat(item.sellingPrice),
          quantity: 1,
          notes: "",
        },
      ];
    });
  };

  const handleUpdateQty = (menuItemId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  // Total Calculations
  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const taxAmount = subtotal * 0.05;
  const totalAmount = Math.max(0, subtotal - parseFloat(discountAmount || 0) + taxAmount);

  // 1. WAITER: Hold Order Action (Saves Draft before sending to Kitchen)
  const handleHoldOrder = async () => {
    if (cart.length === 0) {
      showWarning("Cart Empty", "Cart is empty. Add items before holding order.");
      return;
    }
    try {
      const selectedRest = restaurants.find((r) => r.id === selectedRestaurantId);
      const branchId = selectedRest?.branchId;

      if (activeOrder?.id) {
        await restaurantService.updateOrder(activeOrder.id, {
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
          notes,
          status: "HELD",
        });
      } else {
        await restaurantService.createOrder({
          restaurantId: selectedRestaurantId,
          branchId,
          tableId: orderType === "DINE_IN" ? selectedTableId : null,
          customerId: selectedCustomerId || null,
          orderType,
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
          notes,
          status: "HELD",
        });
      }

      showSuccess("Order Held", "Order temporarily saved as HELD.");
      setCart([]);
      setActiveOrder(null);
      setSelectedTableId("");
      setNotes("");
      loadMenuData(selectedRestaurantId);
    } catch (err) {
      showError("Failed to Hold Order", err.response?.data?.message || err.message || "Failed to hold order");
    }
  };

  // CASHIER: Hold Bill Action (Pauses Payment, Keeps Table Occupied & Order Active)
  const handleHoldBill = async () => {
    if (!activeOrder && cart.length === 0) {
      showWarning("No Active Bill", "No active bill/order to hold.");
      return;
    }
    try {
      const selectedRest = restaurants.find((r) => r.id === selectedRestaurantId);
      const holdNote = notes ? `${notes} | BILL_ON_HOLD` : "BILL_ON_HOLD";

      if (activeOrder?.id) {
        await restaurantService.updateOrder(activeOrder.id, {
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
          notes: holdNote,
        });
      } else {
        await restaurantService.createOrder({
          restaurantId: selectedRestaurantId,
          branchId: selectedRest?.branchId,
          tableId: orderType === "DINE_IN" ? selectedTableId : null,
          customerId: selectedCustomerId || null,
          orderType,
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
          notes: holdNote,
          status: "CONFIRMED",
        });
      }

      showSuccess("Bill On Hold", "Bill for table set to ON HOLD. Order remains active and table occupied.");
      setCart([]);
      setActiveOrder(null);
      setSelectedTableId("");
      setNotes("");
      loadMenuData(selectedRestaurantId);
    } catch (err) {
      showError("Failed to Hold Bill", err.response?.data?.message || err.message || "Failed to hold bill");
    }
  };

  // Resume Held Order or Held Bill
  const handleResumeHeldOrder = (heldOrder) => {
    setActiveOrder(heldOrder);
    setOrderType(heldOrder.orderType || "DINE_IN");
    if (heldOrder.tableId) setSelectedTableId(heldOrder.tableId);
    if (heldOrder.customerId) setSelectedCustomerId(heldOrder.customerId);
    if (heldOrder.items) {
      setCart(
        heldOrder.items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.menuItem?.name || "Item",
          unitPrice: parseFloat(i.unitPrice),
          quantity: i.quantity,
          notes: i.notes || "",
        }))
      );
    }
    setShowHeldModal(false);
    setShowHeldBillsModal(false);
  };

  // Mark Order as Served
  const handleMarkServed = async (orderId) => {
    try {
      await restaurantService.updateOrder(orderId, { status: "SERVED" });
      showSuccess("Order Marked as Served", "Order status updated to SERVED. Stock deducted successfully.");
      if (activeOrder && (activeOrder.id === orderId || activeOrder.orderNumber === orderId)) {
        setActiveOrder(null);
        setCart([]);
        setDiscountAmount(0);
        setNotes("");
      }
      await loadMenuData(selectedRestaurantId);
    } catch (err) {
      showError("Failed to Mark Served", err.response?.data?.message || err.message || "Failed to mark order as served");
    }
  };


  // Cancel Held Order
  const handleCancelHeldOrder = async (orderId) => {
    const isConfirmed = await showConfirm({
      title: "Cancel Held Order?",
      text: "Are you sure you want to cancel this held order?",
      confirmButtonText: "Yes, Cancel",
      icon: "warning",
    });
    if (!isConfirmed) return;
    try {
      await restaurantService.cancelOrder(orderId, "Cancelled from Held Orders");
      loadHeldOrders();
      loadMenuData(selectedRestaurantId);
      showSuccess("Order Cancelled", "Held order was successfully cancelled.");
    } catch (err) {
      showError("Cancel Failed", err.response?.data?.message || "Failed to cancel order");
    }
  };

  // 2. WAITER: Send Order to Kitchen (Confirm Order & Route to KDS)
  const handleSendKOT = async () => {
    if (cart.length === 0) {
      showWarning("Cart Empty", "Cart is empty.");
      return;
    }
    if (orderType === "DINE_IN" && (!selectedTableId || selectedTableId.trim() === "")) {
      showWarning("Table Required", "Please select a table before sending the order to the kitchen.");
      return;
    }

    try {
      const selectedRest = restaurants.find((r) => r.id === selectedRestaurantId);
      const branchId = selectedRest?.branchId;

      let orderId = activeOrder?.id;

      if (orderId) {
        // Accumulate/update existing active table order
        await restaurantService.updateOrder(orderId, {
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
          notes,
        });
      } else {
        // Create new table order
        const createRes = await restaurantService.createOrder({
          restaurantId: selectedRestaurantId,
          branchId,
          tableId: orderType === "DINE_IN" ? selectedTableId : null,
          customerId: selectedCustomerId || null,
          orderType,
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
          notes,
          status: "DRAFT",
        });
        orderId = createRes.data?.id;
      }

      const confirmRes = await restaurantService.confirmOrderAndSendKOT(orderId, null, false);
      showSuccess("KOT Sent!", `KOT Generated: ${confirmRes.data?.kot?.kotNumber || "Success"}. Order automatically sent to Kitchen Display (KDS).`);
      
      setCart([]);
      setActiveOrder(null);
      setSelectedTableId("");
      loadMenuData(selectedRestaurantId);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to send order";
      if (errorMsg.includes("Insufficient stock for preparation")) {
        const lines = errorMsg.replace("Insufficient stock for preparation:", "").trim();
        const formattedList = lines
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => `<li style="margin-bottom: 6px; color: #1e293b; font-weight: 500;">${l}</li>`)
          .join("");

        Swal.fire({
          icon: "error",
          title: "Insufficient Stock",
          html: `<div style="text-align: left; font-size: 14px; padding: 4px 8px;">
            <p style="margin-bottom: 12px; color: #64748b; font-size: 13px;">The following recipe raw materials / ingredients do not have enough stock in inventory:</p>
            <ul style="padding-left: 20px; margin: 0; line-height: 1.5;">
              ${formattedList}
            </ul>
          </div>`,
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Understood",
        });
      } else {
        showError("Failed to Send Order", errorMsg);
      }
    }
  };

  // Print Handlers for Cashier
  const handlePrintProvisionalBill = () => {
    if (!activeOrder && cart.length === 0) {
      showWarning("No Order", "No active bill/order to print.");
      return;
    }
    const currentRest = restaurants.find((r) => r.id === selectedRestaurantId);
    const currentTbl = tables.find((t) => t.id === selectedTableId);
    const provisionalOrder = {
      id: activeOrder?.id || `TEMP-${Date.now()}`,
      orderNumber: activeOrder?.orderNumber || `PROV-${Date.now().toString().slice(-6)}`,
      orderType: orderType || "DINE_IN",
      status: activeOrder?.status || "CONFIRMED",
      isProvisional: true,
      paymentStatus: "UNPAID",
      table: currentTbl || activeOrder?.table,
      tableId: selectedTableId,
      restaurant: currentRest,
      restaurantId: selectedRestaurantId,
      items: cart.map((i, idx) => ({
        id: `item-${idx}`,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.unitPrice * i.quantity,
        menuItem: { name: i.name },
        notes: i.notes,
      })),
      subtotal: subtotal,
      discountAmount: parseFloat(discountAmount || 0),
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      createdAt: activeOrder?.createdAt || new Date(),
    };
    setSelectedPrintOrder(provisionalOrder);
  };

  const handlePrintPaidReceipt = (order = activeOrder) => {
    const targetOrder = order || activeOrder;
    if (!targetOrder) return;
    const currentRest = restaurants.find((r) => r.id === selectedRestaurantId);
    const currentTbl = tables.find((t) => t.id === (targetOrder.tableId || selectedTableId));
    setSelectedPrintOrder({
      ...targetOrder,
      isProvisional: false,
      paymentStatus: "PAID",
      paymentMethod: paymentMethod || targetOrder.payments?.[0]?.method || "CASH",
      restaurant: targetOrder.restaurant || currentRest,
      table: targetOrder.table || currentTbl,
      totalAmount: targetOrder.totalAmount || totalAmount,
    });
  };

  const handleReprintReceipt = (order = activeOrder) => {
    handlePrintPaidReceipt(order);
  };

  // 3. CASHIER: Complete Order & Process Payment Action
  const handleProcessPayment = async () => {
    if (!activeOrder && cart.length === 0) {
      showWarning("No Order", "No active bill/order to process.");
      return;
    }

    try {
      setProcessingPayment(true);
      let orderId = activeOrder?.id;

      if (!orderId) {
        const selectedRest = restaurants.find((r) => r.id === selectedRestaurantId);
        const createRes = await restaurantService.createOrder({
          restaurantId: selectedRestaurantId,
          branchId: selectedRest?.branchId,
          tableId: orderType === "DINE_IN" ? selectedTableId : null,
          customerId: selectedCustomerId || null,
          orderType,
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
          notes,
          status: "CONFIRMED",
        });
        orderId = createRes.data?.id;
      } else if (cart.length > 0) {
        await restaurantService.updateOrder(orderId, {
          items: cart,
          subtotal,
          discountAmount: parseFloat(discountAmount || 0),
          taxAmount,
          totalAmount,
        });
      }

      await restaurantService.completeOrder(orderId, {
        amount: totalAmount || (activeOrder ? parseFloat(activeOrder.totalAmount) : 0),
        method: paymentMethod,
      });

      const currentRest = restaurants.find((r) => r.id === selectedRestaurantId);
      const currentTbl = tables.find((t) => t.id === selectedTableId);

      const paidOrderReceipt = {
        ...(activeOrder || {}),
        id: orderId,
        orderNumber: activeOrder?.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
        orderType: orderType || "DINE_IN",
        table: currentTbl || activeOrder?.table,
        restaurant: currentRest,
        items: cart.map((i, idx) => ({
          id: `item-${idx}`,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.unitPrice * i.quantity,
          menuItem: { name: i.name },
          notes: i.notes,
        })),
        subtotal: subtotal,
        discountAmount: parseFloat(discountAmount || 0),
        taxAmount: taxAmount,
        totalAmount: totalAmount || parseFloat(activeOrder?.totalAmount || 0),
        status: "COMPLETED",
        paymentStatus: "PAID",
        paymentMethod: paymentMethod,
        isProvisional: false,
        createdAt: activeOrder?.createdAt || new Date(),
      };

      showSuccess("Payment Confirmed!", "Payment Confirmed! Order status updated to COMPLETED. Table is now AVAILABLE.");
      setShowPayModal(false);
      setSelectedPrintOrder(paidOrderReceipt);

      setCart([]);
      setActiveOrder(null);
      setSelectedTableId("");
      loadMenuData(selectedRestaurantId);
      if (showHistoryModal) loadOrderHistory();
    } catch (err) {
      showError("Payment Failed", err.response?.data?.message || err.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Extract all READY TO SERVE orders for current outlet (WAITER ONLY - completely hidden from Cashier)
  const readyOrders = [];
  if (!isCashier && isWaiter) {
    tables.forEach((t) => {
      if (t.orders && t.orders.length > 0) {
        t.orders.forEach((o) => {
          if (o.status === "READY") {
            readyOrders.push({
              ...o,
              tableNumber: t.tableNumber,
              areaName: t.area?.name,
            });
          }
        });
      }
    });
  }

  const filteredMenuItems = menuItems.filter((i) => {
    const matchesCat = activeCategoryId === "ALL" || i.categoryId === activeCategoryId;
    const matchesSearch = !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredHistoryOrders = historyOrders.filter((o) => {
    const matchesSearch = !historySearch || (o.orderNumber || "").toLowerCase().includes(historySearch.toLowerCase());
    const matchesStatus = historyStatusFilter === "ALL" || o.status === historyStatusFilter;
    const matchesTable = historyTableFilter === "ALL" || o.tableId === historyTableFilter;
    return matchesSearch && matchesStatus && matchesTable;
  });

  if (loading) {
    return <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>Loading Restaurant POS...</div>;
  }

  return (
    <div className={styles.posLayout}>
      {/* LEFT & CENTER PANEL: Menu & Controls */}
      <div className={styles.leftPanel}>
        {/* Top Control Bar */}
        <div className={styles.topControlBar}>
          {/* Order Type Selector */}
          <div className={styles.orderTypeGroup}>
            {["DINE_IN", "TAKEAWAY", "DELIVERY"].map((type) => (
              <button
                key={type}
                onClick={() => handleOrderTypeChange(type)}
                className={`${styles.orderTypeBtn} ${orderType === type ? styles.orderTypeBtnActive : ""}`}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Table Picker for DINE_IN */}
          {orderType === "DINE_IN" && (
            <select
              value={selectedTableId}
              onChange={(e) => handleTableChange(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">Select Table...</option>
              {tables.map((t) => {
                const activeTblOrder = t.orders?.find(
                  (o) => ACTIVE_ORDER_STATUSES.includes(o.status)
                );
                const statusBadge = activeTblOrder
                  ? `Active Order (${activeTblOrder.status})`
                  : t.status || "AVAILABLE";
                return (
                  <option key={t.id} value={t.id}>
                    {t.tableNumber} {t.area?.name ? `(${t.area.name})` : ""} — {statusBadge}
                  </option>
                );
              })}

            </select>
          )}

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />

          {/* TOP RIGHT TOOLBAR BUTTONS */}
          <div className={styles.toolBarGroup}>
            {/* WAITER ONLY: Ready Orders Bell button */}
            {!isCashier && isWaiter && (
              <button
                onClick={() => setShowReadyModal(true)}
                className={`${styles.actionBtn} ${readyOrders.length > 0 ? styles.readyBtnActive : ""}`}
              >
                <FiBell size={14} /> Ready ({readyOrders.length})
              </button>
            )}

            <button
              onClick={() => {
                loadHeldOrders();
                setShowHeldModal(true);
              }}
              className={styles.actionBtn}
            >
              <FiClock size={14} /> Held Orders
            </button>

            {canDoBilling && (
              <>
                <button
                  onClick={() => {
                    loadHeldBills();
                    setShowHeldBillsModal(true);
                  }}
                  className={styles.actionBtn}
                >
                  <FiPauseCircle size={14} /> Held Bills
                </button>

                <button
                  onClick={() => {
                    loadOrderHistory();
                    setShowHistoryModal(true);
                  }}
                  className={styles.actionBtn}
                >
                  <FiList size={14} /> Order History
                </button>
              </>
            )}
          </div>
        </div>

        {/* INLINE READY TO SERVE SECTION (WAITER ONLY - COMPLETELY HIDDEN FROM CASHIER) */}
        {!isCashier && isWaiter && readyOrders.length > 0 && (
          <div style={{ padding: "14px 20px", backgroundColor: "#eff6ff", borderBottom: "2px solid #2563eb", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "800", color: "#1e40af", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <FiBell size={16} color="#2563eb" /> READY TO SERVE ORDERS ({readyOrders.length})
              </span>
              <span style={{ fontSize: "11px", fontWeight: "700", backgroundColor: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "10px" }}>
                Kitchen Completed
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
              {readyOrders.map((ro) => (
                <div key={ro.id} style={{ backgroundColor: "#ffffff", border: "1px solid #dbeafe", borderRadius: "8px", padding: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "800", fontSize: "14px", color: "#0f172a" }}>Table {ro.tableNumber}</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb" }}>#{ro.orderNumber}</span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#475569", marginBottom: "10px" }}>
                    {ro.items?.map((item, idx) => (
                      <div key={idx} style={{ fontWeight: "600" }}>
                        {item.quantity} × {item.menuItem?.name || "Item"}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleMarkServed(ro.id)}
                    style={{
                      width: "100%",
                      padding: "7px",
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <FiCheckCircle size={14} /> Mark as Served
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Pills */}
        <div className={styles.categoryBar}>
          <button
            onClick={() => setActiveCategoryId("ALL")}
            className={`${styles.categoryPill} ${activeCategoryId === "ALL" ? styles.categoryPillActive : ""}`}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`${styles.categoryPill} ${activeCategoryId === cat.id ? styles.categoryPillActive : ""}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className={styles.menuGridArea}>
          {restaurants.length === 0 ? (
            <div className={styles.emptyBoxContainer}>
              <FiShoppingBag size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>No Restaurant Outlets Available</h3>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className={styles.emptyBoxContainer}>
              <FiShoppingBag size={48} color="#94a3b8" style={{ marginBottom: "12px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>No Menu Items Found</h3>
            </div>
          ) : (
            <div className={styles.dishGrid}>
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddToCart(item)}
                  className={styles.dishCard}
                >
                  <div>
                    <div className={styles.dishName}>{item.name}</div>
                    <div className={styles.dishCategory}>{item.category?.name}</div>
                  </div>
                  <div className={styles.dishFooter}>
                    <span className={styles.dishPrice}>₹{parseFloat(item.sellingPrice).toFixed(2)}</span>
                    <span className={styles.addBadge}>
                      <FiPlus size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Current Cart & Checkout */}
      <div className={styles.rightPanel}>
        {/* Billing Mode Banner for Cashier */}
        {isBillingMode && activeOrder && (
          <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: "800", color: "#065f46" }}>🧾 BILLING MODE</span>
              <div style={{ fontSize: "11px", color: "#047857", marginTop: "2px" }}>
                Table: {tables.find((t) => t.id === selectedTableId)?.tableNumber || "Selected"} • Order #{activeOrder.orderNumber}
              </div>
            </div>
            <span style={{ fontSize: "11px", fontWeight: "800", backgroundColor: "#10b981", color: "#fff", padding: "3px 8px", borderRadius: "8px", textTransform: "uppercase" }}>
              {activeOrder.status}
            </span>
          </div>
        )}

        {/* Cart Header */}
        <div className={styles.cartHeader}>
          <div>
            <h3 className={styles.cartTitle}>
              {activeOrder ? `Order #${activeOrder.orderNumber}` : "Current Order"}
            </h3>
            <div style={{ fontSize: "12px", color: "#64748b", display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
              <span>{orderType} {selectedTableId ? `(Table ${tables.find((t) => t.id === selectedTableId)?.tableNumber})` : ""}</span>
              {activeOrder && (
                <span
                  style={{
                    fontWeight: "800",
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    backgroundColor:
                      activeOrder.status === "READY"
                        ? "#d1fae5"
                        : activeOrder.status === "PREPARING"
                        ? "#fef3c7"
                        : activeOrder.status === "CONFIRMED"
                        ? "#dbeafe"
                        : activeOrder.status === "SERVED"
                        ? "#e2e8f0"
                        : "#f1f5f9",
                    color:
                      activeOrder.status === "READY"
                        ? "#065f46"
                        : activeOrder.status === "PREPARING"
                        ? "#92400e"
                        : activeOrder.status === "CONFIRMED"
                        ? "#1e40af"
                        : activeOrder.status === "SERVED"
                        ? "#334155"
                        : "#475569",
                  }}
                >
                  {activeOrder.status === "READY" ? "🟢 READY TO SERVE" : activeOrder.status === "PREPARING" ? "🔵 PREPARING" : activeOrder.status === "CONFIRMED" ? "🟡 CONFIRMED" : activeOrder.status}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => { setCart([]); setActiveOrder(null); }} className={styles.clearBtn}>
            Clear Cart
          </button>
        </div>

        {/* Cart Items List */}
        <div className={styles.cartItemsList}>
          {cart.length === 0 ? (
            <p style={{ color: "#94a3b8", textAlign: "center", margin: "auto", fontSize: "14px" }}>Cart is empty. Select menu dishes.</p>
          ) : (
            cart.map((item) => (
              <div key={item.menuItemId} className={styles.cartItemRow}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className={styles.cartItemName}>{item.name}</div>
                  <div className={styles.cartItemTotal}>
                    ₹{(item.unitPrice * item.quantity).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>₹{item.unitPrice.toFixed(2)} each</div>
                  <div className={styles.qtyControls}>
                    <button onClick={() => handleUpdateQty(item.menuItemId, -1)} className={styles.qtyBtn}>-</button>
                    <span style={{ fontWeight: "700", fontSize: "13px" }}>{item.quantity}</span>
                    <button onClick={() => handleUpdateQty(item.menuItemId, 1)} className={styles.qtyBtn}>+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Actions */}
        <div className={styles.cartFooter}>
          {/* Financial Totals (Only visible to Cashier / Admin) */}
          {canDoBilling && (
            <>
              <div className={styles.calcRow}>
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.calcRow}>
                <span>Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  style={{ width: "80px", textAlign: "right", padding: "2px 6px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "700" }}
                />
              </div>
              <div className={styles.calcRow}>
                <span>Tax (5%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Total</span>
                <span style={{ color: "#2563eb" }}>₹{totalAmount.toFixed(2)}</span>
              </div>
            </>
          )}

          {/* Action Buttons Matrix based on Role */}
          <div className={styles.btnGrid}>
            {/* WAITER: HOLD ORDER BUTTON */}
            {isWaiter && (
              <button
                onClick={handleHoldOrder}
                disabled={cart.length === 0}
                className={`${styles.posFooterBtn} ${styles.holdBtn}`}
              >
                <FiPauseCircle size={14} /> Hold Order
              </button>
            )}

            {/* CASHIER: HOLD BILL BUTTON */}
            {canDoBilling && activeOrder?.status !== "COMPLETED" && (
              <button
                onClick={handleHoldBill}
                disabled={cart.length === 0 && !activeOrder}
                className={`${styles.posFooterBtn} ${styles.holdBtn}`}
              >
                <FiPauseCircle size={14} /> Hold Bill
              </button>
            )}

            {/* CASHIER: PRINT PROVISIONAL BILL BUTTON (BEFORE PAYMENT) */}
            {canDoBilling && activeOrder?.status !== "COMPLETED" && (
              <button
                onClick={handlePrintProvisionalBill}
                disabled={cart.length === 0 && !activeOrder}
                className={styles.posFooterBtn}
                style={{ backgroundColor: "#334155", color: "#fff", borderColor: "#334155" }}
              >
                <FiPrinter size={14} /> Print Bill
              </button>
            )}

            {/* WAITER: SEND TO KITCHEN BUTTON */}
            {isWaiter && (
              <button
                onClick={handleSendKOT}
                disabled={cart.length === 0}
                className={`${styles.posFooterBtn} ${styles.sendBtn}`}
              >
                <FiSend size={14} /> Send to Kitchen
              </button>
            )}

            {/* CASHIER: COMPLETE PAYMENT BUTTON */}
            {canDoBilling && activeOrder?.status !== "COMPLETED" && (
              <button
                onClick={() => setShowPayModal(true)}
                disabled={cart.length === 0 && !activeOrder}
                className={`${styles.posFooterBtn} ${styles.payBtn}`}
              >
                <FiCreditCard size={14} /> Complete Payment
              </button>
            )}

            {/* CASHIER: AFTER PAYMENT ACTIONS */}
            {canDoBilling && activeOrder?.status === "COMPLETED" && (
              <>
                <button
                  onClick={() => handlePrintPaidReceipt(activeOrder)}
                  className={styles.posFooterBtn}
                  style={{ backgroundColor: "#16a34a", color: "#fff", borderColor: "#16a34a" }}
                >
                  <FiPrinter size={14} /> Print Receipt
                </button>
                <button
                  onClick={() => handleReprintReceipt(activeOrder)}
                  className={styles.posFooterBtn}
                  style={{ backgroundColor: "#0f172a", color: "#fff", borderColor: "#0f172a" }}
                >
                  <FiRefreshCw size={14} /> Reprint Receipt
                </button>
              </>
            )}
          </div>
        </div>
      </div>


      {/* WAITER HELD ORDERS MODAL */}
      {showHeldModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>⏸ Held Draft Orders</h3>
              <button onClick={() => setShowHeldModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <FiX size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {heldOrders.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "32px" }}>No held draft orders found.</p>
              ) : (
                heldOrders.map((o) => (
                  <div key={o.id} style={{ padding: "14px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>Order #{o.orderNumber} ({o.orderType})</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {o.table ? `Table: ${o.table.tableNumber}` : "Takeaway"} • {o.items?.length || 0} items
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleResumeHeldOrder(o)}
                        style={{ padding: "8px 12px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <FiPlay size={12} /> Resume
                      </button>
                      <button
                        onClick={() => handleCancelHeldOrder(o.id)}
                        style={{ padding: "8px 12px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CASHIER HELD BILLS MODAL */}
      {showHeldBillsModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "600px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>⏸ Held Table Bills (Unpaid)</h3>
              <button onClick={() => setShowHeldBillsModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <FiX size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {heldBills.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "32px" }}>No held table bills found.</p>
              ) : (
                heldBills.map((o) => (
                  <div key={o.id} style={{ padding: "14px", border: "1px solid #fde68a", borderRadius: "8px", backgroundColor: "#fffbeb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>Order #{o.orderNumber} ({o.orderType})</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {o.table ? `Table: ${o.table.tableNumber}` : "Takeaway"} • Status: {o.status} • Billing: ON HOLD
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "#059669", marginTop: "4px" }}>
                        ₹{parseFloat(o.totalAmount).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleResumeHeldOrder(o)}
                        style={{ padding: "8px 12px", backgroundColor: "#d97706", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <FiPlay size={12} /> Resume Bill
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ORDER HISTORY MODAL (CASHIER & ADMIN) */}
      {showHistoryModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "820px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>📜 Restaurant Order History</h3>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <FiX size={20} />
              </button>
            </div>

            {/* Filter controls */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search order #..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }}
              />
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                <option value="ALL">All Statuses</option>
                <option value="HELD">HELD</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PREPARING">PREPARING</option>
                <option value="READY">READY</option>
                <option value="SERVED">SERVED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* Order History Table */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: "10px" }}>Order #</th>
                    <th style={{ padding: "10px" }}>Type / Table</th>
                    <th style={{ padding: "10px" }}>Items</th>
                    <th style={{ padding: "10px" }}>Total</th>
                    <th style={{ padding: "10px" }}>Status</th>
                    <th style={{ padding: "10px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistoryOrders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px", fontWeight: "700" }}>{o.orderNumber}</td>
                      <td style={{ padding: "10px" }}>{o.orderType} {o.table ? `(${o.table.tableNumber})` : ""}</td>
                      <td style={{ padding: "10px" }}>{o.items?.length || 0}</td>
                      <td style={{ padding: "10px", fontWeight: "700", color: "#059669" }}>₹{parseFloat(o.totalAmount).toFixed(2)}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: o.status === "COMPLETED" ? "#d1fae5" : o.status === "SERVED" ? "#dbeafe" : "#fef3c7",
                          color: o.status === "COMPLETED" ? "#065f46" : o.status === "SERVED" ? "#1e40af" : "#92400e",
                        }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handlePrintPaidReceipt(o)}
                            style={{ padding: "4px 8px", backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
                            title="Print / Reprint Bill"
                          >
                            <FiPrinter size={12} />
                          </button>
                          {o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
                            <button
                              onClick={() => {
                                setActiveOrder(o);
                                setShowPayModal(true);
                              }}
                              style={{ padding: "4px 8px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "700" }}
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE DYNAMIC THERMAL BILL / RECEIPT MODAL */}
      {selectedPrintOrder && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "14px", width: "100%", maxWidth: "420px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            {/* Action Bar (Hidden in Print) */}
            <div className={styles.printHide} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                  {selectedPrintOrder.isProvisional ? "Provisional Bill Preview" : "Tax Invoice & Receipt"}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>80mm Thermal & A4 Ready</span>
              </div>
              <button
                onClick={() => setSelectedPrintOrder(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Printable Receipt Paper Container */}
            <div
              id="printableReceipt"
              className={styles.printableReceiptArea}
              style={{
                flex: 1,
                overflowY: "auto",
                backgroundColor: "#fff",
                border: "1px dashed #cbd5e1",
                padding: "16px",
                borderRadius: "8px",
                fontFamily: "'Courier New', Courier, monospace, sans-serif",
                color: "#0f172a",
                fontSize: "12px",
                lineHeight: "1.4",
              }}
            >
              {/* RESTAURANT HEADER */}
              <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                  {selectedPrintOrder.restaurant?.name || restaurants.find((r) => r.id === selectedRestaurantId)?.name || company?.name || "RESTAURANT ERP"}
                </h2>
                <div style={{ fontSize: "11px", color: "#475569" }}>
                  {selectedPrintOrder.restaurant?.address || "Main Dining Hall"}
                </div>
                {selectedPrintOrder.restaurant?.phone && (
                  <div style={{ fontSize: "11px", color: "#475569" }}>
                    Tel: {selectedPrintOrder.restaurant.phone}
                  </div>
                )}
                {(selectedPrintOrder.restaurant?.gstin || company?.gstNumber) && (
                  <div style={{ fontSize: "11px", fontWeight: "700", marginTop: "2px" }}>
                    GSTIN: {selectedPrintOrder.restaurant?.gstin || company?.gstNumber}
                  </div>
                )}
              </div>

              {/* DIVIDER */}
              <div style={{ borderTop: "1px dashed #64748b", margin: "10px 0" }}></div>

              {/* INVOICE / BILL TYPE */}
              <div style={{ textAlign: "center", fontWeight: "800", fontSize: "13px", margin: "4px 0", textTransform: "uppercase" }}>
                {selectedPrintOrder.isProvisional ? "--- PROVISIONAL BILL (ESTIMATE) ---" : "--- TAX INVOICE / RECEIPT ---"}
              </div>

              <div style={{ borderTop: "1px dashed #64748b", margin: "10px 0" }}></div>

              {/* ORDER & BILL META */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "11px", marginBottom: "8px" }}>
                <div><strong>Invoice #:</strong> {selectedPrintOrder.isProvisional ? `EST-${selectedPrintOrder.orderNumber}` : `INV-${selectedPrintOrder.orderNumber}`}</div>
                <div style={{ textAlign: "right" }}><strong>Order #:</strong> {selectedPrintOrder.orderNumber}</div>

                <div><strong>Date:</strong> {new Date(selectedPrintOrder.createdAt || Date.now()).toLocaleDateString("en-IN")}</div>
                <div style={{ textAlign: "right" }}><strong>Time:</strong> {new Date(selectedPrintOrder.createdAt || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>

                <div><strong>Table:</strong> {selectedPrintOrder.table?.tableNumber || (tables.find((t) => t.id === selectedPrintOrder.tableId)?.tableNumber) || "Takeaway"}</div>
                <div style={{ textAlign: "right" }}><strong>Area:</strong> {selectedPrintOrder.table?.area?.name || (tables.find((t) => t.id === selectedPrintOrder.tableId)?.area?.name) || "Dining"}</div>

                <div><strong>Type:</strong> {selectedPrintOrder.orderType?.replace("_", " ") || "DINE IN"}</div>
                <div style={{ textAlign: "right" }}><strong>Cashier:</strong> {user?.name || user?.username || "Cashier"}</div>
              </div>

              <div style={{ borderTop: "1px dashed #64748b", margin: "8px 0" }}></div>

              {/* ITEMS LIST */}
              <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "11px", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", marginBottom: "6px" }}>
                  <span style={{ flex: 2 }}>ITEM</span>
                  <span style={{ width: "35px", textAlign: "center" }}>QTY</span>
                  <span style={{ width: "55px", textAlign: "right" }}>RATE</span>
                  <span style={{ width: "65px", textAlign: "right" }}>AMOUNT</span>
                </div>

                {selectedPrintOrder.items?.map((item, idx) => {
                  const qty = Number(item.quantity || 1);
                  const price = parseFloat(item.unitPrice || item.price || 0);
                  const total = parseFloat(item.total || (qty * price));
                  const name = item.menuItem?.name || item.name || "Item";

                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                      <span style={{ flex: 2, fontWeight: "600" }}>{name}</span>
                      <span style={{ width: "35px", textAlign: "center" }}>{qty}</span>
                      <span style={{ width: "55px", textAlign: "right" }}>₹{price.toFixed(2)}</span>
                      <span style={{ width: "65px", textAlign: "right", fontWeight: "700" }}>₹{total.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: "1px dashed #64748b", margin: "8px 0" }}></div>

              {/* SUMMARY TOTALS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal:</span>
                  <span>₹{parseFloat(selectedPrintOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                {parseFloat(selectedPrintOrder.discountAmount || 0) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                    <span>Discount:</span>
                    <span>-₹{parseFloat(selectedPrintOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tax / GST (5%):</span>
                  <span>₹{parseFloat(selectedPrintOrder.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "800", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", padding: "4px 0", marginTop: "4px" }}>
                  <span>GRAND TOTAL:</span>
                  <span>₹{parseFloat(selectedPrintOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ borderTop: "1px dashed #64748b", margin: "10px 0" }}></div>

              {/* PAYMENT DETAILS */}
              <div style={{ fontSize: "11px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span>Payment Status:</span>
                  <span style={{ fontWeight: "800", color: selectedPrintOrder.isProvisional ? "#ca8a04" : "#16a34a" }}>
                    {selectedPrintOrder.isProvisional ? "UNPAID (PROVISIONAL)" : "PAID"}
                  </span>
                </div>
                {!selectedPrintOrder.isProvisional && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span>Payment Method:</span>
                    <span style={{ fontWeight: "700" }}>{selectedPrintOrder.paymentMethod || "CASH"}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Amount Paid:</span>
                  <span>{selectedPrintOrder.isProvisional ? "₹0.00" : `₹${parseFloat(selectedPrintOrder.totalAmount || 0).toFixed(2)}`}</span>
                </div>
              </div>

              <div style={{ borderTop: "1px dashed #64748b", margin: "10px 0" }}></div>

              {/* FOOTER */}
              <div style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>
                <div style={{ fontWeight: "700", marginBottom: "2px" }}>*** THANK YOU! VISIT AGAIN ***</div>
                <div style={{ fontSize: "10px" }}>Software Powered by Resto ERP</div>
              </div>
            </div>

            {/* Modal Actions (Hidden in Print) */}
            <div className={styles.printHide} style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={() => setSelectedPrintOrder(null)}
                style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", fontWeight: "600", cursor: "pointer" }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{ flex: 2, padding: "11px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <FiPrinter size={16} /> Print Receipt (80mm / A4)
              </button>
            </div>
          </div>
        </div>
      )}


      {/* PAYMENT MODAL */}
      {showPayModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "420px" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "700" }}>Complete Order & Payment</h3>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#059669", marginBottom: "20px" }}>
              Total Payable: ₹{(totalAmount || (activeOrder ? parseFloat(activeOrder.totalAmount) : 0)).toFixed(2)}
            </div>

            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>Select Payment Method</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
              {["CASH", "CARD", "BANK", "WALLET"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: paymentMethod === method ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    backgroundColor: paymentMethod === method ? "#eff6ff" : "#fff",
                    color: paymentMethod === method ? "#1e40af" : "#334155",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {method}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowPayModal(false)} style={{ padding: "10px 18px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}>
                Cancel
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={processingPayment}
                style={{ padding: "10px 20px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: processingPayment ? "not-allowed" : "pointer" }}
              >
                {processingPayment ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* READY TO SERVE MODAL (WAITER ONLY - COMPLETELY HIDDEN FROM CASHIER) */}
      {!isCashier && isWaiter && showReadyModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>

          <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "650px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#065f46", display: "flex", alignItems: "center", gap: "8px" }}>
                🔔 READY TO SERVE ORDERS ({readyOrders.length})
              </h3>
              <button onClick={() => setShowReadyModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <FiX size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {readyOrders.length === 0 ? (
                <p style={{ color: "#64748b", textAlign: "center", padding: "32px" }}>No orders currently ready to serve.</p>
              ) : (
                readyOrders.map((o) => (
                  <div key={o.id} style={{ padding: "14px", border: "1px solid #a7f3d0", borderRadius: "8px", backgroundColor: "#ecfdf5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "15px" }}>Table {o.tableNumber} • Order #{o.orderNumber}</div>
                      <div style={{ fontSize: "13px", color: "#065f46", marginTop: "4px" }}>
                        {o.items?.map((i) => `${i.quantity} × ${i.menuItem?.name || "Item"}`).join(", ")}
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: "700", backgroundColor: "#10b981", color: "#fff", padding: "2px 8px", borderRadius: "10px", marginTop: "6px", display: "inline-block" }}>
                        READY TO SERVE
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        handleMarkServed(o.id);
                        if (readyOrders.length <= 1) setShowReadyModal(false);
                      }}
                      style={{ padding: "9px 14px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <FiCheckCircle size={14} /> Mark as Served
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RestaurantPOSPage() {
  return (
    <Suspense fallback={<div style={{ padding: "32px", textAlign: "center" }}>Loading POS...</div>}>
      <RestaurantPOSContent />
    </Suspense>
  );
}
