import Sample from "./Sample.js";
import Pixel from "./Pixel.js";
import Color from "./Color.js";
import Vector3 from "./Vector3.js";

const INTERPOLATED = 0;
const URGENT = 1;
const SAMPLED = 2;

export default class Driver {
  constructor(engine, camera) {
    this.test = false;
    this.camera = camera;
    this.engine = engine;

    this.cache = null;
    this.buffer = null;
    this.addressY = null;

    this.cacheSize = 0;
    this.cachePointer = 0;
    this.numberOfSamples = 0;

	this.initialFill = 0.2;
    this.maximumSamplesPerFrameRatio = 1/32;
    this.maximumSamplesPerFrame = Math.round(
      this.camera.scope.x *
        this.camera.scope.y *
        this.maximumSamplesPerFrameRatio
    );
    this.interpolationRandom = 5;
    this.interpolationZero = 20;

    this.colorComponents = 3;
    this.cacheFactor = 1.5;
    this.depthThreshold = 1e6;
    this.ageFactor = 1;

    this.priorities = [];
    this.priorities[INTERPOLATED] = [];
    this.priorities[URGENT] = [];
    this.priorities[SAMPLED] = [];
    this.priorityLevels = 400;
    this.totalPriority = 0;
    this.priorityMax = 255;

    this.black = new Vector3();
    this.alphaChannel = 255 << 24;
    this.blackColorInt =
      this.alphaChannel | // alpha
      (0 << 16) | // blue
      (0 << 8) | // green
      0; // red
    this.whiteColorInt =
      this.alphaChannel | // alpha
      (255 << 16) | // blue
      (255 << 8) | // green
      255; // red
  }

  prepare(isTest) {
    this.allocBuffers();
    this.allocCache();
    this.test = isTest;
    if (isTest) {
      this.cacheFactor = 1.1;
    }
    //this.initializeCache();  
  }

  nextFrame(frameIndex) {
    if (this.test) {
      this.initializeCacheTest();
    } else {
      if (frameIndex === 0) {
        this.initializeCache();
      }
      this.resetBuffer();
      this.reprojectFrame();
      this.depthCulling();
      this.fillGaps();
      var requests = this.directSamples();
      this.requestSamples(frameIndex, requests);
      this.age(this.ageFactor, this.cache);
     }
  }

  getPixel(x, y) {
    return this.buffer[this.addressY[y] + x];
  }

  allocBuffers() {
    this.buffer = [];
    this.addressY = [];

    var index = 0;
    var x, y;
    var maxX = this.camera.scope.x + 1;
    var maxY = this.camera.scope.y + 1;
    for (y = 0; y <= maxY; y++) {
      this.addressY[y] = index;
      for (x = 0; x <= maxX; x++) {
        var pixel = new Pixel();
        pixel.x = x;
        pixel.y = y;
        this.buffer[index] = pixel;
        // border pixels get zero weight otherwise 1
        if(x === 0 || y === 0 || x === maxX || y === maxY){
          this.buffer[index].weight = 0;
        }
        else{
          this.buffer[index].weight = 1;
        }
        index++;
      }
    }
  }

  allocCache() {
    this.cache = [];
    this.cacheSize = this.camera.scope.x * this.camera.scope.y * this.cacheFactor;
    for (var i = 0; i < this.cacheSize; i++) {
      this.cache[i] = new Sample();
    }
  }

  allocCacheItem(pixel) {
    /*var stop,
      start,
      index,
      maxAge = -1;*/

    var stop = this.cachePointer + 8;
    if (stop > this.cacheSize) {
      stop = 8;
    }
    

    var index = -1;
    var maxAge = -1;
    var start = stop - 8;
   while (start < stop) {
      if (this.cache[start].pixel === null) {
        this.cache[start].attach(pixel);
        this.cachePointer = stop;
        return this.cache[start];
      }  else if (this.cache[start].age > maxAge) {
        index = start;
        maxAge = this.cache[start].age;
      }
      start++;
    }

    var item = this.cache[index];
    if (item.inUse) {
      item.clear();
    }
    this.cachePointer = stop;
    return item;
  }

