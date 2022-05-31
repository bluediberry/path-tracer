import Color from "./Color.js";

export default class Sample {
  constructor() {
    this.pixel = null;
    this.color = null;
	  this.hit = null;
	  this.normalDir = null;
    this.rayDir = null;
	  this.age = 0;
    this.resample = false;
  	this.inUse = false;  
  }

  clear() {
    this.pixel = null;
    this.color = null;
	  this.hit = null;
	  this.normalDir = null;
    this.rayDir = null;
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

  serialize(request) {
    var request = request;

    return {
        "request": request,
    };
}

static deserialize(data) {
    var request = data.request;

    return request;
}

  doRaytracing(raytracer, from, request) {
    
    const c = raytracer.trace(from, request, 0);

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
