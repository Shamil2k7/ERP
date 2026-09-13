const branchSchema = {
  Branch: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      companyId: { type: "string", format: "uuid" },
      name: { type: "string" },
      code: { type: "string" },
      address: { type: "string", nullable: true },
      phone: { type: "string", nullable: true },
      email: { type: "string", format: "email", nullable: true },
      status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateBranch: {
    type: "object",
    required: ["name", "code"],
    properties: {
      name: { type: "string", example: "Main Branch" },
      code: { type: "string", example: "BR001" },
      address: { type: "string" },
      phone: { type: "string" },
      email: { type: "string", format: "email" },
      status: { type: "string", default: "ACTIVE" },
    },
  },
  UpdateBranch: {
    type: "object",
    properties: {
      name: { type: "string" },
      code: { type: "string" },
      address: { type: "string" },
      phone: { type: "string" },
      email: { type: "string", format: "email" },
      status: { type: "string" },
    },
  },
};

export default branchSchema;
