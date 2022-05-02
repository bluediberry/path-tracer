/**
 * @class Driver
 */

 import Vector3 from './Vector3.js'
 import TPixel from './Pixel.js'
 import TPixel2D from './Pixel2D.js'
 import Element from './Element.js'
 import TRequests from './Requests.js'
 import TSample from './Sample.js'
import Color from './Color.js'



/////////////////////////////////////////////////////////////////////////////
export default class Driver {
	// CCamera Temp,char HostAddress,int HostPort,int MaxSamplesPerFrame,int MaxRequests
	constructor(width, height, raytracer, camera) {

		this.width = width;
		this.height = height;
		this.coords = [];

		this.Cache = undefined;	

		this.Buffer = [];	
		this.PixelsToSample = undefined;
		this.AddressY = undefined;
		
		this.CacheSize = 0;	
		this.CachePointer=0;
		this.TotalPriority=0;
		this.NumberOfSamples=0;
		this.Threshold=0;

		this.MaximumSamplesPerFrame = width*height/16;
		this.MaxRequestsBuffer = 900;
		
		this.InterpolationRandom = 5;
		this.InterpolationZero = 20;

		this.SampleCount = 0;
		this.ColorComponents=3;
		
		this.CacheFactor = 1.5;
		this.DepthThreshold=1E+06;	
			
		this.AgeFactor = 1;	

		this.InterpolationZero=0;
		this.MinimumRadiance=0.00001; // 5.58569E-07;   // 10E-04 is minimum luminance of human eye

		//this.ToneMap=new CToneMapping(this,true);
		//this.Connection=new CConnection();        	
		this.ReqCurrent = 0
		this.Requests = [];
		for (var i = 0; i < this.MaxRequestsBuffer; i++) {
			this.Requests[i] = new TRequests();
		}

		/*this.ASocket=Connection.GetSocket();
		this.AStart=ReqStart;
		this.ACurrent=ReqCurrent;
		this.ARequests=Requests;
		this.AEye=Eye;	*/

		/*this.Camera=Temp;
		this.Scope=Camera.GetScope();*/
		this.FillHoles=false;

		this.Priorities = new Array();

		this.raytracer = raytracer;

		this.camera = camera;


	}
	/////////////////////////////////////////////////////////////////////////////
	free (variable) {
		variable = null;
	} 
	/////////////////////////////////////////////////////////////////////////////
	destroy() {
		if (this.AddressY != null)
			this.free(this.AddressY);

		if (this.Buffer != null)
			this.free(this.Buffer);

		if (this.PixelsToSample != null)
			this.free(this.PixelsToSample);	

		if (this.Cache != null)
			this.free(Cache);

		if (this.ToneMap != null)
			this.free(this.ToneMap);

		if (Connection != null)
			this.free(this.Connection);
	}
	/////////////////////////////////////////////////////////////////////////////
	prepare() {
		this.AllocBuffers();
		this.AllocCache();
		this.AllocRendering();	
	}

	storePixel(xval, yval, age, resample, weight, array) {
        //array.push(x);
        //array.push(y);
		array.push({x: xval, y: yval, age: age, resample: resample, weight: weight});
    }

	/////////////////////////////////////////////////////////////////////////////
	AllocBuffers() {

		var x,y,i;

		if (this.Buffer != undefined) {
			this.free(this.Buffer);
		}
		var BufferSize = (this.width + 2) * (this.height + 2); // why +2
		this.Buffer = []; // (TPixel*)calloc(BufferSize,sizeof(TPixel));	
		for (i = 0; i < BufferSize; i++) {
			this.Buffer[i] = new TPixel(); //created Pixel class
			//this.storePixel(undefined, undefined, 0, false, 0, this.coords)
		}

		if (this.AddressY != undefined) {
			free(this.AddressY);
		}

		var AddressSize = (this.height);
		this.AddressY = [];
		for (i = 0; i < AddressSize; i++)
		{
			this.AddressY[i] = (i * (this.width));
		}
	
		for (y = 1; y <= this.height; y++) {	
			//var Pixel = this.GetPixel(1,y);
			var Pixel = this.GetPixel(1, y);
			for (x = 1; x <= this.width ; x++) {
				Pixel.weight = 1;
				//Pixel++;
			}
		}	
		
		for (x = 0; x <= this.width + 1; x++) {
			var Pixel = this.GetPixel(x,0);
			Pixel.weight = 0;
			Pixel = this.GetPixel(x, this.height + 1);
			Pixel.weight=0;
		}
		
		for (y = 0; y <= this.height+1; y++) {
			var Pixel = this.GetPixel(0, y);
			Pixel.weight = 0;
			Pixel = this.GetPixel(this.width + 1, y);
			Pixel.weight = 0;
		}
	}

