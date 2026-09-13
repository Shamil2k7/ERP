class ReturnSchema {
  constructor(data) {
    this.branchId = data.branchId;

    this.type = data.type;

    this.referenceSalesOrderId =
      data.referenceSalesOrderId ?? null;

    this.referencePurchaseOrderId =
      data.referencePurchaseOrderId ?? null;

    this.returnNumber = data.returnNumber;

    this.returnDate = data.returnDate
      ? new Date(data.returnDate)
      : new Date();

    this.totalAmount = Number(data.totalAmount);

    this.taxAmount = Number(data.taxAmount ?? 0);

    this.netAmount = Number(data.netAmount);
  }
}

export default ReturnSchema;