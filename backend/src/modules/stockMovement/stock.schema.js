const stockSchema = {
  StockMovement: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "d5f7a9b8-1234-5678-90ab-cdef12345678",
      },
      productId: {
        type: "string",
        format: "uuid",
        example: "11111111-2222-3333-4444-555555555555",
      },
      warehouseId: {
        type: "string",
        format: "uuid",
        example: "66666666-7777-8888-9999-000000000000",
      },
      type: {
        type: "string",
        enum: [
          "PURCHASE",
          "SALE",
          "TRANSFER_IN",
          "TRANSFER_OUT",
          "ADJUSTMENT",
        ],
        example: "PURCHASE",
      },
      quantity: {
        type: "integer",
        example: 25,
      },
      referenceNo: {
        type: "string",
        example: "PUR-0001",
      },
      remarks: {
        type: "string",
        example: "Stock received from supplier",
      },
      performedBy: {
        type: "string",
        example: "Admin",
      },
      createdAt: {
        type: "string",
        format: "date-time",
      },
    },
  },

  CreateStockMovement: {
    type: "object",
    required: [
      "productId",
      "warehouseId",
      "type",
      "quantity",
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
      type: {
        type: "string",
        enum: [
          "PURCHASE",
          "SALE",
          "TRANSFER_IN",
          "TRANSFER_OUT",
          "ADJUSTMENT",
        ],
      },
      quantity: {
        type: "integer",
        example: 20,
      },
      referenceNo: {
        type: "string",
        example: "PUR-0001",
      },
      remarks: {
        type: "string",
        example: "Stock received",
      },
      performedBy: {
        type: "string",
        example: "Admin",
      },
    },
  },

  UpdateStockMovement: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: [
          "PURCHASE",
          "SALE",
          "TRANSFER_IN",
          "TRANSFER_OUT",
          "ADJUSTMENT",
        ],
      },
      quantity: {
        type: "integer",
        example: 30,
      },
      referenceNo: {
        type: "string",
        example: "PUR-0002",
      },
      remarks: {
        type: "string",
        example: "Updated stock movement",
      },
      performedBy: {
        type: "string",
        example: "Manager",
      },
    },
  },
};

export default stockSchema;