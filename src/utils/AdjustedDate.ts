export default class AdjustedDate extends Date {
  constructor(value: string | number | Date) {
    super(value);
    this.setTime(this.getTime() + 9 * 60 * 60 * 1000); // add 9 hours
    return this;
  }
}
