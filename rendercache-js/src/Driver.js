import Sample from "./Sample.js";
import Pixel from "./Pixel.js";
import Color from "./Color.js";
import Vector3 from "./Vector3.js";
import Scene2 from "./Scene2.js";
import RayTracer from "./Raytracer.js";
import Scene from "./Scene.js";


const INTERPOLATED = 0;
const URGENT = 1;
const SAMPLED = 2;

export default class Driver {
  constructor(camera, ratio, colorBuffer) {
    this.test = false;
    this.camera = camera;
    this.scene = new Scene2();
    this.engine = new RayTracer(this.scene);
    this.cache = null;
    this.buffer = null;
    this.addressY = null;

    this.cacheSize = 0;
    this.cachePointer = 0;
    this.cachePageSize = 8;
    this.numberOfSamples = 0;

	  this.initialFill = 0.2;
    this.maximumSamplesPerFrameRatio = 1/ratio;
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
    this.statistics = { frameIndex: 0, 
			startingCacheUsage: 0.0, 
			iterationsToFill: 0.0, 
			initialFill: 0.0, 
			completeness: 0.0, 
			totalPriority: 0.0,
			requestFactor: 0.0,
			threshold: 0.0,
			candidates: 0,
			requests: 0 
		};

    this.jobCount = 3;
    this.rows = [];
    this.startTime = Date.now();
    this.runTime = Date.now();;

    //this.serializeScene();

    this.workers = [];
    for(var i=0; i < this.jobCount; i++)
    {
        this.workers.push(new Worker("../src/RenderWorker.js", {type: 'module'} ));
    }

    this.messageReceived = true;
    this.c = new Vector3(0, 0, 0);

    var canvas = document.getElementById("resultCanvas");
    this.ctx = canvas.getContext("2d");

    // initialize buffer view
    this.colorDepth = 4;
    // @ts-ignore
    this.bufferC = new ArrayBuffer(this.camera.scope.x * this.camera.scope.y * this.colorDepth);
    this.colorbuffer = new Uint32Array(this.bufferC);
    this.colorBuffer = colorBuffer;
    this.counter = 0;
  }

  
  serializeScene()
  {
      // serialize scene
      this.serializedElements = [];
      var elements = this.scene.getElements();
      for(var i=0; i<elements.length; i++)
      {
          var el = elements[i];
          this.serializedElements.push(el.serialize());
      }
  }

  prepare(isTest) {
    this.allocBuffers();
    this.allocCache();
    this.test = isTest;
    if (isTest) {
      this.cacheFactor = 1.1;
    }
  }
  
	resetStatistics(frameIndex) {
		this.frameIndex = frameIndex;
		this.statistics.cacheUsage = 0.0;	  
  	}

  nextFrame(frameIndex, fps) {
    if (this.test) {
      this.initializeCacheWithEntireFrame();
    } else {
      if (frameIndex === 0) {
        this.initializeCache();
      }
      this.resetStatistics(frameIndex);
      this.resetBuffer();
      this.reprojectFrame();
      this.depthCulling();
      this.fillGaps();
      var requests = this.directSamples();
      this.requestSamples(requests);
      this.age(this.ageFactor, this.cache);
      
      //export information to csv
      this.parse(frameIndex, fps);
     }
  }

  nextFrame1SPP(frameIndex) {
    if (this.test) {
      this.initializeCacheWithEntireFrame();
    } else {
      if (frameIndex === 0) {
        this.initializeCache();
      }
      this.reprojectFrame();
      this.depthCulling();
      this.fillGaps();
      var requests = this.directSamples();
      this.requestSamples(requests);
     }
  }

  parse(frameIndex, fps){
    if(frameIndex % 10 === 0)
    console.log("\n completeness: " + this.statistics.completeness 
    + "\n totalPriority: " + this.statistics.totalPriority 
    + "\n threshold: " + this.statistics.threshold 
    + "\n candidates: " + this.statistics.candidates 
    + "\n requests: " + this.statistics.requests
    + "\n totalFrames: " + frameIndex);

    this.fps++;

    this.runTime += Date.now() - this.runTime;
    //data to be converted to csv
    var row = [
      this.statistics.completeness, 
      this.statistics.totalPriority,
      this.statistics.threshold,
      this.statistics.candidates, 
      this.statistics.requests,
      frameIndex,
      this.fps,
     // this.runTime
    ];

    //every second add a row with the above information
    if (Date.now() - this.startTime > 1000) {
      Date.now() - this.startTime
      this.startTime = Date.now();
      this.rows.push(row);
      this.fps = 0;
    }
    
    //if frameIndex is a certain value then export file
    if(frameIndex === 150){
     // this.exportToCsv("file", this.rows);
    }
  }

