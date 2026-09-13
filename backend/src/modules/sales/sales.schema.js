class SalesSchema {
  constructor(data) {
    this.branchId = data.branchId;

    this.customerId = data.customerId ?? null;

    this.orderNumber = data.orderNumber;

    this.status = data.status ?? "DRAFT";

    this.orderDate = data.orderDate
      ? new Date(data.orderDate)
      : new Date();

    this.totalAmount = Number(data.totalAmount);

    this.taxAmount = Number(data.taxAmount ?? 0);

    this.discountAmount = Number(data.discountAmount ?? 0);

    this.netAmount = Number(data.netAmount);
  }
}

export default SalesSchema;