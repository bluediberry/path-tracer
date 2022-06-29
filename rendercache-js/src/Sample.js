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

  copy(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

 /* serialize(rayOrigin) {
    var pixel = this.pixel;
	  var hit = this.hit;
	  var normalDir = this.normalDir;
    var rayDir = this.rayDir;

    var request = [];
    request.push([pixel.x, pixel.y]);
    request.push([rayOrigin.x, rayOrigin.y, rayOrigin.z]);
    request.push([rayDir.x, rayDir.y, rayDir.z]);
    request.push([normalDir.x, normalDir.y, normalDir.z]);
    request.push([hit.x, hit.y, hit.z]);

    return request;
}*/

serialize(rayOrigin) {
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
    "rayOrigin": [rayOrigin.x, rayOrigin.y, rayOrigin.z],
  };
}

  doRaytracing(raytracer, rayOrigin, request) {

    console.log("hey");

    var rayDir = request.rayDir;
    var hit = request.hit;
    var normalDir = request.normalDir;
    
    var c = raytracer.trace(rayOrigin, request, rayDir, hit, normalDir);

    // vector to color
    request.color.copy(c.x, c.y, c.z);
    // truncate if beyond 1
    request.color.r = Math.min(1, request.color.r);
    request.color.g = Math.min(1, request.color.g);
    request.color.b = Math.min(1, request.color.b);

    // convert pixel to bytes
    request.color.r = Math.round(request.color.r * 255);
    request.color.g = Math.round(request.color.g * 255);
    request.color.b = Math.round(request.color.b * 255);

    // set pixel color to this sample color 
    request.pixel.color = request.color;
    //console.log(request.color);

    // sample is in use
      this.inUse = true;

    return request;
  }
}
