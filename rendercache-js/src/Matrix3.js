/**
 * @class Vector3
 */
 export default class Matrix3 {
  constructor() {
    this.nullify();
  }

  clone() {
    other = new Matrix3();
    other.v = [];
    for (var i = 0; i < 4; i++) {
      other.v[i] = [];
      for (var j = 0; j < 4; j++) {
        other.v[i][j] = this.v[i][j];
      }
    }
    return other;
  }

  nullify() {
    this.v = [];
    for (var i = 0; i < 4; i++) {
      this.v[i] = [];
      for (var j = 0; j < 4; j++) {
        this.v[i][j] = 0.0;
      }
    }
  }

  identity() {
    this.nullify();
    for (var i = 0; i < 4; i++) this.v[i][i] = 1;
  }

  rotateX(angleRadians) {
	this.identity();
    this.v[1][1] =  Math.cos(angleRadians);
    this.v[1][2] = -Math.sin(angleRadians);
    this.v[2][1] =  Math.sin(angleRadians);
    this.v[2][2] =  Math.cos(angleRadians);
    return this;
  }

  translate(translate) {
    this.identity();
    this.v[3][0] = translate.x;
    this.v[3][1] = translate.y;
    this.v[3][2] = translate.z;
  }

  scale(scale) {
    this.identity();
    this.v[0][0] = scale.x;
    this.v[1][1] = scale.y;
    this.v[2][2] = scale.z;
  }

  mult(B) {
    var other = new Matrix3();

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        other.v[i][j] = 0;
        for (var k = 0; k < 4; k++) {
          other.v[i][j] += this.v[i][k] * B.v[k][j];
        }
      }
    }
    return other;
  }
}
