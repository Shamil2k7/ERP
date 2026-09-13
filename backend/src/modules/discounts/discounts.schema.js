class DiscountSchema {
  constructor(data) {
    this.branchId = data.branchId;

    this.name = data.name;

    this.code = data.code;

    this.type = data.type;

    this.value = Number(data.value);

    this.minimumOrderAmount = Number(
      data.minimumOrderAmount ?? 0
    );

    this.maximumDiscount =
      data.maximumDiscount != null
        ? Number(data.maximumDiscount)
        : null;

    this.startDate = data.startDate
      ? new Date(data.startDate)
      : new Date();

    this.endDate = data.endDate
      ? new Date(data.endDate)
      : null;

    this.status = data.status ?? "ACTIVE";

    this.description = data.description ?? null;
  }
}

export default DiscountSchema;