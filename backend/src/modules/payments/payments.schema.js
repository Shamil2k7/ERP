class PaymentSchema {
  constructor(data) {
    this.branchId = data.branchId;

    this.customerId = data.customerId ?? null;

    this.supplierId = data.supplierId ?? null;

    this.invoiceId = data.invoiceId ?? null;

    this.purchaseOrderId = data.purchaseOrderId ?? null;

    this.paymentNumber = data.paymentNumber;

    this.paymentDate = data.paymentDate
      ? new Date(data.paymentDate)
      : new Date();

    this.amount = Number(data.amount);

    this.method = data.method ?? "CASH";

    this.referenceNumber = data.referenceNumber ?? null;

    this.status = data.status ?? "PENDING";

    this.notes = data.notes ?? null;
  }
}

export default PaymentSchema;