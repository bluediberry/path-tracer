import Color from "./Color.js";
import Pixel from "./Pixel.js";
import Vector3 from "./Vector3.js";

export default class Sample {
  constructor() {
    this.pixel = new Pixel();
    this.color = new Color();
	  this.hit = new Vector3();
	  this.normalDir = new Vector3();
    this.rayDir = new Vector3();
	  this.age = 0;
    this.resample = false;
  	this.inUse = false;  
    
  }

  clear() {
    this.pixel = new Pixel();
    this.color = new Color();
	  this.hit = new Vector3();
	  this.normalDir = new Vector3();
    this.rayDir = new Vector3();
	  this.age = -1;
    this.resample = false;
	  this.inUse = false;

    if (this.pixel !== null) {
		this.pixel.element = null;
	  }
  }

  attach(pixel) {
   	this.pixel = pixel;
    pixel.element = this;
  }

  serialize(fromRequests) {
    var pixel = this.pixel;
    var color = this.color;
    var hit = this.hit;
    var normalDir = this.normalDir;
    var rayDir = this.rayDir;
    var age = this.age;
    var resample = this.resample;
    var inUse = this.inUse;  
  
    return {
      "pixel": [pixel.x, pixel.y, pixel.color],
      "color": [color.r, color.g, color.b],
      "hit": [hit.x, hit.y, hit.z],
      "normalDir": [normalDir.x, normalDir.y, normalDir.z],
      "rayDir": [rayDir.x, rayDir.y, rayDir.z],
      "rayOrigin": [fromRequests.x, fromRequests.y, fromRequests.z],
      "age": age,
      "resample": resample,
      "inUse": inUse,
    };
  }

static deserialize(data) {
    var request = data.request;

    return request;
}

  doRaytracing(raytracer, from, request) {
    
    const c = raytracer.trace(from, request);

    return c;
  }

}