  exportToCsv(filename, rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
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
			this.weight = (x === 0 || y === 0 || x === maxX || y === maxY ? 0 : 1);
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

    var pixelIndex = 0;
		for (var y = this.camera.scope.y - 1; y >= 0; y--) 
    {
			for (var x = 0; x < this.camera.scope.x; x++, pixelIndex++) 
      {
				this.colorBuffer[pixelIndex] = this.blackColorInt;
			}
		}

  }

  allocCacheItem(pixel) 
  {

		// get the next page stop index
    var stop = this.cachePointer + this.cachePageSize;
		// page stop index exceeds cache size? 
		// return to cache start
    if (stop > this.cacheSize) 
    {
      stop = this.cachePageSize;
    }
    

    var maxAge = -1;
		var maxAgeIndex = -1;
    // compute starting index i
		var i = stop - this.cachePageSize;
		// traverse the page (from i to stop)
    while (i < stop) 
    {
      var item = this.cache[i];
			// current item is empty?
      if (item.pixel === null) 
      {
        // use it!
        // attach this item to pixel
        item.attach(pixel);
        // set cache pointer to end of frame
        this.cachePointer = stop;
				// return newly allocated cache item
        return item;
      }
			else // current item is in use.
			// store the index of item with maximum age
			if (item.age > maxAge) 
      {
				maxAge = item.age
				maxAgeIndex = i				
			}
			i++;
		}

		// if we reached this point is because all items in 
		// the current page are in use. So reuse the item with
		// the highest age
    var item = this.cache[maxAgeIndex];
    item.clear();
    item.attach(pixel);

		// set cache pointer to end of current page
    this.cachePointer = stop;
		// return newly reused cache item
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

  initializeCache(worker) 
  {
    var iterations = 0;
    var cacheUsage = 0.0;

    this.statistics.initialFill = this.initialFill;
    while (cacheUsage < this.initialFill) 
    { 
      var requests = [];
      for (var i = 0; i < this.maximumSamplesPerFrame; i++) 
      {
        var x = Math.round(Math.random() * (this.camera.scope.x - 1));
        var y = Math.round(Math.random() * (this.camera.scope.y - 1));
        var pixel = this.getPixel(x, y);
        this.addRequest(requests, pixel);
      }
      this.requestSamples(requests);
      this.age(this.ageFactor, requests);
      //console.log("Cache usage: " + cacheUsage * 100.0);
      cacheUsage += this.maximumSamplesPerFrameRatio;
      iterations++;
    }
		this.statistics.startingCacheUsage = cacheUsage * 100.0;
		this.statistics.iterationsToFill = iterations;
    //console.log(iterations + " iterations to fill " + cacheUsage * 100.0 + "% of cache");
  }


	initializeCacheWithEntireFrame() 
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

		this.requestSamples(requests);
		this.age(this.ageFactor, requests);
	}

  resetBuffer() 
  {
    var counter = this.cacheSize * this.maximumSamplesPerFrameRatio;
    for (var i = 0; i < counter; i++) 
    {
      var cacheItem = this.cache[i];
      if(cacheItem.color === null || cacheItem.age > 35)      {
        this.freeCacheItem(cacheItem);
      }
    }
  }

  detachFrameFromCache() 
  {
		// for every pixel
		for (var y = 1; y <= this.camera.scope.y; y++) 
    {
			for (var x = 1; x <= this.camera.scope.x; x++) 
      {
				var pixel = this.getPixel(x, y);
				pixel.sample = false;
				// set depth to maximum
				pixel.depth = this.depthThreshold;
				// detach from cache item
				pixel.element = null;
			}
		}
	}

