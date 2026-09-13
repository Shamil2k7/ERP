const businessTypeSchema = {
  BusinessType: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string", example: "Retail & Supermarket" },
      code: { type: "string", example: "RETAIL" },
      description: { type: "string", nullable: true },
      enabledModules: { type: "array", items: { type: "string" } },
      status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateBusinessType: {
    type: "object",
    required: ["name", "code"],
    properties: {
      name: { type: "string", example: "Gym & Fitness" },
      code: { type: "string", example: "GYM" },
      description: { type: "string" },
      enabledModules: { type: "array", items: { type: "string" } },
      status: { type: "string", default: "ACTIVE" },
    },
  },
  UpdateBusinessType: {
    type: "object",
    properties: {
      name: { type: "string" },
      code: { type: "string" },
      description: { type: "string" },
      enabledModules: { type: "array", items: { type: "string" } },
      status: { type: "string" },
    },
  },
};

export default businessTypeSchema;
