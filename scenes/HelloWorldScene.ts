import Phaser, { Game, Math as PhaserMath } from "phaser";
import EasyStar from "easystarjs";
import { TILE_SIZE, SCREEN_H, SCREEN_W } from "../constants";
const HALF_TILE = TILE_SIZE / 2;

export default class HelloWorldScene extends Phaser.Scene {
  that = this;
  map: Phaser.Tilemaps.Tilemap;
  marker: Phaser.GameObjects.Graphics;
  attackLines: Phaser.GameObjects.Graphics;
  finder: EasyStar.js;
  ship: Phaser.Physics.Arcade.Image;
  towers: any;
  towerTileIds: any;
  towerLines: any;
  tileLayer: Phaser.Tilemaps.StaticTilemapLayer;

  constructor() {
    super("hello-world");
    this.towers = [];
    this.towerTileIds = [];
    this.towerLines = [];
  }

  preload() {
    this.load.image("tileset", "assets/sprites/gridtiles.png");
    this.load.tilemapTiledJSON("map", "assets/data/map.json");
    this.load.image("ship", "assets/sprites/ship.png");
    this.load.image("tower", "assets/sprites/tower.png");
    this.load.image("bullet", "assets/sprites/bullet.png");
  }

  renderUI() {
    const graphics = this.add.graphics();
    const lineY = (TILE_SIZE * SCREEN_H) / 2;
    const splitLine = new Phaser.Geom.Line(0, lineY, 600, lineY);
    graphics.lineStyle(4, 0x2ecc40);
    graphics.strokeLineShape(splitLine);
  }

  drawAttackLine(line: Phaser.Geom.Line, x1, y1, x2, y2) {
    line.setTo(x1, y1, x2, y2);
    this.attackLines.strokeLineShape(line);
  }

  distance(x1, y1, x2, y2) {
    let y = x2 - x1;
    let x = y2 - y1;
    return Math.sqrt(x * x + y * y);
  }

  calcAngle(x1, y1, x2, y2) {
    let dy = x2 - x1;
    let dx = y2 - y1;
    let theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
    if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta;
  }

  renderAttacks() {
    this.attackLines.clear();
    this.towers.forEach((tower) => {
      const { x, y } = tower;
      if (!tower.line) {
        // console.log("CREANDO LINEA");
        tower.line = new Phaser.Geom.Line(50, 50, 50, 50);
      }
      const { pixelX, pixelY } = this.tileLayer.getTileAt(x, y);

      if (this.distance(pixelX, pixelY, this.ship.x, this.ship.y) < 200) {
        /* this.drawAttackLine(
          tower.line,
          pixelX + HALF_TILE,
          pixelY + HALF_TILE,
          this.ship.x + HALF_TILE,
          this.ship.y + HALF_TILE
        );
        */
        if (tower.emitter) {
          // const angle = this.calcAngle(pixelX, pixelY, this.ship.x, this.ship.y);
          const between = PhaserMath.Angle.Between(
            pixelX,
            pixelY,
            this.ship.x,
            this.ship.y
          );
          const angle = between;
          const ok = angle * (180 / Math.PI);
          // const angle = PhaserMath.Angle.Wrap(between);
          // const angle = PhaserMath.Angle.WrapDegrees(between);
          // const angle = between * 180;
          // console.log(normalized);
          // tower.emitter.startFollow(this.ship);
          tower.emitter.setAngle(ok);
          tower.emitter.resume();
          /*
          tower.emitter.setDeathZone({
            source: new Phaser.Geom.Circle(this.ship.x, this.ship.y, 24),
            type: "onEnter"
          });
          */
          tower.label.setText(parseInt(ok));
          /* tower.emitter.moveToX = this.ship.x;
          tower.emitter.moveToY = this.ship.y; */
        }
      } else {
        tower.emitter.killAll();
        tower.emitter.pause();
        tower.label.setText("");
      }
    });
  }

