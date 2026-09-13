class TaxSchema {
  constructor(data) {
    this.name = data.name;

    this.rate = Number(data.rate);

    this.type = data.type;

    this.status = data.status ?? "ACTIVE";
  }
}

export default TaxSchema;