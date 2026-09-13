const stockTransferSchema = {
  StockTransfer: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "9f4c1a2b-3d4e-5f67-8901-abcdef123456",
      },
      transferNo: {
        type: "string",
        example: "TRF-0001",
      },
      fromWarehouseId: {
        type: "string",
        format: "uuid",
        example: "11111111-2222-3333-4444-555555555555",
      },
      toWarehouseId: {
        type: "string",
        format: "uuid",
        example: "66666666-7777-8888-9999-000000000000",
      },
      transferDate: {
        type: "string",
        format: "date-time",
      },
      status: {
        type: "string",
        enum: [
          "PENDING",
          "APPROVED",
          "COMPLETED",
          "CANCELLED",
        ],
        example: "PENDING",
      },
      reason: {
        type: "string",
        example: "Transfer stock to another warehouse",
      },
      remarks: {
        type: "string",
        example: "Urgent transfer",
      },
      approvedBy: {
        type: "string",
        example: "Admin",
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

  StockTransferItem: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
      },
      stockTransferId: {
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
    },
  },

  CreateStockTransfer: {
    type: "object",
    required: [
      "transferNo",
      "fromWarehouseId",
      "toWarehouseId",
      "items",
    ],
    properties: {
      transferNo: {
        type: "string",
        example: "TRF-0001",
      },
      fromWarehouseId: {
        type: "string",
        format: "uuid",
      },
      toWarehouseId: {
        type: "string",
        format: "uuid",
      },
      transferDate: {
        type: "string",
        format: "date-time",
      },
      status: {
        type: "string",
        enum: [
          "PENDING",
          "APPROVED",
          "COMPLETED",
          "CANCELLED",
        ],
      },
      reason: {
        type: "string",
        example: "Transfer stock",
      },
      remarks: {
        type: "string",
        example: "Transfer requested",
      },
      approvedBy: {
        type: "string",
        example: "Manager",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          required: [
            "productId",
            "quantity",
          ],
          properties: {
            productId: {
              type: "string",
              format: "uuid",
            },
            quantity: {
              type: "integer",
              example: 5,
            },
          },
        },
      },
    },
  },

  UpdateStockTransfer: {
    type: "object",
    properties: {
      transferDate: {
        type: "string",
        format: "date-time",
      },
      status: {
        type: "string",
        enum: [
          "PENDING",
          "APPROVED",
          "COMPLETED",
          "CANCELLED",
        ],
      },
      reason: {
        type: "string",
        example: "Updated reason",
      },
      remarks: {
        type: "string",
        example: "Updated remarks",
      },
      approvedBy: {
        type: "string",
        example: "Admin",
      },
    },
  },
};

export default stockTransferSchema;