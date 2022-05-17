import Raytracer from "./src/Raytracer.js";
import Scene2 from "./src/Scene2.js";
import Scene3 from "./src/Scene3.js";
import Vector3 from "./src/Vector3.js";
import Driver from "./src/Driver.js";
import Camera from "./src/Camera.js";
import OrbitControls from "./js/OrbitControls.js";
import PointerLockControls from "./src/controls.js";
//import RenderPlanner from '../src/RenderPlanner.js'


// create scene
var scene = new Scene2();

// get canvas
var canvas = document.getElementById("resultCanvas");
canvas.addEventListener("click", function (event) {
  //console.log("x: " + event.offsetX + ", y: " + event.offsetY);
});
var ctx = canvas.getContext("2d");

// create camera
var from = new Vector3(0, 50, 50);
var to = new Vector3(0,0,0);
// up vector is hardcoded into camera update position
var camera = new Camera(
  	/* from */ from,
  	/* to */ to,
  	/* fov */ 30,
  	/* width */ canvas.width,
  	/* height */ canvas.height
);

// create raytracer
var engine = new Raytracer(scene, camera);

// create driver
var driver = new Driver(engine, camera);
driver.prepare(false);

// initialize buffer view
var colorDepth = 4;
var buffer = new ArrayBuffer(canvas.width * canvas.height * colorDepth);
var colorbuffer = new Uint32Array(buffer);

// image data
var statsDiv = document.getElementById("resultDiv");
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
var prevTime = Date.now();
var startTime = Date.now();

var bufferPieces = [];
var workerCount = 8;
//var renderPlanner = new RenderPlanner(workerCount, scene, backgroundColor, canvas.width, canvas.height);

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

function animate() {
  from.x += 0.1;

  const time = Date.now();
  const delta = (time - prevTime) / 1000;
  prevTime = time;

  window.requestAnimationFrame(animate);

  // camera update requires to be 
	// done PRIOR to calculation
  camera.updatePosition(from, to);

  //controls.update(delta);

  // perform everything for the next frame
  driver.nextFrame(frameIndex);

  // compute frame data
  driver.computeReprojectionFrame(colorbuffer);
  
  // copy  buffer to canvas
  var buf8 = new Uint8ClampedArray(buffer);
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  imageData.data.set(buf8);

  // put in image
  ctx.putImageData(imageData, 0, 0);

  //position.x -= 0.05;

  //console.log(position);
  // increase fps and display
  frameIndex++;
  fps++; 
}

window.setInterval(function () {
  // display statistics
  if (Date.now() - startTime > 1000) {
    statsDiv.innerHTML = "fps: " + fps;
    startTime = Date.now();
    fps = 0;
	}
}, 100);

window.requestAnimationFrame(animate);
