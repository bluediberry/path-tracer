import RayTracer from '../src/RayTracer.js'
import Scene from '../src/Scene.js'
import Sphere from '../src/Sphere.js'
import Material from '../src/Material.js'
import Vector3 from '../src/Vector3.js'
import Driver from '../src/Driver.js'
import Camera from '../src/Camera.js'

// create scene
var scene = new Scene();

// add background sphere
scene.add(
    new Sphere(new Vector3(0.0, -10004, -20), 10000,
               new Material(new Vector3(0.2, 0.2, 0.2), 0, 0, new Vector3()))
);

// add spheres
var sphere1 = new Sphere(new Vector3(0, 0, -20), 4,
                         new Material(new Vector3(1.00, 0.32, 0.36), 1, 0.5, new Vector3()));
scene.add(sphere1);

var sphere2 = new Sphere(new Vector3(5, -1, -15), 2,
                         new Material(new Vector3(0.9, 0.76, 0.46), 1, 0, new Vector3()));
scene.add(sphere2);

var sphere3 = new Sphere(new Vector3(5, 0, -25), 3,
                         new Material(new Vector3(0.65, 0.77, 0.97), 1, 0, new Vector3()));
scene.add(sphere3);

var sphere4 = new Sphere(new Vector3(-5.5, 0, -15), 3,
                         new Material(new Vector3(0.9, 0.9, 0.9), 1, 0, new Vector3()));
scene.add(sphere4);

// add light
var light1 = new Sphere(new Vector3(0, 20, -30), 3,
                        new Material(new Vector3(), 0, 0, new Vector3(1.2, 1.2, 1.2)));
scene.add(light1);
scene.add(
    new Sphere(new Vector3(0, 10, 10), 3,
               new Material(new Vector3(), 0, 0, new Vector3(1, 1, 1)))
);

// configure background
var backgroundColor = new Vector3(2.0, 2.0, 2.0);

// get canvas
var canvas = document.getElementById("resultCanvas");
var ctx = canvas.getContext('2d');
var canvasWidth  = canvas.width;
var canvasHeight = canvas.height;

// create camera
var camera = new Camera(new Vector3(0, 0, 0), new Vector3(0, 0, -1), 30, canvasWidth, canvasHeight);

// create raytracer
var raytracer = new RayTracer(backgroundColor, scene, camera);

// create driver
var driver = new Driver(canvasWidth, canvasHeight, raytracer, camera);
driver.prepare();

// save start time
var startTime = Date.now();

// initialize buffer view 
var colorDepth = 4;
var buffer = new ArrayBuffer(canvasWidth * canvasHeight * colorDepth);
var colorbuffer = new Uint32Array(buffer);
var frame = 0;

// main cycle
var resultDiv = document.getElementById("resultDiv");
setInterval(function () {

	// perform everything for the next frame
	driver.nextFrame(frame)
	// compute frame data
	driver.computeFrame(colorbuffer)

	// copy buffer to canvas
	var buf8 = new Uint8ClampedArray(buffer);
	var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	imageData.data.set(buf8);
	
	// put in image
	ctx.putImageData(imageData, 0, 0);

	// display statistics
	displayFrameRate()
	frame++

}, 10);

function displayFrameRate() {
	// display total duration
	var currentTime = Date.now();
	if (currentTime - startTime > 1000) {
		resultDiv.innerHTML = "FPS = " + frame + " Total frame = " + frame;
		startTime = currentTime;
	}

}