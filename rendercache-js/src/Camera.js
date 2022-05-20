import Vector3 from "./Vector3.js";
import Pixel from "./Pixel.js";

const ALMOST_ZERO = 0.000000001;
const MAX_REAL = +3.402823466e38;
const MIN_REAL = -3.402823466e38;
const PiOver180 = 1.74532925199433e-2;

export default class Camera {
  constructor(from, to, fov, width, height) {
    this.scope = { x: width, y: height };
    this.from = from;
    this.to = to;
    this.fov = fov;
    this.halfScope = { x: 0.5 * width, y: 0.5 * height };
    // @ts-ignore
	  this.raycaster = new THREE.Raycaster();
    // @ts-ignore
  	this.pixel = new THREE.Vector2();
    // @ts-ignore
    this.cam = new THREE.PerspectiveCamera(fov, width / height, 0.1, 10000);
    //this.cam.position.set(from.x, from.y, from.z);
  	this.updatePosition(from, to);
  }

  updatePosition(from, to) {
	this.from = from.clone()
	this.to = to.clone()
	this.cam.position.set(this.from.x, this.from.y, this.from.z);
	this.cam.lookAt(this.to.x, this.to.y, this.to.z);
	this.cam.up.set(0, 1, 0);
	this.cam.updateProjectionMatrix();
  }

  serialize() {
    var scope = this.scope;
    var from = this.from;
    var to = this.to;
    var fov = this.fov;

    return {
        "from": from,
        "to": to,
        "fov": fov,
        "widht": scope.x,
        "height": scope.y,
    };
}

static deserialize(data) {
    var from = data.from;
    var to = data.to;
    var fov = data.fov;
    var width = data.width;
    var height = data.height;

    var camera = new Camera(from, to, fov, width, height);

    return camera;
}

  computeDirToPixel(sample) {
    sample.rayDir = this.computeDirToXY(sample.pixel.x, sample.pixel.y);
  }

  computeDirToHit(sample) {
    sample.rayDir = sample.hit.subtract(this.from).normalize();
  }

  computeDirToXY(x, y) {
    // calculate pixel coords in normalized device coordinates
    // (-1 to +1) for both components
    this.pixel.x = (x / this.scope.x) * 2 - 1;
    this.pixel.y = (y / this.scope.y) * 2 - 1;
    this.raycaster.setFromCamera(this.pixel, this.cam);
    return new Vector3(
      this.raycaster.ray.direction.x,
      this.raycaster.ray.direction.y,
      this.raycaster.ray.direction.z
    ).normalize();
  }

  reprojectPixel(sample, result) {
    var depth = sample.hit.subtract(this.from).length();
// @ts-ignore
    var vector = new THREE.Vector3(sample.hit.x, sample.hit.y, sample.hit.z);
    vector.project(this.cam);
    vector.x = vector.x * this.halfScope.x + this.halfScope.x;
    vector.y = vector.y * this.halfScope.y + this.halfScope.y;
    // vector.z represents the depth of the point from the screen
    // or position on the screen, the depth doesn't matter as it
    // doesn't affect the x or y position on the screen.
    // So that component of the vector is not part of the solution,
    // and thus ignored.

    result.x = Math.round(vector.x);
    result.y = Math.round(vector.y);
    result.depth = depth;

    if(result.depth === 0){
      return false;
    }

    return true;
  }
}
