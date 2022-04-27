/**
 * @class Driver
 */

 import Vector3 from './Vector3.js'
 import TPixel from './Pixel.js'
 import TPixel2D from './Pixel2D.js'



/////////////////////////////////////////////////////////////////////////////
export default class Driver {
	// CCamera Temp,char HostAddress,int HostPort,int MaxSamplesPerFrame,int MaxRequests
	constructor(width, height, raytracer, camera) {

		this.width = width;
		this.height = height;
		this.coords = [];

		this.Cache = undefined;	

		this.Buffer = undefined;	
		this.PixelsToSample = undefined;
		this.AddressY = undefined;
		
		this.CacheSize=0;	
		this.CachePointer=0;
		this.TotalPriority=0;
		this.NumberOfSamples=0;
		this.Threshold=0;

		this.MaximumSamplesPerFrame = width*height/16;
		
		this.InterpolationRandom = 5;
		this.InterpolationZero = 20;

		this.SampleCount=0;
		this.ColorComponents=3;
		
		this.CacheFactor = 1.5;
		this.DepthThreshold=1E+06;	
			
		this.AgeFactor = 1;	

		this.InterpolationZero=0;
		this.MinimumRadiance=0.00001; // 5.58569E-07;   // 10E-04 is minimum luminance of human eye

		//this.ToneMap=new CToneMapping(this,true);
		//this.Connection=new CConnection();        	

		/*this.Requests=new Array();
		for (var i=0; i<MAX_REQUEST_BUFFER; i++) {
			this.Requests[i] = new TRequest();
		}*/

		/*this.ASocket=Connection.GetSocket();
		this.AStart=ReqStart;
		this.ACurrent=ReqCurrent;
		this.ARequests=Requests;
		this.AEye=Eye;	*/

		/*this.Camera=Temp;
		this.Scope=Camera.GetScope();*/
		this.FillHoles=false;

		this.Priorities = new Array();

		this.camera = camera;

		this.rayTracer = this.rayTracer;

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
		var BufferSize = (this.width + 2) * (this.height + 2);
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
    storeElem(xval, yval, age, array) {
		array.push({x: xval, y: yval, age: age});
    }

	/////////////////////////////////////////////////////////////////////////////
	AllocCache() { //WIP
		if (this.Cache != undefined) {
			free(this.Cache);
		}
		this.CacheSize = (this.width * this.height * this.CacheFactor);
		this.Cache = {};
		for (var i = 0; i < this.CacheSize; i++) {
			var elem = [];
			//store x, y, age in elem array
			this.storeElem(undefined, undefined, -1, elem);
			this.Cache[i] = elem;
		}
	}

	/////////////////////////////////////////////////////////////////////////////
	storeSample(xval, yval, resample, array) {
		array.push({x: xval, y: yval, resample: resample});
	}

	/////////////////////////////////////////////////////////////////////////////
	AllocRendering() { //WIP
		if (this.PixelsToSample != undefined)
			free(this.PixelsToSample);
		
		this.PixelsToSample = [];
		for (var i = 0; i < this.CacheSize; i++) {
			//var sample = [];
			//allocating with x, y, bool resample in sample array
			this.storeSample(undefined, undefined, false, this.PixelsToSample);
			//this.PixelsToSample[i] = sample;
		}
		// TODO: samplecount?
		// this.SampleCount = &(PixelsToSample[0]);		
	}

/////////////////////////////////////////////////////////////////////////////
    storeCoordinate(xval, yval, age, resample, weight, array) {
        //array.push(x);
        //array.push(y);
		array.push({x: xval, y: yval, age: age, resample: resample, weight: weight});
    }

/////////////////////////////////////////////////////////////////////////////
    getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

/////////////////////////////////////////////////////////////////////////////
	InitializeCache(width, height, coords) { //WIP
	
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
				this.storeCoordinate(x, y, 0, true, 0, this.coords);
			}
			//this.RequestSamples(0);	//see	
			this.AgeCache(this.AgeFactor, coords); //see
			//console.log("Cache usage: ", CacheUsage * 100.0);
			Count++;
			CacheUsage += 0.02;
		}
	
