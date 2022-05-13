
 /**
 * @class Async
 */

  export default class Async {

    constructor(socket, start, current, requests, eye) {
        this.socket = socket;
        this.start = start;
        this.current = current;
        this.requests = requests;
        this.eye = eye;

        var packSize = 90;
        var resultsExpected = 0;
        var terminate = false;


    }
 /*
     var packSize = 90;
     m_resultsExpected=0;
     m_terminate=false;
 
     m_start=Start;
     m_current=Current;
     m_requests=Requests;
     m_eye=Eye;
     m_socket=Socket;
 */
    // write(m_socket,&m_packSize, sizeof(int));	
 
     AllocBuffers();
     
    /* #ifdef _DEBUGSESSION
     fp=fopen("engine.txt","wt");
     #endif*/
 
AsyncRun()
     {
         Layer(ASocket,AStart,ACurrent,ARequests,AEye);
         Layer.SetCacheData(ACache,ACacheSize);
         Layer.Run();
     
         return NULL;
     }
 /////////////////////////////////////////////////////////////////////////////
 SetCacheData(Cache, CacheSize)
 {
     var cache = Cache;
     var cacheSize = CacheSize;
     var cachePointer = 0;
 
     this.start=0;
     this.current=0;
 }
 /////////////////////////////////////////////////////////////////////////////
 AllocBuffers()
 {
     var BufferSize;
 
     BufferSize = this.packSize * 3;	
     var requestsPacked = BufferSize;
     if (requestsPacked == NULL)
     {
         fprintf(stderr,"Unable to allocate mamory for requests!\n");
         exit(0);
     }
 
     BufferSize= this.packSize * 10;	
     var results = BufferSize;
     if (results == NULL)
     {
         fprintf(stderr,"Unable to allocate mamory for results!\n");
         exit(0);
     }
 }
 /////////////////////////////////////////////////////////////////////////////
 Run()
 {	
     while (this.terminate == false)
     {		
         if (this.resultsExpected == 0)
         {
             if (this.current - this.start >= this.packSize)
             {				
                 this.resultsExpected = this.packSize;
                 FlushRequests();				
             }
 
             if (this.current < this.start)
                 this.start = 0;	
         }
         else
         {			
             ReceiveResults();
             ProcessResults();
 
             if (this.start > this.current)
                this.start = 0;
             else
                 this.start += this.packSize;
 
            this.resultsExpected=0;
         }
     }
    /* #ifdef _DEBUGSESSION
     fclose(fp);
     #endif
     
     fprintf(stderr,"Exit!\n");*/
 }
 /////////////////////////////////////////////////////////////////////////////
 CAsyncLayer()
 {
    this.terminate=true;  
 }

 /////////////////////////////////////////////////////////////////////////////
PackRequests()
 {
     var		i,
             Counter,
             Stop;
 
     Counter = 0;
     Stop = this.start + this.packSize;
 
     for (i = this.start; i < Stop; i++)
     {
         this.requestsPacked[Counter] = this.requests[i].x;
         Counter++;
         this.requestsPacked[Counter] = this.requests[i].y;
         Counter++;
         this.requestsPacked[Counter] = this.requests[i].z;
         Counter++;
     }
 }
 /////////////////////////////////////////////////////////////////////////////
FlushRequests()
 {
     var		RE;
     
     PackRequests();
 
     if ( this.socket != 0 )
     {
     /*  #ifdef _DEBUGSESSION
       RE=Time.GetElapsedFromLast();
       #endif*/
     
         write( m_socket, this.resultsExpected, sizeof(int));
         write( m_socket, this.eye.x, sizeof(REAL));
         write( m_socket, this.eye.y, sizeof(REAL));
         write( m_socket, this.eye.z, sizeof(REAL));
                 
         var Size = this.resultsExpected * 3 * sizeof(REAL);
         write( this.socket, this.requestsPacked, Size);		
     }
     else
     {
         var Origin;
 
         Origin[0] = this.eye.x;
         Origin[1] = this.eye.y;
         Origin[2] = this.eye.z;
         
        /* #ifdef _DEBUGSESSION
       //RE=Time.GetElapsedFromLast();
       #endif*/
             
        // RAD_Process(m_resultsExpected, m_requestsPacked, m_results, Origin);
        this.resultCounter = 0;
        this.resultCells = this.resultsExpected * 10;
         
         /*#ifdef _DEBUGSESSION
       RE=Time.GetElapsedFromLast();
         //fprintf(fp,"%d,%ld\n",m_resultsExpected,RE);
       #endif*/
     }
 }
 /////////////////////////////////////////////////////////////////////////////
ReceiveResults()
 {
     var		ThisTurn;
     var  RE;
 
     if (this.socket != 0)
     {
        // readpvm( this.socket, &ThisTurn, sizeof(int));
         
         /*#ifdef _DEBUGSESSION
       RE=Time.GetElapsedFromLast();
         fprintf(fp,"%d,%ld\n",ThisTurn,RE);
       #endif*/
 
       this.resultCells = ThisTurn * 10 * sizeof(REAL);
       this.resultCounter = 0;
         
         read( this.socket, this.results, this.resultCells);		
     }
 }
 /////////////////////////////////////////////////////////////////////////////
ProcessResults()
 {
     var	   Element=NULL;
     var				i,
                     Stop;
     var			Dummy;
 
     Stop = this.start + this.packSize;
     for (i= this.start; i < Stop; i++)
     {		
         Element = AllocCacheElementAndLock();
 
         ExtractVector(Element.Hit);
         ExtractVector(Element.Normal);
         ExtractColor(Element.Color);
         ExtractREAL(Dummy);
 
         if (Element.Color.r < MIN_RADIANCE)
             Element.Color.r = MIN_RADIANCE;
          if (Element.Color.g < MIN_RADIANCE)
             Element.Color.g = MIN_RADIANCE;
          if (Element.Color.b < MIN_RADIANCE)
             Element.Color.b = MIN_RADIANCE;
 
         Element.Age = 0;
         if (this.requests[i].Resample==true)
         {
             // This is a Pixel resample so
             // compare new sample color with
             // previous one
 
              var 	OldColor = this.requests[i].Color.r +
                             this.requests[i].Color.g +
                              this.requests[i].Color.b;
 
             var	NewColor = Element.Color.r + Element.Color.g + Element.Color.b,
                     Diff = fabs(OldColor - NewColor);
         
             // Prematurelly age element according
             // to color difference between new
             // and old color samples
 
              Element.Age = (int)(4.0 * Diff);
         }
     }
     Element.Locked = false;
 }
 /////////////////////////////////////////////////////////////////////////////
 //
 //
 //
 /////////////////////////////////////////////////////////////////////////////
ExtractVector(Temp)
 {
     Temp.x = this.results[this.resultCounter];
     this.resultCounter++;
     Temp.y = this.results[this.resultCounter];
     this.resultCounter++;
     Temp.z = this.results[this.resultCounter];
     this.resultCounter++;
 
     
     if(this.resultCounter > this.resultCells)
         fprintf(stderr,"Error! Count exceeded limit! %ld %ld\n",this.resultCounter,this.resultCells);
 }
 /////////////////////////////////////////////////////////////////////////////
ExtractColor(Temp)
 {
     Temp.r = this.results[this.resultCounter];
     this.resultCounter++;
     Temp.g = this.results[this.resultCounter];
     this.resultCounter++;
     Temp.b = this.results[this.resultCounter];
     this.resultCounter++;
     
     if(this.resultCounter > this.resultCells)
         fprintf(stderr,"Error! Count exceeded limit! %ld %ld\n",this.resultCounter,this.resultCells);
 }
 /////////////////////////////////////////////////////////////////////////////
ExtractREAL(Temp)
 {
    Temp = this.results[this.resultCounter];
    this.resultCounter++;
     
     if (this.resultCounter > this.resultCells)
         fprintf(stderr,"Error! Count exceeded limit! %ld %ld\n",this.resultCounter,this.resultCells);
 }

AllocCacheElementAndLock()
 {
     var		Stop,
             Start,
             Index,
             MaxAge=-1;		

     Stop = this.cachePointer + 8;
     if ( Stop > this.cacheSize )
         Stop = 8;

     Index = -1;
     MaxAge = -1;
     Start = Stop - 8;		
     while (Start < Stop)
     {
         if (!this.cache[Start].Pixel)
         {
            this.cachePointer=Stop;
             return this.cache[Start];
         }
         else
         if (this.cache[Start].Age > MaxAge)
         {
             Index = Start;
             MaxAge = this.cache[Start].Age;
         }
         Start++;
     }
             
     if ((this.cache[Index].Pixel) &&
         (this.cache[Index].Pixel.Element))
     {
        this.cache[Index].Pixel.Element = NULL;
        this.cache[Index].Pixel = NULL;			
     }		

     this.cache[Index].Hit.x =-MAX_REAL;
     this.cache[Index].Hit.y =-MAX_REAL;
     this.cache[Index].Hit.z =-MAX_REAL;
     
     this.cachePointer = Stop;
     return this.cache[Index];
 } 
}