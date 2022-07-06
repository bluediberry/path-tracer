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

  serialize() {
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

  //  Promise.all([c]).then((values) => {    // vector to color
    this.color = new Color();
    this.color.copy(c.x, c.y, c.z);

	// truncate if beyond 1
    this.color.r = Math.min(1, this.color.r);
    this.color.g = Math.min(1, this.color.g);
    this.color.b = Math.min(1, this.color.b);

    // convert pixel to bytes
    this.color.r = Math.round(this.color.r * 255);
    this.color.g = Math.round(this.color.g * 255);
    this.color.b = Math.round(this.color.b * 255);

	// set pixel color to this sample color 
    this.pixel.color = this.color;

	// sample is in use
    this.inUse = true;

    return request;
 // });
  }

}
