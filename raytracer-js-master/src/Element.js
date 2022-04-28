import Vector3 from './Vector3.js'

export default class Element {
	constructor() { 
        this.index = undefined;
        this.color = [].push({r: undefined, g: undefined, b: undefined});
        this.hit = new Vector3();
        this.normal = new Vector3();
        this.age = undefined;
        this.pixel = undefined;
        this.locked = undefined;
    }
}