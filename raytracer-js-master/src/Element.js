import Vector3 from './Vector3.js'
import Color from './Color.js'

export default class Element {
	constructor() { 
        this.index = undefined;
        this.color = new Color();
        this.hit = new Vector3();
        this.normal = new Vector3();
        this.age = undefined;
        this.pixel = undefined;
        this.locked = undefined;
    }
}