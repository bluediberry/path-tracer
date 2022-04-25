/**
 * @class Driver
 */

 import Vector3 from './Vector3.js'

/////////////////////////////////////////////////////////////////////////////
export default class Driver {
	// CCamera Temp,char HostAddress,int HostPort,int MaxSamplesPerFrame,int MaxRequests
	constructor(width, height) {

		this.width = width;
		this.height = height;

		//this.Cache=NULL;		
		//this.Buffer=NULL;	

		//this.PixelsToSample = NULL;

		//this.AddressY = NULL;
		
		this.CacheSize=0;	
		this.CachePointer=0;
		this.TotalPriority=0;
		this.NumberOfSamples=0;
		this.Threshold=0;

		this.MaximumSamplesPerFrame = width*height/8;
		
		this.InterpolationRandom = 5;
		this.InterpolationZero = 20;

		this.SampleCount=0;
		this.ColorComponents=3;
		
		this.CacheFactor = 1.5;
		this.DepthThreshold=1E+06;	
			
		this.AgeFactor=1;	

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
	Prepare() {
		this.AllocBuffers();
		this.AllocCache();
		this.AllocRendering();	
	}
	/////////////////////////////////////////////////////////////////////////////
	AllocBuffers() {

		var x,y,i;

		if (this.Buffer != null) {
			this.free(this.Buffer);
		}
		var BufferSize = (this.width + 2) * (this.height + 2 );
		var Buffer = new Array(); // (TPixel*)calloc(BufferSize,sizeof(TPixel));	
		for (i = 0; i < BufferSize; i++) {
			Buffer[i] = new Vector3(); //changed TPixel to vector2
		}

		if (this.AddressY != null) {
			free(this.AddressY);
		}

		var AddressSize = (this.height + 2);
		this.AddressY = new Array();
		for (i = 0; i < AddressSize; i++)
		{
			this.AddressY[i]=(i * (this.Scope.x + 2));
		}
	
		for (y=1; y<= this.Scope.y; y++) {		
			var Pixel=this.GetPixel(1,y);
			for (x = 1; x <= this.Scope.x ; x++) {
				Pixel.Weight=1;
				Pixel++;
			}
		}	
		
		for (x = 0; x <= this.Scope.x +1; x++) {
			var Pixel = this.GetPixel(x,0);
			Pixel.Weight=0;
			Pixel = GetPixel(x, this.Scope.y + 1);
			Pixel.Weight=0;
		}
		
		for (y = 0; y <= this.Scope.y+1; y++) {
			var Pixel = this.GetPixel(0,y);
			Pixel.Weight=0;
			Pixel = GetPixel(this.Scope.x + 1,y);
			Pixel.Weight=0;
		}
	}
	/////////////////////////////////////////////////////////////////////////////
	AllocCache() {
		if (this.Cache != null) {
			free(this.Cache);
		}
		this.CacheSize=(this.width * this.height * this.CacheFactor);
		this.Cache=new Array();
		for (var i = 0; i < this.CacheSize; i++) {
			var elem = new TElement();
			elem.Age=-1;
			elem.Pixel = NULL;
			this.Cache[i] = elem;
		}
	}
	/////////////////////////////////////////////////////////////////////////////
	AllocRendering() {
		if (this.PixelsToSample != null)
			free(this.PixelsToSample);
		
		this.PixelsToSample = new Array();
		for (var i = 0; i < this.CacheSize; i++) {
			this.PixelsToSample[i]=new TSample();
		}
		// TODO: samplecount?
		// this.SampleCount = &(PixelsToSample[0]);		
	}

/////////////////////////////////////////////////////////////////////////////
    storeCoordinate(xval, yval, array) {
        //array.push(x);
        //array.push(y);
		array.push({x: xval, y: yval});
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

	//while(CacheUsage < InitialFill) //slows down a lot
	//	{
			for(var i=0; i < this.MaximumSamplesPerFrame; i++){
				x = this.getRandomIntInclusive(0, width);
				y = this.getRandomIntInclusive(0, height);
				this.storeCoordinate(x, y, coords);
			}
			//this.RequestSamples(0);		
			//this.AgeCache(this.AgeFactor);
			//console.log("Cache usage: ", CacheUsage * 100.0);
		//	Count++;
		//	CacheUsage += 0.02;
		//}
	
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

		var result = new Object();
		result.new = new TPixel2D();

		for (var i=0; i < this.CacheSize; i++) {		
			var Element = this.Cache[i];
			Element.Pixel = null;

			// TODO: add clear to TPixel2D
			result.New.clear()
			result.depth = 10000000000000.0;
			if (this.Camera.ReprojectPixel(Element, result))
			{
				if ((New.x>=1 ) && (New.x <= this.Scope.x ) && 
					(New.y>=1 ) && (New.y <= this.Scope.y))
				{					
					var Pixel = this.GetPixel(result.New.x, result.New.y);
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
		this.SampleCount=(PixelsToSample[0]);
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
	RequestSamples(FrameCount) {	

		var index = 0;

		if (FrameCount % 10 == 0)
			console.log("Frame " + FrameCount + ": requesting " + (SampleCount - index)  + " samples");
		
		var RayDir = new TVector3D();	
		var Sample = new TSample();

		// TODO: AEye?
		D3_VecCopy(Camera.Eye,AEye);
		
		// TODO: sample count?
		while (index < SampleCount) {

			var Sample = PixelsToSample[index];
			if (Sample.Resample === true)
				Camera.ComputeShooting(Sample.Hit ,RayDir);
			else
				Camera.ComputeShooting(Sample.x, Sample.y, RayDir);

			AddRequest(Sample, RayDir);
			index++;
		}
	}
	/////////////////////////////////////////////////////////////////////////////
	AddRequest(Sample /* TSample */, RayDir /* TVector3D */) {
	
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
	AgeCache(Step /* int */ ) {
		for (var i=0; i < this.CacheSize; i++) {
			this.Cache[i].Age += Step;
		}
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
	ComputeReprojectionFrame(ColorBuffer /* TColor */ ) {
		
		var Index = 0;
		for (var y=1; y <= Scope.y; y++) {	

			for (var x=1; x <= Scope.x ; x++) {
				var Pixel = this.GetPixel(x, y);	
				if (Pixel.Element != null) {
					this.SetColor(ColorBuffer,Index,Pixel.Element.Color);
				}
				else {
					this.SetColor(ColorBuffer,Index);
				}
				Index += this.ColorComponents;
			}
			// Index+=ColorComponents* Scope->x ;
		}
	}
	/////////////////////////////////////////////////////////////////////////////
	ComputeFrame(ColorBuffer /* TColor */) {
		
		var Index = 0;
		this.ToneMap.MapColors();
		for (var y = 1; y <= Scope.y; y++) {

			for (var x = 1; x <= Scope.x; x++) {
				var Pixel = this.GetPixel(x, y);
				this.SetColor(ColorBuffer,Index,Pixel.Color);							
				Index += this.ColorComponents;
			}				
		}		
	}
	/////////////////////////////////////////////////////////////////////////////
	ComputePriorityFrame(ColorBuffer /* TColor */) {

		var Index = 0; // 2* Scope->x * Scope->y*ColorComponents+ Scope->x *ColorComponents;
		for (var y = 1; y <= Scope.y; y++) {

			for (var x = 1; x <= Scope.x; x++) {
				var Pixel = this.GetPixel(x, y);
				this.SetColor(ColorBuffer,Index,Pixel.Priority);						
				Index += this.ColorComponents;	
			}
		}		
	}
	/////////////////////////////////////////////////////////////////////////////
	ComputeSamplingFrame(ColorBuffer /* TColor */) {
		var Index = 2 * this.Scope.x * this.Scope.y * this.ColorComponents;

		for (var y = 1; y <= Scope.y; y++) {

			for (var x = 1; x <= Scope.x; x++) {
				var Pixel = this.GetPixel(x, y);
				if (Pixel.Sampled == true)
					SetColor(ColorBuffer,Index,255);
				else
					SetColor(ColorBuffer,Index,0);

				Index += this.ColorComponents;
			}		
			Index += ColorComponents* this.Scope.x ;
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
	SetColor(ColorBuffer, Index, R, G, B)
{
	ColorBuffer[Index] = R;
	Index++;
	ColorBuffer[Index] = G;
	Index++;
	ColorBuffer[Index] = B;
	Index++;
}
	/////////////////////////////////////////////////////////////////////////////
	SetColor(ColorBuffer, Index, Value)
{
	ColorBuffer[Index] = Value;
	Index++;
	ColorBuffer[Index] = Value;
	Index++;
	ColorBuffer[Index] = Value;
	Index++;
}
	/////////////////////////////////////////////////////////////////////////////
	SetColor(ColorBuffer, Index, C)
{
	ColorBuffer[Index] = (TColor)(C.r);
	Index++;
	ColorBuffer[Index] = (TColor)(C.g);
	Index++;
	ColorBuffer[Index] = (TColor)(C.b);
	Index++;
}
	/////////////////////////////////////////////////////////////////////////////
	SetColor(ColorBuffer, Index)
{
	ColorBuffer[Index] = 0;
	Index++;
	ColorBuffer[Index] = 0;
	Index++;
	ColorBuffer[Index] = 0;
	Index++;
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
	return (this.Buffer[AddressY[y] + x]);
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

}
