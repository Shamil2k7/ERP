const purchaseSchema = {
  Purchase: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
      },
      purchaseNo: {
        type: "string",
        example: "PUR-0001",
      },
      supplierId: {
        type: "string",
        format: "uuid",
        example: "11111111-2222-3333-4444-555555555555",
      },
      warehouseId: {
        type: "string",
        format: "uuid",
        example: "66666666-7777-8888-9999-000000000000",
      },
      purchaseDate: {
        type: "string",
        format: "date-time",
      },
      totalAmount: {
        type: "number",
        example: 25000,
      },
      status: {
        type: "string",
        enum: [
          "PENDING",
          "RECEIVED",
          "PARTIAL",
          "CANCELLED",
        ],
        example: "PENDING",
      },
      notes: {
        type: "string",
        example: "Purchase from ABC Supplier",
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

  PurchaseItem: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
      },
      purchaseId: {
        type: "string",
        format: "uuid",
      },
      productId: {
        type: "string",
        format: "uuid",
      },
      quantity: {
        type: "integer",
        example: 10,
      },
      unitPrice: {
        type: "number",
        example: 2500,
      },
      totalPrice: {
        type: "number",
        example: 25000,
      },
    },
  },

  CreatePurchase: {
    type: "object",
    required: [
      "purchaseNo",
      "supplierId",
      "warehouseId",
      "totalAmount",
      "items",
    ],
    properties: {
      purchaseNo: {
        type: "string",
        example: "PUR-0001",
      },
      supplierId: {
        type: "string",
        format: "uuid",
      },
      warehouseId: {
        type: "string",
        format: "uuid",
      },
      purchaseDate: {
        type: "string",
        format: "date-time",
      },
      totalAmount: {
        type: "number",
        example: 25000,
      },
      status: {
        type: "string",
        enum: [
          "PENDING",
          "RECEIVED",
          "PARTIAL",
          "CANCELLED",
        ],
      },
      notes: {
        type: "string",
        example: "Purchase from supplier",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          required: [
            "productId",
            "quantity",
            "unitPrice",
            "totalPrice",
          ],
          properties: {
            productId: {
              type: "string",
              format: "uuid",
            },
            quantity: {
              type: "integer",
              example: 10,
            },
            unitPrice: {
              type: "number",
              example: 2500,
            },
            totalPrice: {
              type: "number",
              example: 25000,
            },
          },
        },
      },
    },
  },

  UpdatePurchase: {
    type: "object",
    properties: {
      purchaseDate: {
        type: "string",
        format: "date-time",
      },
      totalAmount: {
        type: "number",
        example: 30000,
      },
      status: {
        type: "string",
        enum: [
          "PENDING",
          "RECEIVED",
          "PARTIAL",
          "CANCELLED",
        ],
      },
      notes: {
        type: "string",
        example: "Updated purchase",
      },
    },
  },
};

export default purchaseSchema;