class CustomerSchema {
  constructor(data) {
    this.branchId = data.branchId ?? null;

    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email ?? null;
    this.address = data.address ?? null;

    this.loyaltyId = data.loyaltyId ?? null;

    this.creditLimit = data.creditLimit ?? 0;
    this.currentBalance = data.currentBalance ?? 0;
  }
}

export default CustomerSchema;