/**
 * @class TPixel
 */

import Element from './Element.js'

export default class TPixel{
	constructor() { 
        //this.coords = [].push({x: undefined, y: undefined});
        this.weight = undefined;
        this.sampled = undefined;
        this.depth = undefined;
        this.color = [].push({r: undefined, g: undefined, b: undefined});
        this.priority = undefined;
        
        //element?
        this.element = new Element();

    }
}