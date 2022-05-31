import Color  from "./Color.js" 

export default class Pixel {
  constructor() {
    this.x = -1;
    this.y = -1;
    this.element = null; // the cache Item associated
	this.depth = 10000000000000.0;
	this.color = new Color();
	this.priority = 0;
	this.sample = false;
	this.resample = false;
	this.weight = 0.0;
  }
  clear() {
    this.x = -1;
    this.y = -1;
    this.element = null;
	this.depth = 10000000000000.0;
	this.color.clear();
	this.priority = 0;
	this.sample = false;
	this.resample = false;
	this.weight = 0.0;
  }
  toString() {
	  return this.x + " " + this.y + " " + this.color + " " + (this.element != null) + " " + this.depth + (this.element != null? this.element.hit : "");
  }
}
