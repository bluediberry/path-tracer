import RayTracer from './RayTracer.js'
import Scene from './Scene.js'
import Sphere from './Sphere.js'
import Vector3 from './Vector3.js'
import Camera from './Camera.js'
import Driver from './Driver.js'

var messageHandler = undefined;

onmessage = function(e) {
    if(messageHandler)
    {
        messageHandler(e);
    }
};

var frame = 0;

var scene = new Scene();
var backgroundColor = new Vector3(0, 0, 0);
var rendererWidth = 0;
var rendererHeight = 0;
var startY = 0;
var scanHeight = 0;
// create raytracer
//var engine = new Raytracer(scene, camera);
var driver;
var camera;
//var canvas = getElementById("resultCanvas");
var from = new Vector3(0, 50, 50);
var to = new Vector3(0,0,0);
var angle = 0;
const DEGREES_TO_RADIANS = Math.PI / 180.0;

function rendererMessageHandler(e) {
    var action = e.data.action;
    var data = e.data.data;

    if(action == "elements") {
        scene.clear();
        var elements = data;
        for(var i=0; i<elements.length; i++) {
            scene.add(Sphere.deserialize(elements[i]));
        }
    }
    else if(action == "backgroundColor")
    {
        backgroundColor.x = data[0];
        backgroundColor.y = data[1];
        backgroundColor.z = data[2];
    }
    else if(action == "dimensions")
    {
        rendererWidth = data[0];
        rendererHeight = data[1];
        startY = data[2];
        scanHeight = data[3];

        // up vector is hardcoded into camera update position
        camera = new Camera(to,
        from,
        30,
        rendererWidth,
        rendererHeight);

        driver = new Driver(16, rendererWidth, rendererHeight, camera);
    }
    else if(action == "render")
    {
        startRendering();
    }
}
messageHandler = rendererMessageHandler;

function startRendering()
{
    var colorDepth = 4;
    var buffer = new ArrayBuffer(rendererWidth*rendererHeight*colorDepth);
    var colorBuffer = new Uint32Array(buffer);

    var startTime = new Date();
   // var camera = new Camera(rendererWidth, rendererHeight);
    //var driver = new Driver(16, rendererWidth, rendererHeight);
    if(frame === 0){
      driver.allocBuffers();
      driver.allocCache(); 
    }
	camera.updatePosition(from, to);

	//from.z = 100 * Math.sin(angle * DEGREES_TO_RADIANS);
    from.x = 100 * Math.sin(angle * DEGREES_TO_RADIANS);
	angle += 1;

    driver.nextFrame(frame, 0);
    frame++;
	driver.getReprojectionFrame(colorBuffer);
    
    var endTime = new Date();
    //console.log(frame);
    // send result buffer
    var buf8  = new Uint8ClampedArray(buffer);
    postMessage({
        "action": "result",
        "data": buf8
    });
}