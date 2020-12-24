import Phaser, { Game } from "phaser";
import { TILE_SIZE, SCREEN_H } from "../constants";

export default class HelloWorldScene extends Phaser.Scene {
  map: Phaser.Tilemaps.Tilemap;
  marker: Phaser.GameObjects.Graphics;

  constructor() {
    super("hello-world");
  }

  preload() {
    this.load.image("tileset", "assets/sprites/gridtiles.png");
    this.load.tilemapTiledJSON("map", "assets/data/map.json");
    this.load.image("ship", "assets/sprites/ship.png");
    this.load.image("tower", "assets/sprites/tower.png");
  }

  renderUI(graphics) {
    const lineY = (TILE_SIZE * SCREEN_H) / 2;
    const splitLine = new Phaser.Geom.Line(0, lineY, 600, lineY);
    graphics.lineStyle(4, 0x2ecc40);
    graphics.strokeLineShape(splitLine);
  }

  create() {
    // this.add.image(400, 300, "background");

    const graphics = this.add.graphics();
    this.renderUI(graphics);

    // Display map
    this.map = this.make.tilemap({ key: "map" });
    const tiles = this.map.addTilesetImage("tiles", "tileset");
    this.map.createStaticLayer(0, tiles, 0, 0);

    // Marker following the mouse
    this.marker = this.add.graphics();
    this.marker.lineStyle(3, 0xffffff, 1);
    this.marker.strokeRect(0, 0, this.map.tileWidth, this.map.tileHeight);

    /*
    const particles = this.add.particles("tower");
    const emitter = particles.createEmitter({
      speed: 100,
      scale: { start: 1, end: 0 },
      blendMode: "ADD"
    });
    */

    const ship = this.physics.add.image(400, 100, "ship");

    ship.setVelocity(0, 200);
    ship.setBounce(1, 1);
    ship.setCollideWorldBounds(true);

    // emitter.startFollow(ship);
  }

  update() {
    const worldPoint = this.input.activePointer.position;

    const pointerTileX = this.map.worldToTileX(worldPoint.x);
    const pointerTileY = this.map.worldToTileY(worldPoint.y);
    this.marker.x = this.map.tileToWorldX(pointerTileX);
    this.marker.y = this.map.tileToWorldY(pointerTileY);
    this.marker.setVisible(true);
    // this.marker.setVisible(this.checkCollision(pointerTileX, pointerTileY));
  }

  checkCollision(x, y) {
    const tile = this.map.getTileAt(x, y);
    if (!tile) return false;
    return tile.properties.collide === true;
  }
}