  reprojectFrame() 
  {
    this.detachFrameFromCache();

    // define a result structure
    var result = { x: null, y: null, depth: this.depthThreshold };

    // for every cache item
    for (var i = 0; i < this.cacheSize; i++) 
    {
      var cacheItem = this.cache[i];

      // detach from pixel
      cacheItem.pixel = null;
			// previous hit?
			if (cacheItem.hit !== null) {
				// yes! reproject hit and retrieve new (x,y)
				if (this.camera.reprojectPixel(cacheItem, result)) {

					// pixel within safe frame?
					if (
						result.x >= 1 &&
						result.x <= this.camera.scope.x &&
						result.y >= 1 &&
						result.y <= this.camera.scope.y
					) {
						// get pixel for x,y
						var pixel = this.getPixel(result.x, result.y);
						
						// new reprojection depth is smaller than pixel depth?
						if (result.depth < pixel.depth) {
							
							// an element is already attached to this pixel?
							if (pixel.element !== null) {
								// It seems that the element' hit atached to
								// this pixel is behind the current cache item' hit
								// so prematurelly age attached element
								pixel.element.age += this.ageFactor;
								// and free the cache for the pixel whose
								// hit is behind current result
								// this.freeCacheItem(pixel.element);
							}

							// attach the cache item to the pixel
							cacheItem.attach(pixel);
							// set the pixel depth to the minimum depth
							pixel.depth = result.depth;
						} 
						else {
							// current cache item 's hit is behind
							// element previously attached to pixel
							// So prematurelly age current cache item
							cacheItem.age += this.ageFactor ;
						}
					} 
					else {
						// cache item reprojected to a pixel that
						// is outside the frame, so prematurelly 
						// hard age it
						cacheItem.age += this.ageFactor * 2;
					}
				} 
				else {
					// element reprojected outside frame and in oposite direction
					// prematurelly very hard age it ?
					cacheItem.age += this.ageFactor * 4;
				}
			}
		}
	}

