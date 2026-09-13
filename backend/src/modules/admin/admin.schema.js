const adminSchema = {
  Admin: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      companyName: { type: "string", nullable: true },
      type: { type: "string" },
      enabledModules: { type: "array", items: { type: "string" } },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateAdmin: {
    type: "object",
    required: ["name", "email", "phone", "password", "type"],
    properties: {
      name: { type: "string" },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      password: { type: "string" },
      companyName: { type: "string" },
      type: { type: "string" },
      enabledModules: { type: "array", items: { type: "string" } },
    },
  },
  UpdateAdmin: {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      companyName: { type: "string" },
      type: { type: "string" },
      enabledModules: { type: "array", items: { type: "string" } },
    },
  },
};

export default adminSchema;
