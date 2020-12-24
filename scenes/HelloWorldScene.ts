import Phaser from "phaser";

export default class HelloWorldScene extends Phaser.Scene {
  constructor() {
    super("hello-world");
  }

  preload() {
    this.load.image("ship", "assets/sprites/ship.png");
    this.load.image("tower", "assets/sprites/tower.png");
  }

  renderUI() {
    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0x2ecc40);
    graphics.strokeLineShape(new Phaser.Geom.Line(0, 400, 600, 400));
  }

  create() {
    // this.add.image(400, 300, "wood");
    this.renderUI();

    const particles = this.add.particles("tower");
    const emitter = particles.createEmitter({
      speed: 100,
      scale: { start: 1, end: 0 },
      blendMode: "ADD"
    });

    const logo = this.physics.add.image(400, 100, "ship");

    logo.setVelocity(100, 200);
    logo.setBounce(1, 1);
    logo.setCollideWorldBounds(true);

    emitter.startFollow(logo);
  }
}