	/////////////////////////////////////////////////////////////////////////////
	AllocCache() { //WIP
		if (this.Cache != undefined) {
			free(this.Cache);
		}
		this.CacheSize = (this.width * this.height * this.CacheFactor);
		this.Cache = [];
		var elem = new Element();
		for (var i = 0; i < this.CacheSize; i++) {
			//store x, y, age in elem array
			//this.storeElem(undefined, undefined, -1, elem);
			elem.age = -1;
			elem.pixel = null;

			this.Cache[i] = elem;
		}
	}

	/////////////////////////////////////////////////////////////////////////////
	AllocRendering() { //WIP
		if (this.PixelsToSample != undefined)
			free(this.PixelsToSample);
		
		this.PixelsToSample = [];
		var sample = new TSample();
		for (var i = 0; i < this.CacheSize; i++) {
			this.PixelsToSample[i] = sample;
		}
		// TODO: samplecount?
		this.SampleCount = this.PixelsToSample.length;		
	}

/////////////////////////////////////////////////////////////////////////////
    storeCoordinate(xval, yval, zval, age, resample, weight, array) {
        //array.push(x);
        //array.push(y);
		array.push({x: xval, 
					y: yval, 
					z: zval,
					age: age, 
					resample: resample, 
					weight: weight});
    }

/////////////////////////////////////////////////////////////////////////////
    getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

/////////////////////////////////////////////////////////////////////////////
	InitializeCache(width, height) { //WIP
	
		var Count = 0;	
		var CacheUsage = 0.0; 
		var InitialFill = 0.20;
		var x = 0;
		var y = 0;

	while(CacheUsage < InitialFill) //slows down a lot?
		{
			for(var i=0; i < this.MaximumSamplesPerFrame; i++){
				x = this.getRandomIntInclusive(0, width);
				y = this.getRandomIntInclusive(0, height);
				//store x, y, age, resample, weight in coords array
				// best way?
				//this.storeCoordinate(x, y, 0, 0, true, 0, this.coords);
				this.PixelsToSample[i].x = x;
				this.PixelsToSample[i].y = y;
			}
			this.RequestSamples(0);	//see	
			this.AgeCache(this.AgeFactor); //see
			//console.log("Cache usage: ", CacheUsage * 100.0);
			Count++;
			CacheUsage += 0.02;
		}
	
		//console.log(Count + " iterations to fill " + (InitialFill * 100.0) + "% of cache");
	}

