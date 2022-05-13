
export default class Color {
  constructor() {
    this.clear();
  }
  clear() {
    this.r = null;
    this.g = null;
    this.b = null;
  }

  copy(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  
  copyTo(destination) {
    destination.r = this.r;
    destination.g = this.g;
    destination.b = this.b;
  }

  addMult(other, factor) {
    this.r += (other.r * factor);
    this.g += (other.g * factor);
    this.b += (other.b * factor);
  }
}