		//console.log(Count + " iterations to fill " + (InitialFill * 100.0) + "% of cache");
	}

	/////////////////////////////////////////////////////////////////////////////
	ResetBuffers(Changes) {

		for (var y=1; y <= this.Scope.y; y++)
		{		
			for (var x = 1; x <= this.Scope.x ; x++)
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

		//var result = new Object();
		//result.new = new TPixel2D();
		var result = new TPixel2D();

		for (var i=0; i < this.CacheSize; i++) {		
			var Element = this.Cache[i];
			Element.Pixel = null;

			// TODO: add clear to TPixel2D
			result.clear();
			result.depth = 10000000000000.0;
			if (this.camera.reprojectPixel(Element, result))
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

							Pixel.Element.Age += AgeFactor;
							// And dump it
							this.FreeCacheElement(Pixel.Element);
						}

						this.EstablishLink(Pixel,Element);
						Pixel.Depth = Depth;
					}
					else {
						// Element's hit is behind closest hit
						// So prematurelly age attached element 
						Pixel.Element.Age += AgeFactor;
					}
				}
				else {
					// Element reprojected outside frame
					// Prematurelly age it ?
					Element.Age += (AgeFactor * 2);
				}
			}
			else {
				// Element reprojected outside frame and in oposite direction
				// Prematurelly age it ?
				Element.Age += (AgeFactor * 4);
			}
		}
	}
	/////////////////////////////////////////////////////////////////////////////
	DepthCulling() {

		var DepthMin=0.9, DepthMax=1.1;
		for (var y=1; y<= this.Scope.y; y++)
		{		
			for (var x=1; x<= this.Scope.x ; x++)
			{
				var CenterPixel = this.GetPixel(x,y);			
				if (CenterPixel.Element != null)
				{
					var DepthItems = 0;
					var DepthValue = 0.0;					

					// square around pixel (except center pixel). 
					// accumulate depths for existing elements. 
					for (var i=-1; i<=1; i++) {
						for (var j = -1; j <= 1; j++) {
							if (i != 0 && j != 0) {
								var Pixel = this.GetPixel(x + i, y + j);
								if (Pixel.Element != null) {
									DepthValue += Pixel.Depth;
									DepthItems++;
								}
							}					
						}
					}

					// any pixel around center with data?
					if (DepthItems != 0) {
						// average depth ratio between center and neighborhood
						DepthValue = DepthValue / (DepthItems * CenterPixel.Depth);

						// depth ratio beyond threshold?
						if ((DepthValue < DepthMin) || (DepthValue > DepthMax))
						{
							// If neighborhood is recent than centerpixel 
							// ignore the depth cull: treat as if no point
							// is mapped to this pixel
							CenterPixel.Element.Age += (AgeFactor * 10);
							this.FreeCacheElement(CenterPixel.Element);																
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
		for (var i=0; i<3; i++) {
			this.Priorities[i] = new Array();
			for (var j=0; j< max; j++) {
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
			
		for (var y=1; y<= this.Scope.y; y++) {		
			var Pixel = this.GetPixel(1,y);
			for (var x=1; x<= this.Scope.x ; x++) {
				if (Pixel.Element != null)
					this.ColorCopy(Pixel.Element.Color, Pixel.Color);

				Pixel++;
			}
		}

		// Interpolate color values 
		// to aproximate empty pixels
		
		for (var y=1; y<= this.Scope.y; y++) {
			
			for (var x=1; x<= this.Scope.x ; x++) {			
			
				var CenterPixel = this.GetPixel(x, y);
				if (CenterPixel.Element==null) {
					var Age = 0.0;				
					var Weight = 0.0;
					var ColorItems = 0;
					var ColorWeight = 0.0;
					var Color = new TColor3();				
					this.ColorNull(Color);

					var Pixel;
					
					Pixel = this.GetPixel(x-1,y-1);
					Weight += Pixel.Weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.Color, Corner, Color);
						Age += Pixel.Element.Age;
						ColorWeight += Corner;
						ColorItems++;
					}				
					Pixel = this.GetPixel( x ,y-1);
					Weight += Pixel.Weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.Color,Colinear,Color);
						Age += Pixel.Element.Age;
						ColorWeight += Colinear;
						ColorItems++;
					}
					Pixel= this.GetPixel(x+1,y-1);
					Weight += Pixel.Weight;
					if (Pixel.Element != null) {				
						this.ColorAddMult(Pixel.Color,Corner,Color);
						Age += Pixel.Element.Age;
						ColorWeight += Corner;
						ColorItems++;
					}				
					Pixel = this.GetPixel(x-1, y );
					Weight+= Pixel.Weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.Color,Colinear,Color);
						Age+=Pixel.Element.Age;
						ColorWeight += Colinear;
						ColorItems++;
					}
					Pixel += this.GetPixel(x+1, y);
					Weight+=Pixel.Weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.Color,Colinear,Color);
						Age += Pixel.Element.Age;
						ColorWeight += Colinear;
						ColorItems++;
					}

					Pixel= this.GetPixel(x-1,y+1);
					Weight += Pixel.Weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.Color,Corner,Color);
						Age += Pixel.Element.Age;
						ColorWeight += Corner;
						ColorItems++;
					}
					Pixel= this.GetPixel( x ,y+1);
					Weight+=Pixel.Weight;
					if (Pixel.Element != null) {
						this.ColorAddMult(Pixel.Color,Colinear,Color);
						Age += Pixel.Element.Age;
						ColorWeight += Colinear;
						ColorItems++;
					}
					Pixel = this.GetPixel(x+1,y+1);
					Weight += Pixel.Weight;
					if (Pixel.Element != null) {					
						this.ColorAddMult(Pixel.Color,Corner,Color);
						Age += Pixel.Element.Age;
						ColorWeight += Corner;
						ColorItems++;										
					}														
					
					if (ColorItems > 0) {
						CenterPixel.Color.r=Color.r/ColorWeight;
						CenterPixel.Color.g=Color.g/ColorWeight;
						CenterPixel.Color.b=Color.b/ColorWeight;

						// Get a priority based on how many of 
						// their immediate neighbors had a point 
						// map to them			

						CenterPixel.Priority = (Age / ColorItems);

						CenterPixel.Priority += (this.InterpolationZero + (Weight-ColorItems) * InterpolationRandom);
						this.Priorities[INTERPOLATED][CenterPixel.Priority]++;
						this.TotalPriority += CenterPixel.Priority;
						this.NumberOfSamples++;
					}
					else {
						CenterPixel.Color.r = 0.0;
						CenterPixel.Color.g = 0.0;
						CenterPixel.Color.b = 0.0;					

						// A pixel without a point and whose neighbors 
						// also do not have a point are given the
						// maximum priority (255)

						CenterPixel.Priority = 255;
						this.Priorities[URGENT][CenterPixel.Priority]++;
						this.TotalPriority += CenterPixel.Priority;					
						this.NumberOfSamples++;
					}				
				}
				else
				{
					// Pixels which had a point map to them 
					// have a priority equal to half the 
					// point's age
					CenterPixel.Priority = (CenterPixel.Element.Age >> 1);
					if (CenterPixel.Priority > 0) {
						TotalPriority += CenterPixel.Priority;
						// NumberOfSamples++;				
					}

					this.Priorities[SAMPLED][CenterPixel.Priority]++;
					Completeness += 1.0;
				}			
				// Add to total frame priority					
			}
		}
		
		// By this time all pixels are mapped to the render cache		
		Completeness = 100.0 * (Completeness / (this.Scope.x * this.Scope.y));
		console.log("Image completeness is: " + Completeness);
	}
	/////////////////////////////////////////////////////////////////////////////
	DirectSamples() {
		
		var Threshold = 255;
		var Count = this.Priorities[URGENT][255];	
		while (Count < this.MaximumSamplesPerFrame)	
		{
			var Test = Priorities[INTERPOLATED][Threshold] + Priorities[SAMPLED][Threshold];
			Count += Test;
			if (Count < MaximumSamplesPerFrame) {			
				Threshold--;
			}				
		}	

		var CxPlus2 = this.Scope.x + 2;	
		var SizeFactor = 1.0;
		if (Threshold == 255)
		{
			SizeFactor = Count / this.MaximumSamplesPerFrame;
			if (SizeFactor < 1.2)
				SizeFactor = 1.0;
		}

		var Occurence = 0.0;
		// TODO: sample count?
		this.SampleCount=(this.PixelsToSample[0]);
		for (var y=1; y <= Scope.y; y++)
		{		
			if ((y % 2) == 0) {			

				for (var x=1; x <= Scope.x ; x++) {				
					var Pixel = this.GetPixel(x, y);
					if (Pixel.Priority >= Threshold) {
						if (Occurence >= SizeFactor) {
							Occurence = Occurence - SizeFactor;
							this.MarkForSample( Pixel, +1, CxPlus2, x, y);
						}
						else
						Occurence = Occurence + 1.0;
					}								
					else {
						Pixel.Sampled = false;
					}
				}			
			}
			else {
				for (x = Scope.x ; x > 0; x--) {
					var Pixel = this.GetPixel(x, y);
					if (Pixel.Priority >= Threshold) {
						if (Occurence >= SizeFactor) {
							Occurence = Occurence - SizeFactor;
							this.MarkForSample(Pixel, -1, CxPlus2, x, y);
						}
						else
						Occurence = Occurence + 1.0;					
					}				
					else {
						Pixel.Sampled = false;
					}
				}
			}						
		}		
	}
	/////////////////////////////////////////////////////////////////////////////
	RequestSamples(FrameCount) { //WIP

		var index = 0;

		if (FrameCount % 10 == 0)
			console.log("Frame " + FrameCount + ": requesting " + (this.SampleCount - index)  + " samples");
		
		//var RayDir = new TVector3D();	
		//var Sample = new TSample();

		// TODO: AEye?
		//D3_VecCopy(Camera.Eye,AEye);
		
		// TODO: sample count?
		while (index < this.SampleCount) {

			var Sample = this.PixelsToSample[index];
			if (Sample.resample === true)
				Camera.ComputeShooting(Sample.Hit ,RayDir);
			else
				Camera.ComputeShooting(Sample.x, Sample.y, RayDir);

			AddRequest(Sample, RayDir);
			// pedir ao raytracer o pixel para o valor da sample (nova)

			index++;
		}
	}
	/////////////////////////////////////////////////////////////////////////////
	AddRequest(Sample /* TSample */, RayDir /* TVector3D */) { //WIP
	
		this.Requests[this.ReqCurrent].x=RayDir.x;
		this.Requests[this.ReqCurrent].y=RayDir.y;
		this.Requests[this.ReqCurrent].z=RayDir.z;
		this.Requests[this.ReqCurrent].Resample=Sample.Resample;
		this.Requests[this.ReqCurrent].Color.r=0.0;
		this.Requests[this.ReqCurrent].Color.g=0.0;
		this.Requests[this.ReqCurrent].Color.b=0.0;

		if (this.ReqCurrent < MAX_REQUEST_BUFFER - 1)
			this.ReqCurrent++;
		else
			this.ReqCurrent = 0;
	}
	/////////////////////////////////////////////////////////////////////////////
	AgeCache(Step, coords) { //WIP
		for(var i = 0; i < this.coords.length; i++){
			this.coords[i].age += Step;
		}
		
		/*for (var i=0; i < this.CacheSize; i++) {
			this.Cache[i].Age += Step;
		}*/
	}
	/////////////////////////////////////////////////////////////////////////////
	GetCacheUsage() {	
		
		var Used = 0.0;
		for (var i=0; i < this.CacheSize; i++) {		
			if (Element.Pixel != null)
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
		
		for (var y=0; y < Scope.y; y++) {	
			for (var x = 0; x < Scope.x; x++) {
				var pixelIndex = this.AddressY[y] + x;

				var Pixel = this.GetPixel(x, y);	
				if (Pixel.Element != null) {
					this.SetColor(colorBuffer, pixelIndex, Pixel.Element.Color);
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
		
		this.ToneMap.MapColors();
		for (var y = 0; y < Scope.y; y++) {
			for (var x = 0; x < Scope.x; x++) {
				var pixelIndex = this.AddressY[y] + x

				var Pixel = this.GetPixel(x, y);
				this.SetColor(colorBuffer, pixelIndex, Pixel.Color);
			}				
		}		
	}
	/////////////////////////////////////////////////////////////////////////////
	computePriorityFrame(colorBuffer /* TColor */) {

		for (var y = 0; y < Scope.y; y++) {
			for (var x = 0; x < Scope.x; x++) {
				var pixelIndex = this.AddressY[y] + x
				
				var Pixel = this.GetPixel(x, y);
				this.SetColor(colorBuffer, pixelIndex, Pixel.Priority);
			}
		}		
	}
	/////////////////////////////////////////////////////////////////////////////
	computeSamplingFrame(colorBuffer /* TColor */) {
		
		for (var y = 0; y < Scope.y; y++) {
			for (var x = 0; x < Scope.x; x++) {
				var pixelIndex = this.AddressY[y] + x

				var Pixel = this.GetPixel(x, y);
				if (Pixel.Sampled == true)
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
		this.serColor(colorBuffer, value);
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
		(this.Cache[Index].Pixel.Element)) {
		FreeCacheElement(this.Cache[Index].Pixel.Element);
	}

	this.Cache[Index].Hit.x = -this.MAX_REAL;
	this.Cache[Index].Hit.y = -this.MAX_REAL;
	this.Cache[Index].Hit.z = -this.MAX_REAL;
	EstablishLink(Pixel,(this.Cache[Index]));

	CachePointer = Stop;
}
	/////////////////////////////////////////////////////////////////////////////
	FreeCacheElement(Temp)
{
	Temp.Pixel.Element=NULL;
	Temp.Pixel=NULL;
}
	/////////////////////////////////////////////////////////////////////////////
	EstablishLink(Pixel, Element)
{
	Pixel.Element=Element;
	Element.Pixel=Pixel;
}
	/////////////////////////////////////////////////////////////////////////////
	GetPixel(x, y)
	{
		var pixelIndex = this.width*(this.height + 1) - (this.width - x)
		//return (this.Buffer[pixelIndex]);
		return (this.Buffer[pixelIndex]);
	}
	/////////////////////////////////////////////////////////////////////////////
	MarkForSample(Pixel, NextIndex, NextLine, x, y)
{
	Pixel.Sampled=true;

	// Check if resampling 
	// and add to sampling
    
	this.Element=Pixel.Element;

	if (this.Element) {
		this.SampleCount.Resample=true;
		D3_VecCopy(this.Element.Hit, SampleCount.Hit);
		ColorCopy(this.Element.Color, Pixel.Color);
	}
	else {
		this.SampleCount.Resample=false;
	}

	this.SampleCount.x=x;
	this.SampleCount.y=y;
	this.SampleCount++;

		// Distribute error

		var Half = (Pixel.Priority - Threshold) >> 1;
	if (Half) {
		(Pixel + NextIndex).Priority += Half;
		(Pixel + NextLine).Priority += Half;
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