	/////////////////////////////////////////////////////////////////////////////
	ResetBuffers(Changes) {

		for (var y=1; y <= this.this.height; y++)
		{		
			for (var x = 1; x <= this.this.width ; x++)
			{
				var Pixel = this.GetPixel(x, y);
				Pixel.Depth = DepthThreshold;
				Pixel.Element = null;
			}
		}
		return 0;
	}
	/////////////////////////////////////////////////////////////////////////////
	ReprojectFrame() {

		// Reproject every existing cache element

		var result = new Object();
		result.new = new TPixel2D();
		//var result = new TPixel2D();

		for (var i=0; i < this.CacheSize; i++) {		
			var elem = this.Cache[i];
			//var element = new Element();
			//elem = this.Cache[i];
			elem.pixel = null;

			// TODO: add clear to TPixel2D
			result.new.clear();
			result.depth = 10000000000000.0;
			if (this.camera.reprojectPixel(elem, result))
			{
				if ((result.x >= 1 ) && (result.x <= this.width ) && 
					(result.y >= 1 ) && (result.y <= this.height))
				{					
					var Pixel = this.GetPixel(result.x, result.y);
					if (result.depth < Pixel.Depth) {
						if (Pixel.Element != null) {
							// It seems that the element' hit atached to
							// this pixel is behind the current element' hit
							// So prematurelly age attached element 

							Pixel.Element.Age += this.AgeFactor;
							// And dump it
							this.FreeCacheElement(Pixel.Element);
						}

						this.EstablishLink(Pixel,Element);
						Pixel.Depth = Depth;
					}
					else {
						// Element's hit is behind closest hit
						// So prematurelly age attached element 
						Pixel.Element.Age += this.AgeFactor;
					}
				}
				else {
					// Element reprojected outside frame
					// Prematurelly age it ?
					Element.Age += (this.AgeFactor * 2);
				}
			}
			else {
				// Element reprojected outside frame and in oposite direction
				// Prematurelly age it ?
				Element.Age += (this.AgeFactor * 4);
			}
		}
	}
	/////////////////////////////////////////////////////////////////////////////
	DepthCulling() {

		var DepthMin=0.9, DepthMax=1.1;
		for (var y=1; y <= this.height; y++)
		{		
			for (var x=1; x<= this.width; x++)
			{
				var CenterPixel = this.GetPixel(x,y);			
				if (CenterPixel.element != null)
				{
					var DepthItems = 0;
					var DepthValue = 0.0;					

					// square around pixel (except center pixel). 
					// accumulate depths for existing elements. 
					for (var i=-1; i<=1; i++) {
						for (var j = -1; j <= 1; j++) {
							if (i != 0 && j != 0) {
								var Pixel = this.GetPixel(x + i, y + j);
								if (Pixel.element != null) {
									DepthValue += Pixel.depth;
									DepthItems++;
								}
							}					
						}
					}

					// any pixel around center with data?
					if (DepthItems != 0) {
						// average depth ratio between center and neighborhood
						DepthValue = DepthValue / (DepthItems * CenterPixel.depth);

						// depth ratio beyond threshold?
						if ((DepthValue < DepthMin) || (DepthValue > DepthMax))
						{
							// If neighborhood is recent than centerpixel 
							// ignore the depth cull: treat as if no point
							// is mapped to this pixel
							CenterPixel.element.age += (this.AgeFactor * 10);
							this.FreeCacheElement(CenterPixel.element);																
						}					
					}
				}
			}
		}	
	}
	/////////////////////////////////////////////////////////////////////////////
	Interpolation() {					
		var Colinear=2;
		var Corner=1;

		// Reset priority data
		// TODO: 400?
		var max = 400;
		for (var i = 0; i < 3; i++) {
			this.Priorities[i] = new Array();
			for (var j = 0; j < max; j++) {
				this.Priorities[i][j] = 0;
			}		
		}

		// Reset Floyd-steinberg 
		// threshold data values
		
		this.TotalPriority = 0;
		this.NumberOfSamples = 0;

		var Completeness = 0.0;
		
		// Now that depth are consistent
		// atribute colors to the pixels
			
		for (var y = 1; y <= this.height; y++) {		
			var Pixel = this.GetPixel(1,y);
			for (var x = 1; x <= this.width; x++) {
				if (Pixel.element != null)
					//this.ColorCopy(Pixel.element.color, Pixel.color);

				Pixel++;
			}
		}

		// Interpolate color values 
		// to aproximate empty pixels
		
		for (var y = 1; y <= this.height; y++) {
			
			for (var x = 1; x <= this.width; x++) {			
			
				var CenterPixel = this.GetPixel(x, y);
				if (CenterPixel.element==null) {
					var Age = 0.0;				
					var Weight = 0.0;
					var ColorItems = 0;
					var ColorWeight = 0.0;
					var color = [{r: 0, g: 0, b: 0}];				
					//this.ColorNull(Color);

					var Pixel;
					
					Pixel = this.GetPixel(x-1,y-1);
					Weight += Pixel.weight;
					if (Pixel.element != null) {
						this.ColorAddMult(Pixel.color, Corner, color);
						Age += Pixel.element.age;
						ColorWeight += Corner;
						ColorItems++;
					}				
					Pixel = this.GetPixel( x ,y-1);
					Weight += Pixel.weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.color, Colinear, color);
						Age += Pixel.element.age;
						ColorWeight += Colinear;
						ColorItems++;
					}
					Pixel= this.GetPixel(x+1,y-1);
					Weight += Pixel.weight;
					if (Pixel.element != null) {				
						this.ColorAddMult(Pixel.color, Corner, color);
						Age += Pixel.element.age;
						ColorWeight += Corner;
						ColorItems++;
					}				
					Pixel = this.GetPixel(x-1, y );
					Weight+= Pixel.weight;
					if (Pixel.element != null) {
						this.ColorAddMult(Pixel.color, Colinear, color);
						Age+=Pixel.element.age;
						ColorWeight += Colinear;
						ColorItems++;
					}
					Pixel += this.GetPixel(x+1, y);
					Weight+=Pixel.weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.color, Colinear, color);
						Age += Pixel.element.age;
						ColorWeight += Colinear;
						ColorItems++;
					}

