import RayTracer from './RayTracer.js'
import Scene from './Scene2.js'
import Sphere from './Sphere.js'
import Vector3 from './Vector3.js'

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
var newRequest = [];

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
    else if(action == "render")
    {
        startRendering();
    }
}
messageHandler = rendererMessageHandler;

function startRendering()
{
    newRequest.hit = hit;
    newRequest.normalDir = normalDir;
    newRequest.rayDir = rayDir;
    //console.log(newRequest)
    var rayTracer = new RayTracer(scene);
    var color = rayTracer.trace(fromRequest, newRequest);
    //console.log(color)
    // send result buffer
    //var buf8  = new Uint8ClampedArray(buffer);
    postMessage({
        "action": "result",
        "data": [color.x, color.y, color.z]
    });
}