  create() {
    // this.add.image(400, 300, "background");

    this.input.on("pointerup", (pointer) => {
      const round = (v) => Math.floor(v / TILE_SIZE);
      const x = pointer.x;
      const y = pointer.y;
      const toX = round(x);
      const toY = round(y);
      const fromX = round(this.ship.x);
      const fromY = round(this.ship.y);

      console.log(fromX, fromY, toX, toY);
      console.log("Finding...");
      this.finder.findPath(fromX, fromY, toX, toY, (path) => {
        if (path === null) {
          console.warn("Path not found!");
        } else {
          console.log(path);
          this.moveChar(path);
        }
      });
      this.finder.calculate();
    });

    // Display map
    this.map = this.make.tilemap({ key: "map" });
    const tiles = this.map.addTilesetImage("tiles", "tileset");
    this.tileLayer = this.map.createStaticLayer(0, tiles, 0, 0);

    // this.tileLayer.setCollisionByExclusion([-1, 20], true);

    this.renderUI();

    this.attackLines = this.add.graphics();
    this.attackLines.lineStyle(1, 0x2ecc40);
    // this.renderAttacks();

    // Marker following the mouse
    this.marker = this.add.graphics();
    this.marker.lineStyle(3, 0xffffff, 1);
    this.marker.strokeRect(0, 0, this.map.tileWidth, this.map.tileHeight);

    // Path finder
    this.finder = new EasyStar.js();
    this.finder.enableDiagonals();
    this.finder.disableCornerCutting();

    // Set up walkable tiles
    const tileset = this.map.tilesets[0];
    const properties = tileset.tileProperties;
    const walkableTiles = [];

    for (let i = tileset.firstgid - 1; i < tiles.total; i++) {
      if (!properties.hasOwnProperty(i)) {
        // No property, it is walkable
        walkableTiles.push(i + 1);
        continue;
      }
      // Tile is defined!
      if (!properties[i].collide) {
        walkableTiles.push(i + 1);
      }
      // If tower!
      if (properties[i].tower) {
        this.towerTileIds.push(i + 1);
      }
    }
    this.finder.setAcceptableTiles(walkableTiles);

    // Create 2D representation of map for pathfinder
    const grid = [];
    for (let y = 0; y < this.map.height; y++) {
      let col = [];
      for (let x = 0; x < this.map.width; x++) {
        const tileId = this.tileLayer.getTileAt(x, y).index;
        if (this.towerTileIds.includes(tileId)) {
          const particles = this.add.particles("bullet");
          const emitter = particles.createEmitter({
            speed: 500,
            quantity: 1,
            lifespan: 300,
            frequency: 800,
            scale: { start: 1, end: 0 },
            blendMode: "MULTIPLY",
            on: true,
            x: x * TILE_SIZE + HALF_TILE,
            y: y * TILE_SIZE + HALF_TILE
            /*
            moveToX: 100,
            moveToY: 100,
            */
          });
          const label = this.add.text(x * TILE_SIZE + 3, y * TILE_SIZE, "", {});
          label.setFontSize(10);

          const tower = {
            x,
            y,
            type: tileId,
            emitter,
            label
          };
          this.towers.push(tower);
        }
        col.push(tileId);
      }
      grid.push(col);
    }
    this.finder.setGrid(grid);

    this.ship = this.physics.add.image(32, 32, "ship");
    this.ship.setOrigin(0, 0);
    this.ship.setVelocity(0, 0);
    this.ship.setBounce(1, 1);
    this.ship.setCollideWorldBounds(true);
    this.physics.add.collider(this.ship, this.tileLayer);

    // emitter.startFollow(ship);
  }

  handleClick = (pointer) => {
    console.log("Test", this);
  };

  moveChar(path) {
    const dist = (x1, y1, x2, y2) => {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };
    const speed = 7;
    const tweens = [];
    for (let i = 0; i < path.length - 1; i++) {
      const ex = path[i + 1].x;
      const ey = path[i + 1].y;

      const curx = path[i].x;
      const cury = path[i].y;
      const distance = dist(curx, cury, ex, ey);
      const duration = (distance / speed) * 1000;

      tweens.push({
        targets: this.ship,
        x: { value: ex * TILE_SIZE, duration },
        y: { value: ey * TILE_SIZE, duration }
      });
    }

    this.tweens.killAll();
    this.tweens.timeline({
      tweens: tweens
    });
  }

  update() {
    const worldPoint = this.input.activePointer.position;

    const pointerTileX = this.map.worldToTileX(worldPoint.x);
    const pointerTileY = this.map.worldToTileY(worldPoint.y);
    this.marker.x = this.map.tileToWorldX(pointerTileX);
    this.marker.y = this.map.tileToWorldY(pointerTileY);
    this.marker.setVisible(true);
    this.renderAttacks();
    // this.marker.setVisible(this.checkCollision(pointerTileX, pointerTileY));
  }

  checkCollision(x, y) {
    const tile = this.map.getTileAt(x, y);
    if (!tile) return false;
    return tile.properties.collide === true;
  }
}
