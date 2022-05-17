
import Vector3 from "./Vector3.js";

export default class Scene {
  constructor() {
    this.elements = [];
	  this.backgroundColor = new Vector3(1.0, 0.0, 0.0);
  }

  add(element) {
    this.elements.push(element);
  }

  getElements() {
    return this.elements;
  }

  clear() {
    this.elements = [];
  }
}
