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
    this.maximumSamplesPerFrameRatio = 1/16;
    this.maximumSamplesPerFrame = this.camera.scope.x * this.camera.scope.y * this.maximumSamplesPerFrameRatio;
    this.interpolationRandom = 5;
    this.interpolationZero = 20;

    this.colorComponents = 3;
    this.cacheFactor = 4;
    this.depthThreshold = 1e6;
    this.ageFactor = 1;

    this.priorities = [];
    this.priorities[INTERPOLATED] = [];
    this.priorities[URGENT] = [];
    this.priorities[SAMPLED] = [];
    this.priorityLevels = 256;
    this.totalPriority = 0;
    this.priorityMax = 255;

    this.black = new Vector3();
    this.alphaChannel = (255 << 24);
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

    this.logPriorityBuffers = false;
  }

  prepare(isTest) {
    this.allocBuffers();
    this.allocCache();
    this.test = isTest;
    if (isTest) {
      this.cacheFactor = 1.1;
    }
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
        if(x === 0 || y === 0 || x === maxX || y === maxY)
        {
          this.buffer[index].weight = 0;
        }
        else
        {
          this.buffer[index].weight = 1;
        }
        index++;
      }
    }
  }

  allocCache() 
  {
    this.cache = new Array();
    this.cacheSize = this.camera.scope.x * this.camera.scope.y * this.cacheFactor;
    for (var i = 0; i < this.cacheSize; i++) 
    {
      this.cache[i] = new Sample();
    }
  }

  allocCacheItem(pixel) 
  {

	// get a frame of cache buffer composed of 8 items
    var stop = this.cachePointer + 8;
    // exceeds cache size? return to start
    if (stop > this.cacheSize) 
    {
      stop = 8;
    }
    

    var index = -1;
    var maxAge = -1;
    var i = stop - 8;
    // traverse the frame of 8 items
    while (i < stop) 
    {
      var item = this.cache[i];
      // found empty cache item?
      if (item.pixel === null) 
      {
        // attach this item to pixel
        item.attach(pixel);
        // set cache pointer to end of frame
        this.cachePointer = stop;
        // return cache item
        return item;
      } // cache item in use
     // store the index of item with maximum age
	    else if (item.age > maxAge) 
      {
        index = i;
        maxAge = item.age;
      }
      i++;
    }

    // if we reached this point is because no 8 items in cache
    // were empty. So for the item with highest age
    // use it!
    var item = this.cache[index];
    item.clear();
    item.attach(pixel);

    // set cache pointer to end of frame
    this.cachePointer = stop;
    // return cache item
    return item;
  }

  freeCacheItem(cacheItem) {
    cacheItem.clear();
  }

  addRequest(requests, pixel) 
  {
    pixel.sample = true;
    var cacheItem = pixel.element;
    // check if resampling and add to sampling
    if (cacheItem) 
    {
      pixel.resample = true;
    } 
    else 
    {
      cacheItem = this.allocCacheItem(pixel);
      pixel.resample = false;
    }
    requests.push(cacheItem);
  }

  initializeCache() 
  {
    var iterations = 0;
    var cacheUsage = 0.0;
    var requests = [];
    while (cacheUsage < this.initialFill) {
      for (var i = 0; i < this.maximumSamplesPerFrame; i++) 
      {
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

    console.log(iterations + " iterations to fill " + cacheUsage * 100.0 + "% of cache");
  }

  initializeCacheTest() 
  {
    var requests = [];
    for (var y = 1; y <= this.camera.scope.y; y++) 
    {
      for (var x = 1; x <= this.camera.scope.x; x++) 
      {
        var pixel = this.getPixel(x, y);
        this.addRequest(requests, pixel);
      }
    }
    this.requestSamples(0, requests);
    this.age(this.ageFactor, requests);
  }

  resetBuffer() {

  for (var y = 1; y <= this.camera.scope.y; y++)
   {
      for (var x = 1; x <= this.camera.scope.x; x++) 
      {
        var pixel = this.getPixel(x, y);
        pixel.depth = this.depthThreshold;
        if(pixel.age > -1)
        {
          this.freeCacheItem(pixel.element);

        }
		    pixel.element = null;
      }
    }

    for (var i = 0; i < this.cacheSize; i++) 
    {
      var cacheItem = this.cache[i];
      if(cacheItem.color === null || cacheItem.age > 15 || cacheItem.resample === true || cacheItem.pixel === null)
      {
        this.freeCacheItem(cacheItem);
      }
    }
  }

  reprojectFrame() 
  {
    // Reproject every valid existing cache element

    var result = { x: null, y: null, depth: this.depthThreshold };

    for (var i = 0; i < this.cacheSize; i++) 
    {
      var cacheItem = this.cache[i];
      cacheItem.pixel = null;

      // empty cache item
      if(cacheItem.hit === null)
      {
        this.freeCacheItem(cacheItem);
        continue;
      }

      if (this.camera.reprojectPixel(cacheItem, result)) 
      {
        if (
          result.x >= 1 &&
          result.x <= this.camera.scope.x &&
          result.y >= 1 &&
          result.y <= this.camera.scope.y
        ) 
        {
          var pixel = this.getPixel(result.x, result.y);

          // reprojection depth smaller than current pixel depth?
          if (result.depth < pixel.depth) 
          {
            // an element is already attached to pixel?
            if (pixel.element) 
            {
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
          } 
          else 
          {
            // current cache item 's hit is behind
            // element previously attached to pixel
            // So prematurelly age current cache item
            cacheItem.age += this.ageFactor;
            //pixel.element.age += this.ageFactor;
          }
        } 
        else 
        {
          // Element reprojected outside frame
          // Prematurelly hard age it ?
          cacheItem.age += (this.ageFactor * 2);
        }
      } 
      else 
      {
        // element reprojected outside frame and in oposite direction
        // prematurelly very hard age it ?
        cacheItem.age += (this.ageFactor * 4);
      }
    }
  }

  depthCulling() 
  {
    var depthMin = 0.9;
    var depthMax = 1.1;

    for (var y = 1; y <= this.camera.scope.y; y++) {
      for (var x = 1; x <= this.camera.scope.x; x++) {
        var centerPixel = this.getPixel(x, y);
        var cacheItem = centerPixel.element;
        if (cacheItem) {
          var depthItems = 0;
          var pixelDepthSum = 0;

          // square around pixel (except center pixel).
          // accumulate depths for existing elements.
          for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
            //for (var i = -1; i <= 1; i++) {
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
          if (depthItems !== 0) 
          {
            // average depth ratio between center and neighborhood
            var depthRatio = pixelDepthSum / (depthItems * centerPixel.depth);

            // depth ratio beyond threshold?
            if (depthRatio < depthMin || depthRatio > depthMax) 
            {
              // If depth descontinuity is because neighborhood
              // is more recent than centerpixel so ignore
              // the depth cull: treat as if no cacheItem is mapped
              // in the center pixel
              cacheItem.age += (this.ageFactor * 10);
             /* if(cacheItem.age > 35){
                this.freeCacheItem(cacheItem);
              }*/
              cacheItem.element = null;
            }
          }
        }
      }
    }
  }

  fillGaps() 
  {
    // Reset priority data
      for (var j = 0; j < this.priorityLevels; j++) 
      {
        this.priorities[INTERPOLATED][j] = 0; 
        this.priorities[URGENT][j] = 0; 
        this.priorities[SAMPLED][j] = 0;
      }

    // Reset Floyd-steinberg
    // threshold data values

    this.totalPriority = 0;
    this.numberOfSamples = 0;
    var completeness = 0;

    // Now that depth are consistent (from depth culling)
    // atribute colors from existing cacheItems to the
    // corresponding pixels
    for (var y = 1; y <= this.camera.scope.y; y++) {
      for (var x = 1; x <= this.camera.scope.x; x++) {
        var pixel = this.getPixel(x, y);
        var cacheItem = pixel.element;
        if (cacheItem) {
          cacheItem.color = pixel.color;
          //pixel.color = cacheItem.color;
        } 
      }
    }

    // Interpolate color values to aproximate empty
    // pixels (that is pixels with no attached cache item)
    for (var y = 1; y <= this.camera.scope.y; y++) 
    {
      for (var x = 1; x <= this.camera.scope.x; x++) 
      {
        var centerPixel = this.getPixel(x, y);
        if (centerPixel.element === null) 
        {

      var age = 0;
      var weight = 0;
      var colorItems = 0;
      var colorWeight = 0;
      var color = new Color();
      var itemWeight;

      for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            var pixel = this.getPixel(x + i, y + j);
            if(i !== 0 && j !== 0)
            {
              itemWeight = 1; //corner
            }
            else 
            {
              itemWeight = 2; //colinear
            }
              weight += pixel.weight;
              if (pixel.element) {
                color.addMult(pixel.color, itemWeight);
                age += pixel.element.age;
                colorWeight += itemWeight;
                colorItems++;
              }    
         }
      }
			
			if (colorItems > 0) 
      {
				centerPixel.color.r = Math.floor(color.r/colorWeight);
				centerPixel.color.g = Math.floor(color.g/colorWeight);
				centerPixel.color.b = Math.floor(color.b/colorWeight);

				// Get a priority based on how many of
				// their immediate neighbors had a cache item
				centerPixel.priority = (age/colorItems);
				centerPixel.priority += (this.interpolationZero + (weight - colorItems) * this.interpolationRandom);
        centerPixel.priority = Math.round(centerPixel.priority);

				this.priorities[INTERPOLATED][centerPixel.priority]++;
				this.totalPriority += centerPixel.priority;
				this.numberOfSamples++;
			} 
      else 
      {
				centerPixel.color.clear();

				// A pixel without a point and whose neighbors
				// also do not have a point are given the
				// maximum priority (priorityMax) - 255
				centerPixel.priority = this.priorityMax;
				this.priorities[URGENT][centerPixel.priority]++;
				this.totalPriority += centerPixel.priority;
				this.numberOfSamples++;
			}
        } 
		else 
        {
          // Pixels which had a point map to them
          // have a priority equal to half the point's age
          centerPixel.priority = (centerPixel.element.age >> 1);
          
          if (centerPixel.priority > 0) 
          {
            this.totalPriority += centerPixel.priority;
            //this.numberOfSamples++;
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

  /*directSamples() {
    var threshold = this.priorityMax;
    var count = this.priorities[URGENT][threshold];
    var test;

    while (count < this.maximumSamplesPerFrame) {
      test = this.priorities[INTERPOLATED][threshold] + this.priorities[SAMPLED][threshold];
       // console.log(this.priorities[SAMPLED][threshold]);

      count += test;
      if (count < this.maximumSamplesPerFrame) {
        threshold = threshold - 2;
      }
    }
    var sizeFactor = 1;
    if (threshold === this.priorityMax) 
    {
      sizeFactor = Math.floor(count / this.maximumSamplesPerFrame);
      if (sizeFactor < 1.2) sizeFactor = 1.0;
    }

    var occurence = 0;
    var requests = new Array();
    threshold = (threshold*this.maximumSamplesPerFrameRatio);
    for (var y = 1; y <= this.camera.scope.y; y++)  
    {
      if (y % 2 === 0) 
      {
        for (var x = 1; x <= this.camera.scope.x; x++) 
        {
          var pixel = this.getPixel(x, y);

          if (pixel.priority >= 0) 
          {
            if (occurence >= sizeFactor) 
            {
              occurence = occurence - sizeFactor;
              this.addRequest(requests, pixel);
              //this.distributeHalfPriority(pixel, threshold, x, y, +1, 1);
              this.distributeHalfPriority(pixel, threshold, x, y, 1, 1);

              //pixel.sample = true;
            } 
            else 
            {
              occurence = occurence + 1.0;
            }
            
          } 
          else 
          {
            pixel.sample = false;
          }
        }
      } 
      else 
      {    
        for (var x = this.camera.scope.x; x >= 0; x--)
        //for (var x = 1; x <= this.camera.scope.x; x++) 
        {
          var pixel = this.getPixel(x, y);

          if (pixel.priority >= threshold) 
          {
            if (occurence >= sizeFactor) 
            {
              occurence = occurence - sizeFactor;
              this.addRequest(requests, pixel);
              //this.distributeHalfPriority(pixel, threshold, x, y, -1, 1);
              this.distributeHalfPriority(pixel, threshold, x, y, -1, 1);

              //pixel.sample = true;
            } 
            else 
            {
              occurence = occurence + 1.0;
            }
            
          } 
          else 
          {
            pixel.sample = false;
          }
        }
      }
    }
    return requests;
  }*/

  directSamples() {
    // get the minimum priority that
    // cant fit the maximum requests per frame

    // total number of samples to request
    var samples = null;
    // minimum priority threshold
    var threshold = null;

	if (this.logPriorityBuffers) 
  {
		var interpolated = "";
		var urgent = "";
		var sampled = "";
		for (var level = 0; level < this.priorityLevels; level++) {
		interpolated += " " + this.priorities[INTERPOLATED][level];
		urgent += " " + this.priorities[URGENT][level];
		sampled += " " + this.priorities[SAMPLED][level];
		}

		console.log("Interpolated " + interpolated);
		console.log("Urgent " + urgent);
		console.log("sampled " + sampled);
	}

    for (var i = this.priorityMax; i >= 0; i--) 
    {
        var test =
        this.priorities[URGENT][i] +
        this.priorities[INTERPOLATED][i] +
        this.priorities[SAMPLED][i];

      if (samples === null) 
      {
        samples = test;
        test = 0;
      }

      if (samples + test > this.maximumSamplesPerFrame) 
      {
        threshold = i;
        //threshold = threshold - 2;
	    	samples += test;
        break;
      }
      else 
      {
        samples += test
      }
    }
    //threshold = (threshold*this.maximumSamplesPerFrameRatio);

	// assuming one request per sample to be performed
    var requestFactor = 1.0;

    // is the number of samples still larger that the
    // maximum requests per frame?
    
	// determine the factor of samples to request 
	requestFactor = samples / this.maximumSamplesPerFrame;
	// if (requestFactor < 1.2) requestFactor = 1.0;

	var list=[];
	var index = 0;
	for (var y = 1; y <= this.camera.scope.y; y++) 
  {
		if (y % 2 == 0) 
    {
			for (var x = 1; x <= this.camera.scope.x; x++) {
				var pixel = this.getPixel(x, y);
				if (pixel.priority >= threshold) {
					list[index] = { pixel: pixel, x: x, y: y, xRelative: 1, yRelative: 1};
					index++;
				}
			}
		}
		else {
			for (var x = this.camera.scope.x; x > 0 ; x--) {
				 var pixel = this.getPixel(x, y);
				if (pixel.priority >= threshold) {
					list[index] = { pixel: pixel, x: x, y: y, xRelative: -1, yRelative: 1 };
					index++;
				}
			}
		}
	}

	index = 0;
	var lastI = null;
	var requests = [];
	while (index < list.length) {
		var i = Math.round(index);
		if (lastI === null || (lastI !== null && lastI !== i)) {
			if (i < list.length) {
				var item = list[i]
				this.addRequest(requests, item.pixel);
				this.distributeHalfPriority(pixel, threshold, item.x, item.y, item.xRelative, item.yRelative);
			} 
		}
		lastI = i
		index += requestFactor;
	}
	return requests;
  }

  distributeHalfPriority(pixel, threshold, x, y, xRelative, yRelative) 
  {
    // Distribute half
    var half = Math.floor((pixel.priority - threshold) / 2);
    if (half >= 0) 
    {
      this.getPixel(x + xRelative, y).priority += half;
      this.getPixel(x, y + yRelative).priority += half;
    }
  }

  requestSamples(frameIndex, requests) 
  {
    if (frameIndex % 10 === 0)
      console.log("Frame " + frameIndex + ": requesting " + requests.length + " samples");

    for (var i = 0; i < requests.length; i++) {
      var request = requests[i];
      if(request.pixel !== null){
      if (request.resample) {
        this.camera.computeDirToHit(request);
      } else {
        this.camera.computeDirToPixel(request);
      }
       request.doRaytracing(this.engine, this.camera.from);
      }
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
      if (this.cache[i].pixel !== null) 
      used++;
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
    var color = new Color();
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
        } 
        else if (pixel.element !== null && pixel.element.color === null) {
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
        //color = pixel.color;
        if (pixel.element !== null && pixel.element.color !== null) {
          color = pixel.element.color;
          colorBuffer[pixelIndex] =
            this.alphaChannel | // alpha
            (color.b << 16) | // blue
            (color.g << 8) | // green
            color.r; // red
        } 
        else if (pixel.element !== null && pixel.element.color === null) {
          colorBuffer[pixelIndex] = this.blackColorInt;
        } 
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
