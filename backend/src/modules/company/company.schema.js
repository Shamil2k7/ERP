const companySchema = {
  Company: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      address: { type: "string", nullable: true },
      currency: { type: "string" },
      status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateCompany: {
    type: "object",
    required: ["name", "email", "phone"],
    properties: {
      name: { type: "string", example: "Acme Corp" },
      email: { type: "string", format: "email", example: "admin@acme.com" },
      phone: { type: "string", example: "9876543210" },
      address: { type: "string" },
      currency: { type: "string", default: "INR" },
    },
  },
  UpdateCompany: {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      address: { type: "string" },
      currency: { type: "string" },
      status: { type: "string" },
    },
  },
};

export default companySchema;
