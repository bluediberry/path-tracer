/**
 * @class TPixel
 */

import Element from './Element.js'
import Color from './Color.js'


export default class TPixel{
	constructor() { 
        //this.coords = [].push({x: undefined, y: undefined});
        this.weight = undefined;
        this.sampled = undefined;
        this.depth = undefined;
        this.color = new Color();
        this.priority = undefined;
        
        //element?
        this.element = new Element();

    }
}