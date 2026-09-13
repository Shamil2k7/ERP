const inventorySchema = {
  Inventory: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "d3c2b1a0-5e8a-4c4b-9d5a-123456789abc",
      },
      productId: {
        type: "string",
        format: "uuid",
        example: "b6b7d8f1-6f21-4c8a-9f11-abcdef123456",
      },
      warehouseId: {
        type: "string",
        format: "uuid",
        example: "c8d9e0f1-1234-4abc-9def-123456789abc",
      },
      quantity: {
        type: "integer",
        example: 100,
      },
      minimumStock: {
        type: "integer",
        example: 10,
      },
      maximumStock: {
        type: "integer",
        example: 1000,
      },
      reorderLevel: {
        type: "integer",
        example: 20,
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
      },
    },
  },

  CreateInventory: {
    type: "object",
    required: [
      "productId",
      "warehouseId",
      "quantity"
    ],
    properties: {
      productId: {
        type: "string",
        format: "uuid",
      },
      warehouseId: {
        type: "string",
        format: "uuid",
      },
      quantity: {
        type: "integer",
        example: 100,
      },
      minimumStock: {
        type: "integer",
        example: 10,
      },
      maximumStock: {
        type: "integer",
        example: 1000,
      },
      reorderLevel: {
        type: "integer",
        example: 20,
      },
    },
  },

  UpdateInventory: {
    type: "object",
    properties: {
      quantity: {
        type: "integer",
        example: 150,
      },
      minimumStock: {
        type: "integer",
        example: 15,
      },
      maximumStock: {
        type: "integer",
        example: 1200,
      },
      reorderLevel: {
        type: "integer",
        example: 25,
      },
    },
  },
};

export default inventorySchema;