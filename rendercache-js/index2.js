import Scene from '../src/Scene2.js'
import Sphere from '../src/Sphere.js'
import Material from '../src/Material.js'
import Vector3 from '../src/Vector3.js'
import Driver from "./src/Driver.js";
import Camera from "./src/Camera.js";
import OrbitControls from "./js/OrbitControls.js";
import RenderPlanner from '../src/RenderPlanner.js'


const DEGREES_TO_RADIANS = Math.PI / 180.0;

// -------------------------------
// create scene
var scene = new Scene();

var backgroundColor = new Vector3(2.0, 2.0, 2.0);

var raytrace = false;

// get canvas
var canvas = document.getElementById("resultCanvas");
var ctx = canvas.getContext('2d');
var canvasWidth  = canvas.width;
var canvasHeight = canvas.height;

// initialize buffer view
var colorDepth = 4;
// @ts-ignore
var buffer = new ArrayBuffer(canvas.width * canvas.height * colorDepth);
var colorbuffer = new Uint32Array(buffer);

// image data
var statsDiv = document.getElementById("resultDiv");
// @ts-ignore
var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// main cycle
var frameIndex = 0;
var fps = 0;
var startTime = Date.now();
var angle = 0;

// var create render planner
var bufferPieces = [];
var workerCount = 5;
var renderPlanner = new RenderPlanner(workerCount, scene, backgroundColor, canvasWidth, canvasHeight);
renderPlanner.initialize();
renderPlanner.start();

renderPlanner.onUpdateReceived = function(sectionStart, sectionHeight, buf8)
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
        // update scene data!
        setTimeout(function(){

            renderPlanner.updateScene();
            renderPlanner.start();

            frameIndex++;
            var currentTime = Date.now();
            if(currentTime - startTime > 1000){
                resultDiv.innerHTML = "Worker Count: " + workerCount + " FPS = " + frameIndex;
                startTime = currentTime;
                frameIndex = 0;
            }
        },0);
 
     }
}

// main program
var frameIndex = 0;
// @ts-ignore
var prevTime = Date.now();
// @ts-ignore
var start = Date.now();
var angle = 0;

//window.setInterval(animate,5);

