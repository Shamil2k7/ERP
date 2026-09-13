const gymSchema = {
  GymMember: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      companyId: { type: "string", format: "uuid" },
      memberId: { type: "string" },
      fullName: { type: "string" },
      email: { type: "string", format: "email" },
      phone: { type: "string" },
      membershipPlanId: { type: "string", format: "uuid" },
      trainerId: { type: "string", format: "uuid", nullable: true },
      joinDate: { type: "string", format: "date" },
      expiryDate: { type: "string", format: "date" },
      status: { type: "string", enum: ["ACTIVE", "INACTIVE", "EXPIRED", "SUSPENDED"] },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateGymMember: {
    type: "object",
    required: ["fullName", "phone", "membershipPlanId", "joinDate", "expiryDate"],
    properties: {
      fullName: { type: "string", example: "John Doe" },
      email: { type: "string", example: "john@example.com" },
      phone: { type: "string", example: "1234567890" },
      membershipPlanId: { type: "string", format: "uuid" },
      trainerId: { type: "string", format: "uuid" },
      joinDate: { type: "string", format: "date" },
      expiryDate: { type: "string", format: "date" },
      status: { type: "string", default: "ACTIVE" },
    },
  },
  UpdateGymMember: {
    type: "object",
    properties: {
      fullName: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      membershipPlanId: { type: "string", format: "uuid" },
      trainerId: { type: "string", format: "uuid" },
      joinDate: { type: "string", format: "date" },
      expiryDate: { type: "string", format: "date" },
      status: { type: "string" },
    },
  },
};

export default gymSchema;