  freeCacheItem(cacheItem) {
    cacheItem.clear();
  }

  addRequest(requests, pixel) {
    pixel.sample = true;
    var cacheItem = pixel.element;
    // check if resampling and add to sampling
    if (cacheItem !== null) {
      pixel.resample = true;
    } else {
      cacheItem = this.allocCacheItem(pixel);
      pixel.resample = false;
    }
    requests.push(cacheItem);
  }

  initializeCache() {
    var iterations = 0;
    var cacheUsage = 0.0;
    
    while (cacheUsage < this.initialFill) {
      var requests = [];
      for (var i = 0; i < this.maximumSamplesPerFrame; i++) {
        var x = Math.round(Math.random() * (this.camera.scope.x - 1));
        var y = Math.round(Math.random() * (this.camera.scope.y - 1));
        var pixel = this.getPixel(x, y);
        this.addRequest(requests, pixel);
      }
      this.requestSamples(0, requests);
      this.age(this.ageFactor, requests);
      console.log("Cache usage: " + cacheUsage * 100.0);
      cacheUsage += this.maximumSamplesPerFrameRatio;
      iterations++;
    }

    console.log(
      iterations + " iterations to fill " + cacheUsage * 100.0 + "% of cache"
    );
  }

  initializeCacheTest() {
    var requests = [];
    for (var y = 1; y <= this.camera.scope.y; y++) {
      for (var x = 1; x <= this.camera.scope.x; x++) {
        var pixel = this.getPixel(x, y);
        this.addRequest(requests, pixel);
      }
    }
    this.requestSamples(0, requests);
    this.age(this.ageFactor, requests);
  }

  resetBuffer() {
	for (var i = 0; i < this.cacheSize; i++) {
    	var cacheItem = this.cache[i];
		if (cacheItem.pixel !== null) {
			//cacheItem.hit = cacheItem.pixel;
			//cacheItem.pixelY = cacheItem.pixel.y;
		}
    if(cacheItem.hit !== null && cacheItem.age > 25){
      this.freeCacheItem(cacheItem);
    }
	}

    for (var y = 1; y <= this.camera.scope.y; y++) {
      for (var x = 1; x <= this.camera.scope.x; x++) {
        var pixel = this.getPixel(x, y);
        pixel.depth = this.depthThreshold;
		    pixel.element = null;
        
      }
    }
  }

  reprojectFrame() {
    //this.resetBuffer();

    // Reproject every valid existing cache element

    var result = { x: null, y: null, depth: this.depthThreshold };
    for (var i = 0; i < this.cacheSize; i++) {
      var cacheItem = this.cache[i];
      cacheItem.pixel = null;

      // empty cache item?
      if (cacheItem.hit === null) {
        // goto next cache item
        this.freeCacheItem(cacheItem);
        continue;
      }
     /* if(cacheItem.hit !== null && cacheItem.age > 25){
        this.freeCacheItem(cacheItem);
        continue;
      }*/

      if (this.camera.reprojectPixel(cacheItem, result)) {
        if (
          result.x >= 1 &&
          result.x <= this.camera.scope.x &&
          result.y >= 1 &&
          result.y <= this.camera.scope.y
        ) {
          var pixel = this.getPixel(result.x, result.y);

          /*if(pixel.element !== null && pixel.element.age > 25){
            this.freeCacheItem(pixel.element);
          }*/
    
          // reprojection depth smaller than current pixel depth?
          if (result.depth < pixel.depth) {
            // an element is already attached to pixel?
            
            if (pixel.element !== null) {
              // It seems that the element' hit atached to
              // this pixel is behind the current cache item' hit
              // so prematurelly age attached element
              pixel.element.age += this.ageFactor;
              //cacheItem.age += this.ageFactor;
              // and free it in cache
              this.freeCacheItem(pixel.element);
            }

            cacheItem.attach(pixel);
            pixel.depth = result.depth;
          } else {
            // current cache item 's hit is behind
            // element previously attached to pixel
            // So prematurelly age current cache item
            //cacheItem.age += this.ageFactor;
            pixel.element.age += this.ageFactor;
          }
        } else {
          // Element reprojected outside frame
          // Prematurelly hard age it ?
          //pixel.element.age += this.ageFactor * 2;
          cacheItem.age += this.ageFactor * 2;
        }
      } else {
        // element reprojected outside frame and in oposite direction
        // prematurelly very hard age it ?
        //pixel.element.age += this.ageFactor * 4;
        cacheItem.age += this.ageFactor * 4;
      }
    }
  }