					Pixel= this.GetPixel(x-1,y+1);
					Weight += Pixel.weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.color, Corner, color);
						Age += Pixel.element.age;
						ColorWeight += Corner;
						ColorItems++;
					}
					Pixel= this.GetPixel( x ,y+1);
					Weight+=Pixel.weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.color, Colinear, color);
						Age += Pixel.element.age;
						ColorWeight += Colinear;
						ColorItems++;
					}
					Pixel = this.GetPixel(x+1,y+1);
					Weight += Pixel.weight;
					if (Pixel.Element != null) {					
						this.ColorAddMult(Pixel.color, Corner, color);
						Age += Pixel.element.age;
						ColorWeight += Corner;
						ColorItems++;										
					}														
					
					if (ColorItems > 0) {
						CenterPixel.color.r = color.r/ColorWeight;
						CenterPixel.color.g = color.g/ColorWeight;
						CenterPixel.color.b = color.b/ColorWeight;

						// Get a priority based on how many of 
						// their immediate neighbors had a point 
						// map to them			

						CenterPixel.priority = (Age / ColorItems);

						CenterPixel.priority += (this.InterpolationZero + (Weight-ColorItems) * InterpolationRandom);
						this.Priorities[0][CenterPixel.priority]++; //interpolated = 0
						this.TotalPriority += CenterPixel.priority;
						this.NumberOfSamples++;
					}
					else {
						CenterPixel.color.r = 0.0;
						CenterPixel.color.g = 0.0;
						CenterPixel.color.b = 0.0;					

						// A pixel without a point and whose neighbors 
						// also do not have a point are given the
						// maximum priority (255)

						CenterPixel.priority = 255;
						this.Priorities[1][CenterPixel.priority]++; // urgent = 1
						//this.Priorities[CenterPixel.priority] = "URGENT"; //??
						this.TotalPriority += CenterPixel.priority;					
						this.NumberOfSamples++;
					}				
				}
				else
				{
					// Pixels which had a point map to them 
					// have a priority equal to half the 
					// point's age
					CenterPixel.priority = (CenterPixel.element.age >> 1);
					if (CenterPixel.priority > 0) {
						TotalPriority += CenterPixel.priority;
						// NumberOfSamples++;				
					}

					this.Priorities[2][CenterPixel.priority]++; // sampled = 2
					//this.Priorities[CenterPixel.priority] = "SAMPLED";

					Completeness += 1.0;
				}			
				// Add to total frame priority					
			}
		}
		
		// By this time all pixels are mapped to the render cache		
		Completeness = 100.0 * (Completeness / (this.width * this.height));
		console.log("Image completeness is: " + Completeness);
	}
	/////////////////////////////////////////////////////////////////////////////
	DirectSamples() {
		
		var Threshold = 255;
		var Count = this.Priorities[1][255]; //urgent	
		while (Count < this.MaximumSamplesPerFrame)	
		{
			var Test = this.Priorities[0][Threshold] + this.Priorities[2][Threshold];

			Count += Test;
			if (Count < this.MaximumSamplesPerFrame) {			
				Threshold--;
			}				
		}	

		var CxPlus2 = this.width + 2;	
		var SizeFactor = 1.0;
		if (Threshold == 255)
		{
			SizeFactor = Count / this.MaximumSamplesPerFrame;
			if (SizeFactor < 1.2)
				SizeFactor = 1.0;
		}

		var Occurence = 0.0;
		// TODO: sample count?
		//this.SampleCount = (this.PixelsToSample[0]);
		//this.SampleCount = this.PixelsToSample.length;
		for (var y=1; y <= this.height; y++)
		{		
			if ((y % 2) == 0) {			

				for (var x=1; x <= this.width ; x++) {				
					var Pixel = this.GetPixel(x, y);
					if (Pixel.priority >= Threshold) {
						if (Occurence >= SizeFactor) {
							Occurence = Occurence - SizeFactor;
							this.MarkForSample( Pixel, +1, CxPlus2, x, y);
						}
						else
						Occurence = Occurence + 1.0;
					}								
					else {
						Pixel.sampled = false;
					}
				}			
			}
			else {
				for (x = this.width ; x > 0; x--) {
					var Pixel = this.GetPixel(x, y);
					if (Pixel.priority >= Threshold) {
						if (Occurence >= SizeFactor) {
							Occurence = Occurence - SizeFactor;
							this.MarkForSample(Pixel, -1, CxPlus2, x, y);
						}
						else
						Occurence = Occurence + 1.0;					
					}				
					else {
						Pixel.sampled = false;
					}
				}
			}						
		}		
	}
	/////////////////////////////////////////////////////////////////////////////
	RequestSamples(FrameCount) { //WIP

		var index = 0;
		var colorDepth = 4;
        var buffer = new ArrayBuffer(this.width*this.height*colorDepth);
        var bufferView = new Uint32Array(buffer);
        var invWidth = 1/this.width;
        var invHeight = 1/this.height;
        var fov = 30;
        var aspectRatio = this.width/this.height;
        var angle = Math.tan(Math.PI * 0.5 * fov / 180);

		if (FrameCount % 10 == 0)
			console.log("Frame " + FrameCount + ": requesting " + (this.SampleCount - index)  + " samples");
		
		var rayDir = [];	
		//var Sample = new TSample();

		// TODO: AEye?
		//D3_VecCopy(Camera.Eye,AEye);
		
		// TODO: sample count?
		for(var i = 0; i < this.SampleCount; i++) {

			var sample = this.PixelsToSample[i];
			if (sample.resample){
				//this.camera.ComputeShooting(Sample.hit ,RayDir);
				rayDir = sample.hit;
				rayDir.normalize();
			}	
			else {
				var xx = (2 * ((sample.x + 0.5) * invWidth) - 1) * angle * aspectRatio;
                var yy = (1 - 2 * ((sample.y + 0.5) * invHeight)) * angle;
                rayDir = new Vector3(xx, yy, -1);
                rayDir.normalize();
			}
				//this.camera.ComputeShooting(Sample.x, Sample.y, RayDir);
				//rayDir = sample.x.subtract(sample.y);

			this.AddRequest(sample, rayDir);
			// pedir ao raytracer o pixel para o valor da sample (nova)
			var color = this.raytracer.requestPixel(rayDir, color);
			this.Requests[this.ReqCurrent].color.r = color.r;
			this.Requests[this.ReqCurrent].color.g = color.g;
			this.Requests[this.ReqCurrent].color.b = color.b;
			//this.computeFrame(color);
			var pixelIndex = this.width*(sample.y + 1) - (this.width - sample.x);
			bufferView[pixelIndex] =
			(255   << 24) |	// alpha
			(color.b << 16) |	// blue
			(color.g <<  8) |	// green
			color.r;		// red

		}
	}
	/////////////////////////////////////////////////////////////////////////////
	AddRequest(sample /* TSample */, rayDir /* TVector3D */) { //WIP

		this.Requests[this.ReqCurrent].x = rayDir.x;
		this.Requests[this.ReqCurrent].y = rayDir.y;
		this.Requests[this.ReqCurrent].z = rayDir.z;
		this.Requests[this.ReqCurrent].resample = sample.resample;
		this.Requests[this.ReqCurrent].color.r = 0.0;
		this.Requests[this.ReqCurrent].color.g = 0.0;
		this.Requests[this.ReqCurrent].color.b = 0.0;

		if (this.ReqCurrent < this.MaxRequestsBuffer - 1)
			this.ReqCurrent++;
		else
			this.ReqCurrent = 0;
	}
	/////////////////////////////////////////////////////////////////////////////
	AgeCache(Step) { //WIP
		for(var i = 0; i < this.CacheSize; i++){
			this.Cache[i].age += Step;
		}
		
		/*for (var i=0; i < this.CacheSize; i++) {
			this.Cache[i].Age += Step;
		}*/
	}
	/////////////////////////////////////////////////////////////////////////////
	GetCacheUsage() {	
		
		var Used = 0.0;
		for (var i=0; i < this.CacheSize; i++) {		
			if (Element.pixel != null)
				Used++;

		}
		return Used/(1.0 * this.CacheSize);
	}
	/////////////////////////////////////////////////////////////////////////////
	//
	// Frame drawing 
	//
	/////////////////////////////////////////////////////////////////////////////
	ComputeReprojectionFrame(colorBuffer /* TColor */ ) {
		
		for (var y=0; y < this.height; y++) {	
			for (var x = 0; x < this.width; x++) {
				//var pixelIndex = this.AddressY[y] + x;
				var pixelIndex = this.width*(y + 1) - (this.width - x);

				var Pixel = this.GetPixel(x, y);	
				if (Pixel.element != null) {
					this.SetColor(colorBuffer, pixelIndex, Pixel.element.color);
				}
				else {
					this.SetColor(colorBuffer, pixelIndex);
				}
			}
			// Index+=ColorComponents* Scope->x ;
		}
	}
	/////////////////////////////////////////////////////////////////////////////
	computeFrame(colorBuffer /* TColor */) {
		
		//this.ToneMap.MapColors();
		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				//var pixelIndex = this.AddressY[y] + x;
				var pixelIndex = this.width*(y + 1) - (this.width - x);

				var Pixel = this.GetPixel(x, y);
				this.SetColor(colorBuffer, pixelIndex, Pixel.color);
			}				
		}		
	}
	/////////////////////////////////////////////////////////////////////////////
	computePriorityFrame(colorBuffer /* TColor */) {

		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				//var pixelIndex = this.AddressY[y] + x;
				var pixelIndex = this.width*(y + 1) - (this.width - x);

				var Pixel = this.GetPixel(x, y);
				this.SetColor(colorBuffer, pixelIndex, Pixel.priority);
			}
		}		
	}
	/////////////////////////////////////////////////////////////////////////////
	computeSamplingFrame(colorBuffer /* TColor */) {
		
		for (var y = 0; y < this.height; y++) {
			for (var x = 0; x < this.width; x++) {
				//var pixelIndex = this.AddressY[y] + x;
				var pixelIndex = this.width*(y + 1) - (this.width - x);

				var Pixel = this.GetPixel(x, y);
				if (Pixel.sampled == true)
					SetColor(colorBuffer, pixelIndex,255);
				else
					SetColor(colorBuffer, pixelIndex,0);

			}		
		}	
	}	

	/////////////////////////////////////////////////////////////////////////////
	SetPerceptuallity(Temp) {
		this.ToneMap.SetPerceptuallity(Temp);
	}
	/////////////////////////////////////////////////////////////////////////////
	GetPerceptuallity() {
		return this.ToneMap.GetPerceptuallity();
	}
