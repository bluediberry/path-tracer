
import Vector3 from '../src/Vector3.js'

export default class Camera {
	constructor(from, to, fov, width, height) {
		this.fov = fov;
		this.width = width;
		this.height = height;
		this.aspectRatio = this.width / this.height;
		this.angle = Math.tan(Math.PI * 0.5 * fov / 180);
		this.from  = from;
		this.to = to;
		var dirVec = to;
		dirVec.subtract(from);
		this.dir = dirVec.normalize()// subtracao e normalizacao de to-from
		this.almost_zero = 1.0E-08;
		this.max_real = 3.402823466E+38;

		//eye??
		this.eye = new Vector3();
		this.ViewDirNorm = new Vector3();

	}


	getDir (x,y) {
		return // vector normalizado de direcao que sai de from, e passa por pixel x,y (pixel da imagem width, height)
	}

	reprojectPixel(element, result)
{
	var temp, pointInImage = new Vector3();
	var distance, t = undefined;
	var depth, d;

	//D3_VecSub(Element->Hit,Eye,Temp);
	temp = element.hit.subtract(this.eye);				// VP=P - V

	if (this.dir.dotProduct(temp) < this.almost_zero)
	{
		// Point is behind view direction

		result.x = -1;
		result.y = -1;
		depth = -1.0;
		return false;
	}

	depth = temp.normalize();

	if (depth == 0.0)
	{
		return false;
	}
	
	t = PolyNormal.dotProduct(temp);				// T=Dot(N,VP)

	if (fabs(t) < this.almost_zero)
	{
		return false;
	}
	
	distance = d/t;									// (Dot(N,C)-Dot(N,V)) / T

	if (distance > this.max_real)
	{
		return false;
	}	

	//D3_VecScalMult(Distance,Temp,PointInImage);
	//D3_VecSub(PointInImage,ViewDir,Temp)
	temp.multiply(distance);
	temp.subtract(ViewDir);

	if (fabs(ReprojectionFactor) > this.almost_zero)
	{
		temp.y = ((temp.y - Matrix[1][3]) * Matrix[0][0] + (Matrix[0][3] - temp.x) * Matrix[1][0]) * OneOverReprojectionFactor;
		temp.x = (temp.x - Matrix[0][3]  - Matrix[0][1] *  temp.y) * OneOverMatrix00;		
	}

	result.x = Center.x + (temp.x*PixelFactor.x) + 0.5;
	result.y = Center.y - (temp.y*PixelFactor.y) + 0.5;

	return true;
}

}