const unitSchema = {
  Unit: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "9d4c0a95-9d84-4d1d-8f39-5ef8a6d7b123",
      },

      name: {
        type: "string",
        example: "Piece",
      },

      code: {
        type: "string",
        example: "PCS",
      },

      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
        example: "ACTIVE",
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

  CreateUnit: {
    type: "object",
    required: ["name", "code"],
    properties: {
      name: {
        type: "string",
        example: "Piece",
      },

      code: {
        type: "string",
        example: "PCS",
      },

      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
        example: "ACTIVE",
      },
    },
  },

  UpdateUnit: {
    type: "object",
    properties: {
      name: {
        type: "string",
        example: "Kilogram",
      },

      code: {
        type: "string",
        example: "KG",
      },

      status: {
        type: "string",
        enum: ["ACTIVE", "INACTIVE"],
        example: "ACTIVE",
      },
    },
  },
};

export default unitSchema;