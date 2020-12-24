import Phaser from "phaser";
import HelloWorldScene from "./scenes/HelloWorldScene";
import { TILE_SIZE, SCREEN_H, SCREEN_W } from "./constants";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: SCREEN_W * TILE_SIZE,
  height: SCREEN_H * TILE_SIZE,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }
    }
  },
  scene: [HelloWorldScene]
};

export default new Phaser.Game(config);
