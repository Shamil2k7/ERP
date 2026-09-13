const salonSchema = {
  SalonService: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      companyId: { type: "string", format: "uuid" },
      name: { type: "string", example: "Haircut & Styling" },
      price: { type: "number", example: 499 },
      durationMinutes: { type: "integer", example: 45 },
      description: { type: "string", nullable: true },
      status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateSalonService: {
    type: "object",
    required: ["name", "price"],
    properties: {
      name: { type: "string", example: "Facial Care" },
      price: { type: "number", example: 799 },
      durationMinutes: { type: "integer", example: 60 },
      description: { type: "string" },
      status: { type: "string", default: "ACTIVE" },
    },
  },
  UpdateSalonService: {
    type: "object",
    properties: {
      name: { type: "string" },
      price: { type: "number" },
      durationMinutes: { type: "integer" },
      description: { type: "string" },
      status: { type: "string" },
    },
  },
};

export default salonSchema;
