/**
 * @class Vector3
 */
export default class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  length2() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length() {
    return Math.sqrt(this.length2());
  }

  normalize() {
    var other = this.clone();
    var len2 = this.length2();
    if (len2 > 0) {
      var invLen = 1 / Math.sqrt(len2);
      other.x = this.x * invLen;
      other.y = this.y * invLen;
      other.z = this.z * invLen;
    }
    return other;
  }

  dot(otherVector) {
    return (
      this.x * otherVector.x + this.y * otherVector.y + this.z * otherVector.z
    );
  }

  modulus() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  cosAngle(other) {
    return this.dot(other) / (this.modulus() * other.modulus()); // in radians
  }

  crossProduct(otherVector) {
    var other = new Vector3();
    other.x = this.y * otherVector.z - this.z * otherVector.y;
    other.y = this.z * otherVector.x - this.x * otherVector.z;
    other.z = this.x * otherVector.y - this.y * otherVector.x;
    return other;
  }

  multiply(scalarValue) {
    var other = new Vector3();
    other.x = this.x * scalarValue;
    other.y = this.y * scalarValue;
    other.z = this.z * scalarValue;
    return other;
  }

  product(otherVector) {
    var other = new Vector3()
    other.x = this.x * otherVector.x;
    other.y = this.y * otherVector.y;
    other.z = this.z * otherVector.z;
    return other;
  }

  add(otherVector) {
    var other = new Vector3();
    other.x = this.x + otherVector.x;
    other.y = this.y + otherVector.y;
    other.z = this.z + otherVector.z;
    return other;
  }

  subtract(otherVector) {
    var other = new Vector3();
    other.x = this.x - otherVector.x;
    other.y = this.y - otherVector.y;
    other.z = this.z - otherVector.z;
    return other;
  }

  invert() {
    var other = new Vector3();
    other.x = -this.x;
    other.y = -this.y;
    other.z = -this.z;
    return other;
  }

  scalMult(a) {
    var other = new Vector3();
    other.x = a * this.x;
    other.y = a * this.y;
    other.z = a * this.z;
    return other;
  }

  addScalMult(a, B) {
    var other = new Vector3();
    other.x = a * this.x + B.x;
    other.y = a * this.y + B.y;
    other.z = a * this.z + B.z;
    return other;
  }

  toString() {
    return "{x: " + this.x + ", y: " + this.y + ", z: " + this.z + "}";
  }
}
