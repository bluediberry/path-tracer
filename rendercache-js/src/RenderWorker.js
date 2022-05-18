import RayTracer from './RayTracer.js'
import Scene from './Scene2.js'
import Sphere from './Sphere.js'
import Vector3 from './Vector3.js'
import Camera from './Camera.js'
import Sample from './Sample.js'

var messageHandler = undefined;

self.onmessage = function(e) {
    /*if(messageHandler)
    {
        messageHandler(e);
    }*/
// create camera
var from = new Vector3(0, 50, 50);
var to = new Vector3(0,0,0);
// up vector is hardcoded into camera update position
var camera = new Camera(
  	/* from */ from,
  	/* to */ to,
  	/* fov */ 30,
  	/* width */ 480,
  	/* height */ 360
);
    var scene = new Scene();
    // create raytracer
    var engine = new RayTracer(scene, camera);

    var request = e.data.request;

    request = request.doRaytracing(engine, camera, request);

    self.postMessage(request);
};

/*function rendererMessageHandler(e) {
    var engine = e.data.engine;
    var camera = e.data.camera;
    var request = e.data.request;

    startRendering(engine, camera, request);

}
messageHandler = rendererMessageHandler;

function startRendering(engine, camera, request)
{
    camera = new Camera();
  
  // create raytracer
  engine = new RayTracer(Scene, camera);

    request.doRaytracing(engine, camera, request);

    self.postMessage(request);
}*/