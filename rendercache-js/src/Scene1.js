import Scene from "./Scene.js";
import Material from "./Material.js";
import Sphere from "./Sphere.js";
import Vector3 from "./Vector3.js";

export default class Scene1 extends Scene {
  constructor() {
    super();

    this.add(
      new Sphere(
        new Vector3(0, 0, 0),
        2,
        new Material(new Vector3(0.9, 0.0, 0.0), 0, 0, new Vector3())
      )
    );

    // add spheres
    this.add(
      new Sphere(
        new Vector3(-5, 0, -5),
        2,
        new Material(new Vector3(0.0, 0.9, 0.0), 0, 0, new Vector3())
      )
    );

    this.add(
      new Sphere(
        new Vector3(5, 0, -5),
        2,
        new Material(new Vector3(0.0, 0.0, 0.9), 0, 0, new Vector3())
      )
    );

    // add light
    this.add(
      new Sphere(
        new Vector3(20, 20, -30),
        1,
        new Material(new Vector3(), 0, 0, new Vector3(0.5, 0.5, 0.5))
      )
    );



    // configure background
    this.backgroundColor = new Vector3(0.1, 0.1, 0.1);
  }
}
