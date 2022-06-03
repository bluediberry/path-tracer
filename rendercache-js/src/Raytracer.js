import Vector3 from './Vector3.js'
import Sample from './Sample.js'

const MAX_RAY_DEPTH = 1;
const INFINITY = 1e8;

export default class Raytracer {
	
    constructor(scene) {
		this.scene = scene;
    }

    serialize() {
        var scene = this.scene;
        var camera = this.camera;

        return [{
            "scene": scene,
            "camera": camera,
        }];
    }

    static deserialize(data) {
        var scene = data.scene;
        var camera = data.camera;
        var engine = new Raytracer(scene,camera);
        return engine;
    }

    trace(rayOrigin, sample, rayDir, hit, normalDir) {
        var tnear = INFINITY;
        var element = null;

        var elements = this.scene.getElements();
        var elementsLen = elements.length;

        var hitInfo = {t0:INFINITY, t1:INFINITY};
        for(var i=0; i<elementsLen; i++) {
            hitInfo.t0 = INFINITY;
            hitInfo.t1 = INFINITY;
            var el = elements[i];
            if(el.intersect(rayOrigin, rayDir, hitInfo)) {
                // ray hit intersect
                if(hitInfo.t0 < 0) {
                    hitInfo.t0 = hitInfo.t1;
                }

                if(hitInfo.t0 < tnear) {
                    tnear = hitInfo.t0;
                    element = el;
                }
            }
        }

        if(element === null) {
            // consider a very far away point to be the hit
            hit = rayOrigin.add(rayDir.multiply(100000.0));
            normalDir = new Vector3(-hit.x, -hit.y, -hit.z); 
			// no hit, return background color
			return this.scene.backgroundColor;
        }

        var surfaceColor = new Vector3(0,0,0);
        var intersectionPoint = rayOrigin.clone().add(rayDir.clone().multiply(tnear));

        var intersectionNormal = element.getNormal(intersectionPoint);

        sample.hit = intersectionPoint.clone();
		normalDir = intersectionNormal.normalize();

        var bias = 1e-4;
        var inside = false;
        if (rayDir.dot(intersectionNormal) > 0) {
            intersectionNormal = intersectionNormal.invert();
            inside = true;
        }

        var mat = element.getMaterial();
        for(var i=0; i<elementsLen; i++)
        {
            var el = elements[i];
            var lightMat = el.getMaterial();
            if(lightMat.emissionColor.x > 0 || lightMat.emissionColor.y > 0 || lightMat.emissionColor.z > 0)
            {
                // light source
                var transmission = new Vector3(1, 1, 1);
                var lightDirection = el.getCenter().subtract(intersectionPoint);
                lightDirection = lightDirection.normalize();
                var lightHitInfo = {t0:INFINITY, t1:INFINITY};

                for(var j=0; j<elementsLen; j++)
                {
                    if(i != j) {
                       if(elements[j].intersect(intersectionPoint.add(intersectionNormal.multiply(bias)), lightDirection, lightHitInfo)) {
                            transmission.x = 0;
                            transmission.y = 0;
                            transmission.z = 0;
                            break;
                        }
                    }

                }

                var lightRatio = Math.max(0, intersectionNormal.dot(lightDirection));

                surfaceColor = surfaceColor.add(mat.surfaceColor.product(transmission).product(lightMat.emissionColor.multiply(lightRatio)));
            }
        }

        surfaceColor = surfaceColor.add(mat.emissionColor);
        return surfaceColor;
    }

}
