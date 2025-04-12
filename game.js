const WIDTH = 720;
const HEIGHT = 720;
const CENTER_X = WIDTH / 2;
const CENTER_Y = WIDTH / 2;
const FPS = 60;

document.addEventListener("DOMContentLoaded", () => {
  /** @type HTMLCanvasElement */
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  run(new MeowMinigame(), ctx);
});

/**
 * @param {Minigame} game
 * @param {CanvasRenderingContext2D} ctx
 */
function run(game, ctx) {
  game.setup(ctx);
  let i = 0;
  let handler = null;

  handler = setInterval(() => {
    i += 1;
    if (i > FPS * game.time()) {
      clearInterval(handler);
    }

    game.loop(ctx, i);
  }, 1000.0 / FPS);
}

class Minigame {
  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  setup(ctx) {
    throw new Error("unimplemented");
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} i
   */
  loop(ctx, i) {
    throw new Error("unimplemented");
  }

  /**
   * @returns {Number}
   */
  time() {
    throw new Error("unimplemented");
  }
}

class MeowMinigame extends Minigame {
  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  time() {
    return 10;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  setup(ctx) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} i
   */
  loop(ctx, i) {
    if (i % 7 == 0) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      for (let j = 0; j < 20; j++) {
        ctx.fillStyle = "black";
        ctx.fillText("meow", Math.random() * WIDTH, Math.random() * HEIGHT);
      }
    }
  }
}
