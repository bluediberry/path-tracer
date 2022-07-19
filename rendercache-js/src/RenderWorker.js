import RayTracer from './RayTracer.js'
import Scene from './Scene2.js'
import Sample from './Sample.js'
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
var pixel = new Vector3(0, 0, 0);
var newHit = [];
var rayTracer = new RayTracer(scene);

function rendererMessageHandler(e) {
    var action = e.data.action;
    var data = e.data.data;

    if(action == "from")
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
}
messageHandler = rendererMessageHandler;


function startRendering()
{
    var sample = new Sample();
    sample.rayDir = rayDir;
    sample.hit = hit;
    sample.normalDir =normalDir;

    var color = rayTracer.trace(fromRequest, sample);
    var newHit =  rayTracer.getHit();

    postMessage({
        "action": "result",
        "data": [color.x, color.y, color.z, 
            newHit.x, newHit.y, newHit.z,
            pixel.x, pixel.y
            ],
    });
}