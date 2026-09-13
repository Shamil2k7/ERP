class InvoiceSchema {
  constructor(data) {
    this.branchId = data.branchId;

    this.salesOrderId = data.salesOrderId ?? null;

    this.customerId = data.customerId;

    this.invoiceNumber = data.invoiceNumber;

    this.invoiceDate = data.invoiceDate
      ? new Date(data.invoiceDate)
      : new Date();

    this.dueDate = data.dueDate
      ? new Date(data.dueDate)
      : null;

    this.subtotal = Number(data.subtotal);

    this.taxAmount = Number(data.taxAmount ?? 0);

    this.discountAmount = Number(data.discountAmount ?? 0);

    this.totalAmount = Number(data.totalAmount);

    this.paidAmount = Number(data.paidAmount ?? 0);

    this.balanceAmount =
      data.balanceAmount !== undefined
        ? Number(data.balanceAmount)
        : Number(data.totalAmount) - Number(data.paidAmount ?? 0);

    this.paymentStatus = data.paymentStatus ?? "PENDING";

    this.status = data.status ?? "DRAFT";

    this.notes = data.notes ?? null;
  }
}

export default InvoiceSchema;