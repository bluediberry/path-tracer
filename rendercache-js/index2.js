import Raytracer from "./src/Raytracer.js";
import Scene2 from "./src/Scene2.js";
import Scene3 from "./src/Scene3.js";
import Vector3 from "./src/Vector3.js";
import Driver from "./src/Driver.js";
import Camera from "./src/Camera.js";
import OrbitControls from "./js/OrbitControls.js";
import PointerLockControls from "./src/controls.js";

const scene = new THREE.Scene();

//renderer.setSize( window.innerWidth, window.innerHeight );
//document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );



var isMoving = false;
// get canvas
var canvas = document.getElementById("resultCanvas");
canvas.addEventListener("click", function (event) {
  //console.log("x: " + event.offsetX + ", y: " + event.offsetY);
  isMoving = true;
});

var ctx = canvas.getContext("2d");

// create camera
var position = new Vector3(0, 1, 10);
var camera = new Camera(
  	position,
	new Vector3(0, 0, -1),
  	45,
  	canvas.width,
  	canvas.height
);

camera.prepare();
position.z = 5;
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

function animate() {
  const time = Date.now();
  const delta = (time - prevTime) / 1000;
  prevTime = time;

  window.requestAnimationFrame(animate);

  if(isMoving){
    //frameIndex = 0;
    isMoving = false;
  }

  //controls.update(delta);

  // perform everything for the next frame
  driver.nextFrame(frameIndex);

  // compute frame data
  driver.computeFrame(colorbuffer);
  //ctx.imageSmoothingEnabled = true;
  // copy  buffer to canvas
  var buf8 = new Uint8ClampedArray(buffer);
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  imageData.data.set(buf8);
  // put in image
  ctx.putImageData(imageData, 0, 0);

  //position.x -= 0.05;

  
  //console.log(position);
  camera.updatePosition(position);
  frameIndex++;
  fps++; 
  

}

window.setInterval(function () {
  // display statistics
  //var fps = Math.floor(frameIndex / ((Date.now() - prevTime) / 1000));
  if (Date.now() - startTime > 1000) {
    statsDiv.innerHTML = "fps: " + fps;
    startTime = Date.now();
    fps = 0;
	}
  //statsDiv.innerHTML = "fps: " + fps;
}, 100);

window.requestAnimationFrame(animate);
