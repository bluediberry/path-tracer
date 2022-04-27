
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
	}


	getDir (x,y) {
		return // vector normalizado de direcao que sai de from, e passa por pixel x,y (pixel da imagem width, height)
	}

}