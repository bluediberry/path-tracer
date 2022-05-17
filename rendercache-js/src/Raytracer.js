import Vector3 from './Vector3.js'

const MAX_RAY_DEPTH = 1;
const INFINITY = 1e8;

/**
 * @class RayTracer
 */
export default class Raytracer {
	
    constructor(scene, camera) {
		this.scene = scene;
		this.camera = camera;
    }

    trace(rayOrigin, sample, depth) {
        var tnear = INFINITY;
        var element = null;

        var elements = this.scene.getElements();
        var elementsLen = elements.length;

        var hitInfo = {t0:INFINITY, t1:INFINITY};
        for(var i=0; i<elementsLen; i++) {
            hitInfo.t0 = INFINITY;
            hitInfo.t1 = INFINITY;
            var el = elements[i];
            if(el.intersect(rayOrigin, sample.rayDir, hitInfo)) {
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
            sample.hit = rayOrigin.add(sample.rayDir.multiply(100000.0));
            sample.normalDir = new Vector3(-sample.hit.x, -sample.hit.y, -sample.hit.z); 
			// no hit, return background color
			return this.scene.backgroundColor;
        }

        var surfaceColor = new Vector3(0,0,0);
        var intersectionPoint = rayOrigin.add(sample.rayDir.multiply(tnear));
        var intersectionNormal = element.getNormal(intersectionPoint);

		sample.hit = intersectionPoint.clone();
		sample.normalDir = intersectionNormal.normalize();

        var bias = 1e-4;
        var inside = false;
        if (sample.rayDir.dot(intersectionNormal) > 0) {
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
