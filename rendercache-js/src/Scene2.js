import Scene from "./Scene.js";
import Material from "./Material.js";
import Sphere from "./Sphere.js";
import Vector3 from "./Vector3.js";

export default class Scene2 extends Scene {
  constructor() {
    super();

    // add background sphere
    this.add(
      new Sphere(
        new Vector3(0.0, -10004, -20),
        10000,
        new Material(new Vector3(0.2, 0.2, 0.2), 0, 0, new Vector3())
      )
    );

    // add spheres
    this.add(
      new Sphere(
        new Vector3(0, 0, -20),
        5,
        new Material(new Vector3(1.0, 0.32, 0.36), 1, 0.5, new Vector3())
      )
    );
    /*this.add(
      new Sphere(
        new Vector3(5, -1, -15),
        2,
        new Material(new Vector3(0.9, 0.76, 0.46), 1, 0, new Vector3())
      )
    );
    this.add(
      new Sphere(
        new Vector3(5, 0, -25),
        3,
        new Material(new Vector3(0.65, 0.77, 0.97), 1, 0, new Vector3())
      )
    );
    this.add(
      new Sphere(
        new Vector3(-5.5, 0, -15),
        3,
        new Material(new Vector3(0.9, 0.9, 0.9), 1, 0, new Vector3())
      )
    );*/

    // add light
    this.add(
      new Sphere(
        new Vector3(0, 20, -30),
        3,
        new Material(new Vector3(), 0, 0, new Vector3(0.5, 0.5, 0.5))
      )
    );
    this.add(
      new Sphere(
        new Vector3(0, 10, 10),
        3,
        new Material(new Vector3(), 0, 0, new Vector3(1,1,1))
      )
    );
    this.add(
      new Sphere(
        new Vector3(0, 30, 30),
        1,
        new Material(new Vector3(), 0, 0, new Vector3(0.5, 0.5, 0.5))
      )
    );

    this.backgroundColor = new Vector3(0.5, 0.5, 1.0);
  }
}
