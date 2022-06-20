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

  serialize(rayOrigin) {
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
}

 deserialize(newRequests) 
{
    this.hit = new Vector3(
      newRequests.hit[0], 
      newRequests.hit[1],
      newRequests.hit[2]
      );


    this.normalDir = new Vector3(
      newRequests.normalDir[0], 
      newRequests.normalDir[1],
      newRequests.normalDir[2]
      );

    this.rayDir = new Vector3(
      newRequests.rayDir[0], 
      newRequests.rayDir[1],
      newRequests.rayDir[2]
      );

    this.color = new Color();
    this.color.copy(newRequests.color);

    this.age = newRequests.age;
    this.resample = newRequests.resample;
    this.inUse = newRequests.inUse;

    this.pixel = new Vector3(
      newRequests.pixel[0], 
      newRequests.pixel[1],
      newRequests.pixel[2]
      );

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
