import Raytracer from "./src/Raytracer.js";
import Scene2 from "./src/Scene2.js";
// @ts-ignore
import Scene3 from "./src/Scene3.js";
import Vector3 from "./src/Vector3.js";
import Driver from "./src/Driver.js";
import Camera from "./src/Camera.js";
import OrbitControls from "./js/OrbitControls.js";
// @ts-ignore
//import PointerLockControls from "./src/controls.js";
import RenderPlanner from './src/RenderPlanner.js';

// @ts-ignore
const DEGREES_TO_RADIANS = Math.PI / 180.0;

// create scene
var scene = new Scene2();
var raytrace = false;

//document.getElementById("demo").onclick = function() {myFunction()};

// @ts-ignore
function myFunction() {
  //document.getElementById("demo").innerHTML = "YOU CLICKED ME!";
  //raytrace = true;
}

// get canvas
var canvas = document.getElementById("resultCanvas");
// @ts-ignore
canvas.addEventListener("click", function (event) {
  //console.log("x: " + event.offsetX + ", y: " + event.offsetY);
});
// @ts-ignore
var ctx = canvas.getContext("2d");

// create camera
var from = new Vector3(0, 50, 50);
var to = new Vector3(0,0,0);
// up vector is hardcoded into camera update position
var camera = new Camera(
  	/* from */
  	from,
  	/* to */ to,
  	/* fov */ 30,
    // @ts-ignore
  	/* width */ canvas.width,
    // @ts-ignore
  	/* height */ canvas.height
);

// create raytracer
var engine = new Raytracer(scene, camera);

var ratio = 3;
if(raytrace)
{
  ratio = 1;
}
// create driver
// @ts-ignore
var driver = new Driver(engine, camera, ratio);
driver.prepare(false);

// initialize buffer view
var colorDepth = 4;
// @ts-ignore
var buffer = new ArrayBuffer(canvas.width * canvas.height * colorDepth);
var colorbuffer = new Uint32Array(buffer);

// image data
var statsDiv = document.getElementById("resultDiv");
// @ts-ignore
var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// interaction
//var controls = new PointerLockControls(camera.cam, canvas);
var controls = new OrbitControls(camera.cam, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;
controls.autoRotate = false;

// main cycle
var frameIndex = 0;
var fps = 0;
// @ts-ignore
var prevTime = Date.now();
var startTime = Date.now();
// @ts-ignore
var angle = 0;
// @ts-ignore
var bufferPieces = [];
var workerCount = 8;

// @ts-ignore
// @ts-ignore
var renderPlanner = new RenderPlanner(workerCount, scene, engine, canvas.width, canvas.height);

/*renderPlanner.onUpdateReceived = function(sectionStart, sectionHeight, buf8)
{
    // collect buffer for a single screen update
    bufferPieces.push({
        "buffer": buf8,
        "start": sectionStart,
        "height": sectionHeight
    });

    if(renderPlanner.isRunning() == false)
    {
        // rendering is completed update screen!
        for(var i=0; i<bufferPieces.length; i++) {
            var piece = bufferPieces[i];

            var imageData = ctx.getImageData(0, piece.start, canvasWidth, piece.height);
            imageData.data.set(piece.buffer);
            ctx.putImageData(imageData, 0, piece.start);
        }

        bufferPieces = [];

        window.requestAnimationFrame(animate);

    }
};*/

/*function startRendering() {
    // start
    renderPlanner.initialize();
    renderPlanner.start();
}*/

function animate() 
{

	// camera update requires to be 
	// done PRIOR to calculation
	camera.updatePosition(from, to);

  //controls.update();
	// this is just a minor location update
	//from.x = 100 * Math.cos(angle * DEGREES_TO_RADIANS);
  //from.y = 100 * Math.cos(angle * DEGREES_TO_RADIANS);
	//from.z = 100 * Math.sin(angle * DEGREES_TO_RADIANS);
	//angle += 1;

  
  if(raytrace)
  {
  // perform everything for the next frame
  driver.nextFrame1SPP(frameIndex);
  }
  else 
  {
	// perform every single step in the rendercache
	// pipeline for the next frame
  driver.nextFrame(frameIndex);
  }


	// compute frame data
	driver.getColorFrame(colorbuffer);

	// copy  buffer to canvas
	var buf8 = new Uint8ClampedArray(buffer);
	// var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	imageData.data.set(buf8);
	
	// put in image
	ctx.putImageData(imageData, 0, 0);

  // increase fps and display
  frameIndex++;
  fps++; 
  // display statistics
  if (Date.now() - startTime > 1000) {
    statsDiv.innerHTML = "fps: " + fps;
    startTime = Date.now();
    fps = 0;
	}
}

// main program
var frameIndex = 0;
// @ts-ignore
var prevTime = Date.now();
// @ts-ignore
var start = Date.now();
// @ts-ignore
var angle = 0;
window.setInterval(animate,5);