  depthCulling() {
    var depthMin = 0.9;
    var depthMax = 1.1;

    for (var y = 1; y <= this.camera.scope.y; y++) {
      for (var x = 1; x <= this.camera.scope.x; x++) {
        var centerPixel = this.getPixel(x, y);
        var cacheItem = centerPixel.element;
        if (cacheItem !== null) {
          var depthItems = 0;
          var pixelDepthSum = 0.0;

          // square around pixel (except center pixel).
          // accumulate depths for existing elements.
          for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
              if (i !== 0 && j !== 0) {
                var otherPixel = this.getPixel(x + i, y + j);
                if (otherPixel.element !== null) {
                  pixelDepthSum += otherPixel.depth;
                  depthItems++;
                }
              }
            }
          }

          // any pixel around center with data?
          if (depthItems !== 0) {
            // average depth ratio between center and neighborhood
            var depthRatio = pixelDepthSum / (depthItems * centerPixel.depth);

            // depth ratio beyond threshold?
            if (depthRatio < depthMin || depthRatio > depthMax) {
              // If depth descontinuity is because neighborhood
              // is more recent than centerpixel so ignore
              // the depth cull: treat as if no cacheItem is mapped
              // in the center pixel
              cacheItem.age += this.ageFactor * 10;
              cacheItem.element = null;
            }
          }
        }
      }
    }
  }

  processInterpolation(pixel, data, itemWeight) {
    data.weight += pixel.weight;
    if (pixel.element !== null) {
      data.color.addMult(pixel.color, itemWeight);
      data.age += pixel.element.age;
      data.colorWeight += itemWeight;
      data.colorItems++;
    }
  }

  fillGaps() {
    // Reset priority data
    for(var i = 0; i < 3; i++){
      for (var j = 0; j < this.priorityLevels; j++) {
        this.priorities[i][j] = 0;
        /*this.priorities[INTERPOLATED][level] = 0; 
        this.priorities[URGENT][level] = 0; 
        this.priorities[SAMPLED][level] = 0;*/
      }
    }


    // Reset Floyd-steinberg
    // threshold data values

    this.totalPriority = 0;
    this.numberOfSamples = 0;
    var completeness = 0.0;

    // Now that depth are consistent (from depth culling)
    // atribute colors from existing cacheItems to the
    // corresponding pixels
    for (var y = 1; y <= this.camera.scope.y; y++) {
      for (var x = 1; x <= this.camera.scope.x; x++) {
        var pixel = this.getPixel(x, y);
        var cacheItem = pixel.element;
        if (cacheItem !== null) {
          cacheItem.color = pixel.color;
        } 
      }
    }

	  var colinear = 2;
    var corner = 1;

    // Interpolate color values to aproximate empty
    // pixels (that is pixels with no attached cache item)
    for (var y = 1; y <= this.camera.scope.y; y++) {
      for (var x = 1; x <= this.camera.scope.x; x++) {
        var centerPixel = this.getPixel(x, y);
        if (centerPixel.element === null) {
			var data = {
				age: 0.0,
				weight: 0.0,
				colorItems: 0,
				colorWeight: 0.0,
				color: new Color(),
			}
	var coords = []
			coords[0] = { x: x - 1, y: y - 1, type: corner };
			coords[1] = { x: x    , y: y - 1, type: colinear };
			coords[2] = { x: x + 1, y: y - 1, type: corner };
			coords[3] = { x: x - 1, y: y    , type: colinear };
			coords[4] = { x: x + 1, y: y    , type: colinear };
			coords[5] = { x: x - 1, y: y + 1, type: corner };
			coords[6] = { x: x    , y: y + 1, type: colinear };
			coords[7] = { x: x + 1, y: y + 1, type: corner };
			
		
			for (var coord = 0; coord < coords.length; coord++) {
				var pixel = this.getPixel(coords[coord].x, coords[coord].y);
        this.processInterpolation(pixel, data, coords[coord].type);	
			}

			if (data.colorItems > 0) {
				centerPixel.color.r = Math.floor(data.color.r / data.colorWeight);
				centerPixel.color.g = Math.floor(data.color.g / data.colorWeight);
				centerPixel.color.b = Math.floor(data.color.b / data.colorWeight);

				// Get a priority based on how many of
				// their immediate neighbors had a cache item
				centerPixel.priority = data.age / data.colorItems;
				centerPixel.priority += this.interpolationZero +
(data.weight - data.colorItems) * this.interpolationRandom;
				this.priorities[INTERPOLATED][centerPixel.priority]++;
				this.totalPriority += centerPixel.priority;
				this.numberOfSamples++;
			} else {
				centerPixel.color.r = 0.0;
				centerPixel.color.g = 0.0;
				centerPixel.color.b = 0.0;

				// A pixel without a point and whose neighbors
				// also do not have a point are given the
				// maximum priority (priorityMax)
				centerPixel.priority = this.priorityMax;
				this.priorities[URGENT][centerPixel.priority]++;
				this.totalPriority += centerPixel.priority;
				this.numberOfSamples++;
			}
        } 
		else {
          // Pixels which had a point map to them
          // have a priority equal to half the point's age
          centerPixel.priority = centerPixel.element.age/2;
          if (centerPixel.priority > 0) {
            this.totalPriority += centerPixel.priority;
            this.numberOfSamples++;
          }
          this.priorities[SAMPLED][centerPixel.priority]++;
          completeness += 1.0;
        }
        // Add to total frame priority
      }
    }

    // By this time all pixels are mapped to the render cache
    completeness = 100.0 * (completeness / (this.camera.scope.x * this.camera.scope.y));
    //console.log("Image completeness is: " + completeness);
  }

  directSamples() {
    var threshold = this.priorityMax;
    var count = this.priorities[URGENT][threshold];
    while (count < this.maximumSamplesPerFrame) {
      var test =
        this.priorities[INTERPOLATED][threshold] +
        this.priorities[SAMPLED][threshold];
      count += test;
      if (count < this.maximumSamplesPerFrame) {
        threshold--;
      }
    }

    var sizeFactor = 1.0;
    if (threshold === this.priorityMax) {
      sizeFactor = count / this.maximumSamplesPerFrame;
      if (sizeFactor < 1.2) sizeFactor = 1.0;
    }

    var occurence = 0.0;
    var requests = [];
    for (var y = 1; y <= this.camera.scope.y; y++)  {
      if (y % 2 === 0) {
        for (var x = 1; x <= this.camera.scope.x; x++) {
          var pixel = this.getPixel(x, y);
          if (pixel.priority >= threshold) {
            if (occurence >= sizeFactor) {
              occurence = occurence - sizeFactor;
              this.addRequest(requests, pixel);
              this.distributeHalfPriority(pixel, threshold, x, y, +1, +1);
            } else {
              occurence = occurence + 1.0;
            }
          } else {
            pixel.sample = false;
          }
        }
      } else {
        for (var x = 1; x <= this.camera.scope.x; x++) {
          var pixel = this.getPixel(x, y);
          if (pixel.priority >= threshold) {
            if (occurence >= sizeFactor) {
              occurence = occurence - sizeFactor;
              this.addRequest(requests, pixel);
              this.distributeHalfPriority(pixel, threshold, x, y, -1, +1);
            } else {
              occurence = occurence + 1.0;
            }
          } else {
            pixel.sample = false;
          }
        }
      }
    }
    return requests;
  }

  distributeHalfPriority(pixel, threshold, x, y, xRelative, yRelative) {
    // Distribute half
    var half = Math.floor((pixel.priority - threshold) / 2.0);
    if (half >= 0) {
      this.getPixel(x + xRelative, y).priority += half;
      this.getPixel(x, y + yRelative).priority += half;
    }
  }

  requestSamples(frameIndex, requests) {
    if (frameIndex % 10 === 0)
      console.log(
        "Frame " + frameIndex + ": requesting " + requests.length + " samples"
      );

    for (var i = 0; i < requests.length; i++) {
      var request = requests[i];
      if (request.resample) {
        this.camera.computeDirToHit(request);
      } else {
        this.camera.computeDirToPixel(request);
      }
      request.doRaytracing(this.engine, this.camera.from);
    }
  }

  age(step, coords) {
    for (var i = 0; i < coords.length; i++) {
      coords[i].age += step;
    }
    
  }

  getCacheUsage() {
    var used = 0;
    for (var i = 0; i < this.cacheSize; i++) {
      if (this.cache[i].pixel !== null) used++;
    }
    return used / this.cacheSize;
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // Frame drawing
  //
  /////////////////////////////////////////////////////////////////////////////
  computeReprojectionFrame(colorBuffer) {
    var pixelIndex = 0;
    var color;
    var pixel;
    for (var y = this.camera.scope.y - 1; y >= 0; y--) {
      for (var x = 0; x < this.camera.scope.x; x++, pixelIndex++) {
        pixel = this.getPixel(x + 1, y + 1);
        
        if (pixel.element !== null) {
          color = pixel.element.color;
          colorBuffer[pixelIndex] =
            this.alphaChannel | // alpha
            (color.b << 16) | // blue
            (color.g << 8) | // green
            color.r; // red
        } else {
          colorBuffer[pixelIndex] = this.blackColorInt;
        }
      }
    }
  }

  computeFrame(colorBuffer) {
    var pixelIndex = 0;
    var color;
    var pixel;
    for (var y = this.camera.scope.y - 1; y >= 0; y--) {
      for (var x = 0; x < this.camera.scope.x; x++, pixelIndex++) {
        pixel = this.getPixel(x + 1, y + 1);
        color = pixel.color;
        colorBuffer[pixelIndex] =
          this.alphaChannel | // alpha
          (color.b << 16) | // blue
          (color.g << 8) | // green
          color.r; // red
      }
    }
  }

  computePriorityFrame(colorBuffer) {
    var pixelIndex = 0;
    var pixel;
    for (var y = this.camera.scope.y - 1; y >= 0; y--) {
      for (var x = 0; x < this.camera.scope.x; x++, pixelIndex++) {
        pixel = this.getPixel(x + 1, y + 1);
        colorBuffer[pixelIndex] =
          this.alphaChannel | // alpha
          (pixel.priority << 16) | // blue
          (pixel.priority << 8) | // green
          pixel.priority; // red
      }
    }
  }

  computeSamplingFrame(colorBuffer) {
    var pixelIndex = 0;
    var pixel;
    for (var y = this.camera.scope.y - 1; y >= 0; y--) {
      for (var x = 0; x < this.camera.scope.x; x++, pixelIndex++) {
        pixel = this.getPixel(x + 1, y + 1);

        if (pixel.sample) {
          colorBuffer[pixelIndex] = this.whiteColorInt;
        } else {
          colorBuffer[pixelIndex] = this.blackColorInt;
        }
      }
    }
  }
}
