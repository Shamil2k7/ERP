import apiClient from "./apiClient";

export const restaurantService = {
  // Restaurants
  getRestaurants: async (branchId) => {
    const res = await apiClient.get("/restaurants", { params: { branchId } });
    return res.data;
  },
  getRestaurantById: async (id) => {
    const res = await apiClient.get(`/restaurants/${id}`);
    return res.data;
  },
  createRestaurant: async (data) => {
    const res = await apiClient.post("/restaurants", data);
    return res.data;
  },
  updateRestaurant: async (id, data) => {
    const res = await apiClient.put(`/restaurants/${id}`, data);
    return res.data;
  },

  // Areas & Floor Plan
  getAreas: async (restaurantId) => {
    const res = await apiClient.get("/restaurant-areas", { params: { restaurantId } });
    return res.data;
  },
  getFloorPlan: async (restaurantId) => {
    const res = await apiClient.get("/restaurant-areas", { params: { restaurantId } });
    return res.data;
  },
  createArea: async (data) => {
    const res = await apiClient.post("/restaurant-areas", data);
    return res.data;
  },
  updateArea: async (id, data) => {
    const res = await apiClient.put(`/restaurant-areas/${id}`, data);
    return res.data;
  },
  deleteArea: async (id) => {
    const res = await apiClient.delete(`/restaurant-areas/${id}`);
    return res.data;
  },

  // Tables
  getTables: async (restaurantId, areaId) => {
    const res = await apiClient.get("/restaurant-tables", { params: { restaurantId, areaId } });
    return res.data;
  },
  createTable: async (data) => {
    const res = await apiClient.post("/restaurant-tables", data);
    return res.data;
  },
  updateTable: async (id, data) => {
    const res = await apiClient.put(`/restaurant-tables/${id}`, data);
    return res.data;
  },
  updateTableStatus: async (id, status) => {
    const res = await apiClient.patch(`/restaurant-tables/${id}/status`, { status });
    return res.data;
  },
  deleteTable: async (id) => {
    const res = await apiClient.delete(`/restaurant-tables/${id}`);
    return res.data;
  },

  // Menu Categories
  getMenuCategories: async (restaurantId) => {
    const res = await apiClient.get("/menu-categories", { params: { restaurantId } });
    return res.data;
  },
  createMenuCategory: async (data) => {
    const res = await apiClient.post("/menu-categories", data);
    return res.data;
  },
  updateMenuCategory: async (id, data) => {
    const res = await apiClient.put(`/menu-categories/${id}`, data);
    return res.data;
  },
  deleteMenuCategory: async (id) => {
    const res = await apiClient.delete(`/menu-categories/${id}`);
    return res.data;
  },

  // Menu Items
  getMenuItems: async (restaurantId, categoryId) => {
    const res = await apiClient.get("/menu-items", { params: { restaurantId, categoryId } });
    return res.data;
  },
  createMenuItem: async (formData) => {
    const res = await apiClient.post("/menu-items", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  updateMenuItem: async (id, formData) => {
    const res = await apiClient.put(`/menu-items/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
  deleteMenuItem: async (id) => {
    const res = await apiClient.delete(`/menu-items/${id}`);
    return res.data;
  },

  deleteRestaurant: async (id) => {
    const res = await apiClient.delete(`/restaurants/${id}`);
    return res.data;
  },

  // Recipes
  getRecipes: async (restaurantId) => {
    const res = await apiClient.get("/recipes", { params: { restaurantId } });
    return res.data;
  },
  getRecipeByMenuItem: async (menuItemId) => {
    const res = await apiClient.get(`/recipes/item/${menuItemId}`);
    return res.data;
  },
  saveRecipe: async (menuItemId, data) => {
    const res = await apiClient.post(`/recipes/item/${menuItemId}`, data);
    return res.data;
  },
  deleteRecipe: async (id) => {
    const res = await apiClient.delete(`/recipes/${id}`);
    return res.data;
  },

  // Modifiers
  getModifierGroups: async (restaurantId) => {
    const res = await apiClient.get("/modifiers", { params: { restaurantId } });
    return res.data;
  },
  createModifierGroup: async (data) => {
    const res = await apiClient.post("/modifiers", data);
    return res.data;
  },
  updateModifierGroup: async (id, data) => {
    const res = await apiClient.put(`/modifiers/${id}`, data);
    return res.data;
  },
  deleteModifierGroup: async (id) => {
    const res = await apiClient.delete(`/modifiers/${id}`);
    return res.data;
  },

  // Restaurant Orders & POS
  getOrders: async (params) => {
    const res = await apiClient.get("/restaurant-orders", { params });
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await apiClient.get(`/restaurant-orders/${id}`);
    return res.data;
  },
  createOrder: async (data) => {
    const res = await apiClient.post("/restaurant-orders", data);
    return res.data;
  },
  updateOrder: async (id, data) => {
    const res = await apiClient.put(`/restaurant-orders/${id}`, data);
    return res.data;
  },
  checkStock: async (id, warehouseId) => {
    const res = await apiClient.get(`/restaurant-orders/${id}/check-stock`, { params: { warehouseId } });
    return res.data;
  },
  confirmOrderAndSendKOT: async (id, warehouseId, allowStockOverride) => {
    const res = await apiClient.post(`/restaurant-orders/${id}/confirm`, { warehouseId, allowStockOverride });
    return res.data;
  },
  completeOrder: async (id, paymentData) => {
    const res = await apiClient.post(`/restaurant-orders/${id}/complete`, paymentData);
    return res.data;
  },
  cancelOrder: async (id, reason) => {
    const res = await apiClient.post(`/restaurant-orders/${id}/cancel`, { reason });
    return res.data;
  },

  // Kitchen / KDS
  getKitchenOrders: async (restaurantId, status) => {
    const res = await apiClient.get("/kitchen/orders", { params: { restaurantId, status } });
    return res.data;
  },
  startPreparation: async (id) => {
    const res = await apiClient.post(`/kitchen/orders/${id}/start`);
    return res.data;
  },
  markReady: async (id) => {
    const res = await apiClient.post(`/kitchen/orders/${id}/ready`);
    return res.data;
  },
  markServed: async (id) => {
    const res = await apiClient.post(`/kitchen/orders/${id}/served`);
    return res.data;
  },

  // Reservations
  getReservations: async (restaurantId, status, date) => {
    const res = await apiClient.get("/reservations", { params: { restaurantId, status, date } });
    return res.data;
  },
  createReservation: async (data) => {
    const res = await apiClient.post("/reservations", data);
    return res.data;
  },
  updateReservationStatus: async (id, status) => {
    const res = await apiClient.patch(`/reservations/${id}/status`, { status });
    return res.data;
  },
  deleteReservation: async (id) => {
    const res = await apiClient.delete(`/reservations/${id}`);
    return res.data;
  },

  // Wastage
  getWastages: async (restaurantId, warehouseId) => {
    const res = await apiClient.get("/wastage", { params: { restaurantId, warehouseId } });
    return res.data;
  },
  createWastage: async (data) => {
    const res = await apiClient.post("/wastage", data);
    return res.data;
  },
  deleteWastage: async (id) => {
    const res = await apiClient.delete(`/wastage/${id}`);
    return res.data;
  },

  // Food Costing
  getFoodCostReport: async (restaurantId) => {
    const res = await apiClient.get("/food-cost", { params: { restaurantId } });
    return res.data;
  },

  // Restaurant Reports & Analytics
  getRestaurantAnalytics: async (params) => {
    const res = await apiClient.get("/restaurant-reports/analytics", { params });
    return res.data;
  },

  // Restaurant Raw Materials & Ingredients
  createIngredient: async (data) => {
    const isFormData = data instanceof FormData;
    const res = await apiClient.post("/restaurant/ingredients", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return res.data;
  },
  getIngredients: async (params) => {
    const res = await apiClient.get("/restaurant/ingredients", { params });
    return res.data;
  },
  getIngredientById: async (id) => {
    const res = await apiClient.get(`/restaurant/ingredients/${id}`);
    return res.data;
  },
  updateIngredient: async (id, data) => {
    const isFormData = data instanceof FormData;
    const res = await apiClient.put(`/restaurant/ingredients/${id}`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return res.data;
  },
  addIngredientStock: async (id, data) => {
    const res = await apiClient.post(`/restaurant/ingredients/${id}/add-stock`, data);
    return res.data;
  },
  deleteIngredient: async (id) => {
    const res = await apiClient.delete(`/restaurant/ingredients/${id}`);
    return res.data;
  },
};