  depthCulling() 
  {
    var depthMin = 0.9;
    var depthMax = 1.1;

    for (var y = 1; y <= this.camera.scope.y; y++) 
    {
      for (var x = 1; x <= this.camera.scope.x; x++) 
      {				
        // for every pixel
        var pixel = this.getPixel(x, y);
        var cacheItem = pixel.element;
				// is a cache item attached?
        if (cacheItem) 
        {
          var depthItems = 0;
          var pixelDepthSum = 0;

          // square around pixel (except center pixel).
					// accumulate depth for neighbour elements.
          for (var i = -1; i <= 1; i++) 
          {
            for (var j = -1; j <= 1; j++) 
            {
              // not center pixel?
              if (i !== 0 && j !== 0) 
              {
                var otherPixel = this.getPixel(x + i, y + j);
                // cache item exists?
                if (otherPixel.element !== null) 
                {
                  pixelDepthSum += otherPixel.depth;
                  depthItems++;
               }
              }
            }
          }

					// any neighbour with data around pixel?
          if (depthItems !== 0) 
          {
						// compute depth ratio between center and neighborhood
            var depthRatio = pixelDepthSum / (depthItems * pixel.depth);

						// is depth ratio beyond thresholds?
            if (depthRatio < depthMin || depthRatio > depthMax) 
            {
							// a depth descontinuity exists between neighborhood
							// and center pixel so strongly age cache item
              cacheItem.age += (this.ageFactor * 10);
              /*if(cacheItem.age > 35){
                this.freeCacheItem(cacheItem);
              }*/
              //cacheItem.element = null;
            }
          }
					// set the pixel color to the cache item color
					pixel.color = cacheItem.color;
        }
				else 
        {
					// reset pixel color as there is no item
					pixel.color = new Color();
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
		var totalPriority = 0;
    //this.numberOfSamples = 0;
    var completeness = 0;

    // Interpolate color values to aproximate empty
    // pixels (that is pixels with no attached cache item)
    for (var y = 1; y <= this.camera.scope.y; y++) 
    {
      for (var x = 1; x <= this.camera.scope.x; x++) 
      {
       // if(y % 2 === 0 || x % 2 === 0){
        var centerPixel = this.getPixel(x, y);
        // pixel has no data?
        if (centerPixel.element === null) 
        {

          var age = 0;
          var weight = 0;
          var colorItems = 0;
          var colorWeight = 0;
          var color = new Color();
          var itemWeight;

        for (var i = -1; i <= 1; i++) 
        {
          for (var j = -1; j <= 1; j++) 
          {
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
                if (pixel.element) 
                {
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
				centerPixel.priority += (this.interpolationZero 
                                + (weight - colorItems) 
                                * this.interpolationRandom);
        centerPixel.priority = Math.round(centerPixel.priority);

				this.priorities[INTERPOLATED][centerPixel.priority]++;
				this.totalPriority += centerPixel.priority;
				//this.numberOfSamples++;
			} 
      else 
      {
				centerPixel.color.clear();

				// A pixel without a point and whose neighbors
				// also do not have a point are given the
				// maximum priority (priorityMax) - 255
				centerPixel.priority = this.priorityMax;
				this.priorities[URGENT][centerPixel.priority]++;
				totalPriority += centerPixel.priority;
				//this.numberOfSamples++;
			}
        } 
		else 
        {
          // Pixels which had a point map to them
          // have a priority equal to half the point's age
          centerPixel.priority = (centerPixel.element.age >> 1);
          
          if (centerPixel.priority > 0) 
          {
            totalPriority += centerPixel.priority;
            //this.numberOfSamples++;
          }
          this.priorities[SAMPLED][centerPixel.priority]++;
          completeness += 1.0; 
        }
        // Add to total frame priority
     // }
    }
  }

		// by this time all pixels are mapped to the render cache
		this.statistics.completeness = 100.0 * (completeness / (this.camera.scope.x * this.camera.scope.y));
		this.statistics.totalPriority = totalPriority;
  }

  directSamples() 
  {
		// total number of samples to request
		var samples = null;
		// minimum priority threshold
		var threshold = null;

    if (this.logPriorityBuffers) 
    {
      var interpolated = "";
      var urgent = "";
      var sampled = "";
      for (var level = 0; level < this.priorityLevels; level++) 
      {
      interpolated += " " + this.priorities[INTERPOLATED][level];
      urgent += " " + this.priorities[URGENT][level];
      sampled += " " + this.priorities[SAMPLED][level];
      }

      console.log("Interpolated " + interpolated);
      console.log("Urgent " + urgent);
      console.log("sampled " + sampled);
    }

		// get the lowest priority that accumulate
		// samples that can be requested for a single frame
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

		// default assume one request per sample to be performed
		var requestFactor = 1.0;
		// but the number of samples to request can be larger than the
		// maximum requests per frame, so determine the factor 
		// of samples to request
		requestFactor = samples / this.maximumSamplesPerFrame;
		// if (requestFactor < 1.2) requestFactor = 1.0;

		this.statistics.threshold = threshold;
		this.statistics.requestFactor = requestFactor;
		
		var candidate = [];
		var index = 0;
		// for every row
    for (var y = 1; y <= this.camera.scope.y; y++) 
    {			
      // depending on even-odd number
      if (y % 2 == 0) 
      {
        // traverse x ascending
        for (var x = 1; x <= this.camera.scope.x; x++) {
          var pixel = this.getPixel(x, y);
          // pixel priority high? 
          if (pixel.priority >= threshold) {
              // add to candidate requests
              candidate[index] = 
              {
                pixel: pixel,
                x: x,
                y: y,
                xRelative: 1,
                yRelative: 1,
              };
              index++;
          }
        }
      }
      else 
      {
          // traverse x descending
          // @ts-ignore
          for (var x = this.camera.scope.x; x > 0; x--) {
            var pixel = this.getPixel(x, y);
            // pixel priority high? 
            if (pixel.priority >= threshold) {
              // add to candidate requests
              candidate[index] = {
                pixel: pixel,
                x: x,
                y: y,
                xRelative: -1,
                yRelative: 1,
              };
              index++;
            }
          }
        }
     }

    this.statistics.candidates = candidate.length;

    index = 0;
    var lastI = null;
    var requests = [];
		// for each candidate request
		while (index < candidate.length) 
    {
			// get index
			var i = Math.round(index);
			// is a new index?
			if (lastI === null || (lastI !== null && lastI !== i)) 
      {
				// is index within candidate list?
				if (i < candidate.length) 
        {
					var item = candidate[i];
					// add to effective request
					this.addRequest(requests, item.pixel);
					// distribute the high pixel priority
					this.distributeExceedingPriority(
						pixel,
						threshold,
						item.x,
						item.y,
						item.xRelative,
						item.yRelative
					);
				}
			}
			lastI = i;
			index += requestFactor;
		}
	return requests;
}

  distributeExceedingPriority(pixel, threshold, x, y, xRelative, yRelative) 
  {
    // compute half exceeding priority
    var half = Math.floor((pixel.priority - threshold) / 2.0);
    if (half >= 0) 
    {
      // exists? distribute for these pixels
      this.getPixel(x + xRelative, y).priority += half;
      this.getPixel(x, y + yRelative).priority += half;
    }
  }
  
  getSerializedRequest(newRequests, i)
  {
    var newRequest = [];

    newRequest.hit = new Vector3(
      newRequests[i].hit[0], 
      newRequests[i].hit[1],
      newRequests[i].hit[2]
      );

    newRequest.normalDir = new Vector3(
      newRequests[i].normalDir[0], 
      newRequests[i].normalDir[1],
      newRequests[i].normalDir[2]
    );

    newRequest.rayDir = new Vector3(
      newRequests[i].rayDir[0], 
      newRequests[i].rayDir[1],
      newRequests[i].rayDir[2]
    );

    newRequest.color = new Color();
    newRequest.color.copy(newRequests[i].color);

    newRequest.pixel = new Vector3(
      newRequests[i].pixel[0], 
      newRequests[i].pixel[1],
      newRequests[i].pixel[2]
    );

    return newRequest;
  }

  serializeRequests(requests)
  {
   var fromRequests = [];
   var newRequests = [];

   for (var i = 0; i < requests.length; i++) 
   {  
     var request = requests[i];

     if (request.resample) 
     {
       this.camera.computeDirToHit(request);
     } 
     else 
     {
       this.camera.computeDirToPixel(request);
     }

     fromRequests[i] = this.camera.from;

     newRequests[i] = request.serialize(fromRequests[i]);
   }

   return newRequests;
  }

  requestSamples(requests) 
  {
		this.statistics.requests = requests.length;

    var newRequests = this.serializeRequests(requests);
    //console.log(newRequests[7])

    function trace(rayOrigin, sample, sceneElem) {
      //console.log("tracing...");
      var tnear = INFINITY;
      var element = null;

      console.log(sceneElem);
      var elements = sceneElem;
      var elementsLen = elements.length;
      console.log("here")
      var hitInfo = {t0:INFINITY, t1:INFINITY};
      for(var i=0; i<elementsLen; i++) {
          hitInfo.t0 = INFINITY;
          hitInfo.t1 = INFINITY;
          var el = elements[i];
          if(el.intersect(rayOrigin, sample.rayDir, hitInfo)) {
              // ray hit intersect
              if(hitInfo.t0 < 0) {
                  hitInfo.t0 = hitInfo.t1;
              }

              if(hitInfo.t0 < tnear) {
                  tnear = hitInfo.t0;
                  element = el;
              }
          }
      }
      if(element === null) {
          // consider a very far away point to be the hit
          sample.hit = rayOrigin.add(sample.rayDir.multiply(100000.0));
          sample.normalDir = new Vector3(-sample.hit.x, -sample.hit.y, -sample.hit.z); 
    // no hit, return background color
    return this.scene.backgroundColor;
      }

      var surfaceColor = new Vector3(0,0,0);
      var intersectionPoint = rayOrigin.clone().add(sample.rayDir.clone().multiply(tnear));

      var intersectionNormal = element.getNormal(intersectionPoint);

      sample.hit = intersectionPoint.clone();
  sample.normalDir = intersectionNormal.normalize();

      //this.setHit(sample.hit);

      var bias = 1e-4;
      var inside = false;
      if (sample.rayDir.dot(intersectionNormal) > 0) {
          intersectionNormal = intersectionNormal.invert();
          inside = true;
      }

      var mat = element.getMaterial();
      for(var i=0; i<elementsLen; i++)
      {
          var el = elements[i];
          var lightMat = el.getMaterial();
          if(lightMat.emissionColor.x > 0 || lightMat.emissionColor.y > 0 || lightMat.emissionColor.z > 0)
          {
              // light source
              var transmission = new Vector3(1, 1, 1);
              var lightDirection = el.getCenter().subtract(intersectionPoint);
              lightDirection = lightDirection.normalize();
              var lightHitInfo = {t0:INFINITY, t1:INFINITY};

              for(var j=0; j<elementsLen; j++)
              {
                  if(i != j) {
                     if(elements[j].intersect(intersectionPoint.add(intersectionNormal.multiply(bias)), lightDirection, lightHitInfo)) {
                          transmission.x = 0;
                          transmission.y = 0;
                          transmission.z = 0;
                          break;
                      }
                  }

              }

              var lightRatio = Math.max(0, intersectionNormal.dot(lightDirection));

              surfaceColor = surfaceColor.add(mat.surfaceColor.product(transmission).product(lightMat.emissionColor.multiply(lightRatio)));
          }
      }

      surfaceColor = surfaceColor.add(mat.emissionColor);
      return surfaceColor;
  }


    var p = new Parallel(newRequests, 
      {evalPath:'http://localhost:5500/js/eval.js '}, 
      {maxWorkers: 7}
      );

    function log() { 
      console.log("done");
   };

    function rayTrace(request) {

      var rayOrigin = request[1];
      let scene = Scene2;
      let raytracer = RayTracer;
      console.log(raytracer);
      var c = RayTracer.trace(rayOrigin, request, scene.getElements());
  
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
   };

   p.require(Pixel).require(Scene).require(Scene2).require(RayTracer);
   p.map(rayTrace).then(log);

 }


	age(amount, items) 
  {
		for (var i = 0; i < items.length; i++) 
    {
      		items[i].age += amount;
    	}
	}


  getCacheUsage() 
  {
    var used = 0.0;
    for (var i = 0; i < this.cacheSize; i++) 
    {
        if (this.cache[i].pixel !== null) used++;
    }
    return used / this.cacheSize;
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // Frame drawing
  //
  /////////////////////////////////////////////////////////////////////////////
	getReprojectionFrame(colorBuffer) 
  {
		var pixelIndex = 0;
		var color;
		var pixel;
		for (var y = this.camera.scope.y - 1; y >= 0; y--) 
    {
			for (var x = 0; x < this.camera.scope.x; x++, pixelIndex++) 
      {
				pixel = this.getPixel(x + 1, y + 1);

				if (pixel.element != null) 
        {
					color = pixel.element.color;
					colorBuffer[pixelIndex] =
					this.alphaChannel | // alpha
					(color.b << 16) | // blue
					(color.g << 8) | // green
					color.r; // red
				} 
				else 
        {
					colorBuffer[pixelIndex] = this.blackColorInt;
				}
			}
		}
	}

	getColorFrame(colorBuffer) 
  {
		var pixelIndex = 0;
		var color;
		var pixel;
		for (var y = this.camera.scope.y - 1; y >= 0; y--) 
    {
			for (var x = 0; x < this.camera.scope.x; x++, pixelIndex++) 
      {
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

	getPriorityFrame(colorBuffer) 
  {
		var pixelIndex = 0;
		var pixel;
		for (var y = this.camera.scope.y - 1; y >= 0; y--) 
    {
			for (var x = 0; x < this.camera.scope.x; x++, pixelIndex++) 
      {
				pixel = this.getPixel(x + 1, y + 1);
				colorBuffer[pixelIndex] =
					this.alphaChannel | // alpha
					(pixel.priority << 16) | // blue
					(pixel.priority << 8) | // green
					pixel.priority; // red
			}
		}
	}

	getSamplingFrame(colorBuffer) 
  {
		var pixelIndex = 0;
		var pixel;
		for (var y = this.camera.scope.y - 1; y >= 0; y--) 
    {
			for (var x = 0; x < this.camera.scope.x; x++, pixelIndex++) 
      {
				pixel = this.getPixel(x + 1, y + 1);

				if (pixel.sample === true) 
        {
					colorBuffer[pixelIndex] = this.whiteColorInt;
				} 
				else 
        {
					colorBuffer[pixelIndex] = this.blackColorInt;
				}
			}
		}
	}
}