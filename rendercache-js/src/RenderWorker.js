import RayTracer from './RayTracer.js'
import Scene from './Scene2.js'
import Sphere from './Sphere.js'
import Vector3 from './Vector3.js'
import Color from './Color.js'

var messageHandler = undefined;

onmessage = function(e) {
    if(messageHandler)
    {
        messageHandler(e);
    }
};

var scene = new Scene();
var fromRequest = new Vector3(0, 0, 0);
var hit = new Vector3(0, 0, 0);
var normalDir = new Vector3(0, 0, 0);
var rayDir = new Vector3(0, 0, 0);
var pixel = new Vector3(0, 0, 0);
var newRequest = [];
var rayTracer = new RayTracer(scene);
var colorArray = [];
var width = 480;
var height =360;

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
    else if(action == "from")
    {
        fromRequest.x = data[0];
        fromRequest.y = data[1];
        fromRequest.z = data[2];
    }
    else if(action == "hit")
    {
        hit.x = data[0];
        hit.y = data[1];
        hit.z = data[2];
    }
    else if(action == "rayDir")
    {
        rayDir.x = data[0];
        rayDir.y = data[1];
        rayDir.z = data[2];
    }
    else if(action == "normalDir")
    {
        normalDir.x = data[0];
        normalDir.y = data[1];
        normalDir.z = data[2];

    }
    else if(action == "pixel")
    {
        pixel.x = data[0];
        pixel.y = data[1];
        pixel.z = data[2];
    }
    else if(action == "render")
    {
        startRendering();
    }
    else if(action == "status")
    {
        var counter = data[0]; 
        var samples = data[1];

        if(counter == samples - 1){
            postMessage({
                "action": "allRendered",
                "data": [samples],
            });
        }
    }

}
messageHandler = rendererMessageHandler;


function startRendering()
{
    newRequest.hit = hit;
    newRequest.normalDir = normalDir;
    newRequest.rayDir = rayDir;
    newRequest.rayOrigin = fromRequest;

    var color = rayTracer.trace(newRequest);
    var newHit = rayTracer.getHit();
    //console.log(color)
    // send result buffer
    //var buf8  = new Uint8ClampedArray(buffer);
    var pixelIndex = width*(height - pixel.y) - (width - pixel.x);

    colorArray[pixelIndex] = color;

    postMessage({
        "action": "result",
        "data": [color.x, color.y, color.z, 
                newHit.x, newHit.y, newHit.z,
                pixel.x, pixel.y
                ],
    });
}