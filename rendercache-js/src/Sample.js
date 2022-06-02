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

  serialize(rayOrigin) {
	  var hit = this.hit;
	  var normalDir = this.normalDir;
    var rayDir = this.rayDir;
    var color = this.color;
	  var age = this.age;
    var resample = this.resample;
  	var inUse = this.inUse;  

    return {
      "hit": [this.hit.x, this.hit.y, this.hit.z],
      "normalDir": [normalDir.x, normalDir.y, normalDir.z],
      "rayDir": [rayDir.x, rayDir.y, rayDir.z],
      "rayOrigin": [rayOrigin.x, rayOrigin.y, rayOrigin.z],
      "color": [color.r, color.g, color.b],
      "age": age,
      "resample": resample,
      "inUse": inUse,
    };
}

 deserialize(newRequests) 
{
    this.hit = new Vector3();
    this.hit.x = newRequests.hit[0];
    this.hit.y = newRequests.hit[1];
    this.hit.z = newRequests.hit[2];

    this.normalDir = new Vector3();
    this.normalDir.x = newRequests.normalDir[0];
    this.normalDir.y = newRequests.normalDir[1];
    this.normalDir.z = newRequests.normalDir[2];

    this.rayDir = new Vector3();
    this.rayDir.x = newRequests.rayDir[0];
    this.rayDir.y = newRequests.rayDir[1];
    this.rayDir.z = newRequests.rayDir[2];

    var fromRequest = new Vector3();
    fromRequest.x = newRequests.rayOrigin[0];
    fromRequest.y = newRequests.rayOrigin[1];
    fromRequest.z = newRequests.rayOrigin[2];

    this.color = new Color();
    this.color.r = newRequests.color[0];
    this.color.g = newRequests.color[1];
    this.color.b = newRequests.color[2];

    this.age = newRequests.age;
    this.resample = newRequests.resample;
    this.inUse = newRequests.inUse;

    this.pixel = new Pixel();

  return this;
}

  doRaytracing(raytracer, rayOrigin, sample) {

    var rayDir = sample.rayDir;
    var hit = sample.hit;
    var normalDir = sample.normalDir;
    
    var c = raytracer.trace(rayOrigin, sample, rayDir, hit, normalDir);

    // vector to color
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

    return sample;
  }
}