/////////////////////////////////////////////////////////////////////////////
 SetFillHoles(Temp)
{
	this.FillHoles = Temp;
}
	/////////////////////////////////////////////////////////////////////////////
  GetFillHoles()
{
	return this.FillHoles;
}

	/////////////////////////////////////////////////////////////////////////////
	SetColor(colorBuffer, pixelIndex, r, g, b)
{
	colorBuffer[pixelIndex] =
				(255 << 24) |	// alpha
				(b << 16) |	// blue
				(g << 8) |	// green
				r;		// red
}
	/////////////////////////////////////////////////////////////////////////////
	SetColor(colorBuffer, pixelIndex, value)
{
		this.setColor(colorBuffer, value);
}
	/////////////////////////////////////////////////////////////////////////////
	SetColor(colorBuffer, pixelIndex, color)
{
		colorBuffer[pixelIndex] =
			(255 << 24) |	// alpha
			(color.b << 16) |	// blue
			(color.g << 8) |	// green
			color.r;		// red
}
	/////////////////////////////////////////////////////////////////////////////
	SetColor(colorBuffer, pixelIndex)
{
		colorBuffer[pixelIndex] =
			(255 << 24) |	// alpha
			(0 << 16) |	// blue
			(0 << 8) |	// green
			0;		// red
}
	/////////////////////////////////////////////////////////////////////////////
	AllocCacheElement(Pixel)
{
		var	Stop,
		Start,
		Index,
		MaxAge = -1;

	Stop = this.CachePointer + 8;
	if (Stop > CacheSize)
		Stop = 8;

	Index = -1;
	MaxAge = -1;
	Start = Stop - 8;
	while (Start < Stop) {
		if (!this.Cache[Start].Pixel) {
			EstablishLink(Pixel,(this.Cache[Start]));
			this.CachePointer = Stop;
			return;
		}
		else
			if (this.Cache[Start].Age > MaxAge) {
				Index = Start;
				MaxAge = this.Cache[Start].Age;
			}
		Start++;
	}

	if ((this.Cache[Index].Pixel) &&
		(this.Cache[Index].Pixel.element)) {
		FreeCacheElement(this.Cache[Index].Pixel.element);
	}

	this.Cache[Index].hit.x = -this.MAX_REAL;
	this.Cache[Index].hit.y = -this.MAX_REAL;
	this.Cache[Index].hit.z = -this.MAX_REAL;
	EstablishLink(Pixel,(this.Cache[Index]));

	CachePointer = Stop;
}
	/////////////////////////////////////////////////////////////////////////////
	FreeCacheElement(Temp)
{
	Temp.pixel.element = NULL;
	Temp.pixel = NULL;
}
	/////////////////////////////////////////////////////////////////////////////
	EstablishLink(Pixel, Element)
{
	Pixel.element = Element;
	Element.pixel = Pixel;
}
	/////////////////////////////////////////////////////////////////////////////
	GetPixel(x, y)
	{
		var pixelIndex = this.width*(y + 1) - (this.width - x);
		//var pixelIndex = this.AddressY[y] + x;
		return (this.Buffer[pixelIndex]);
	}
	/////////////////////////////////////////////////////////////////////////////
	MarkForSample(Pixel, NextIndex, NextLine, x, y)
{
	Pixel.sampled = true;

	// Check if resampling 
	// and add to sampling
    
	this.element = Pixel.element;

	if (this.element) {
		//this.SampleCount.resample = true;
		this.PixelsToSample[x].resample = true;
		//D3_VecCopy(this.element.hit, this.SampleCount.hit);
		this.element.hit.copy(this.PixelsToSample[x].hit)
		//this.element.color.copyc(Pixel.color);
		Pixel.color = this.element.color;
	}
	else {
		//this.SampleCount.resample = false;
		this.PixelsToSample[x].resample = true;
	}

	this.PixelsToSample[x].x = x;
	this.PixelsToSample[x].y = y;
	//this.SampleCount++;

		// Distribute error

		var Half = (Pixel.priority - this.Threshold) >> 1;
	if (Half) {
		(Pixel + NextIndex).priority += Half;
		(Pixel + NextLine).priority += Half;
	}
}

	nextFrame(width, height, coords, driver) {
		this.InitializeCache(width, height, coords);

		this.ReprojectFrame();

		this.DepthCulling();

		this.Interpolation();

		this.DirectSamples();

		this.RequestSamples();

		this.AgeCache();

	}


}
