const WIDTH = 720;
const HEIGHT = 720;
const CENTER_X = WIDTH / 2;
const CENTER_Y = WIDTH / 2;
const FPS = 60;

document.addEventListener("DOMContentLoaded", () => {
  /** @type HTMLCanvasElement */
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const inp = new InputManager(canvas);

  run(new MeowMinigame(), ctx, inp);
});

class InputManager {
  /**
   * don't change this or i will kill you
   * @type {number}
   */
  mouseX;

  /**
   * don't change this or i will kill you
   * @type {number}
   */
  mouseY;

  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.down = new Set();
    this.pressed = new Set();
    this.up = new Set();
    this.mouseX = 0;
    this.mouseY = 0;

    canvas.addEventListener("keydown", (evt) => this.onKeyDown(evt));
    canvas.addEventListener("keyup", (evt) => this.onKeyUp(evt));
    canvas.addEventListener("mousedown", (evt) => this.onMouseDown(evt));
    canvas.addEventListener("mouseup", (evt) => this.onMouseUp(evt));
    canvas.addEventListener("mousemove", (evt) => this.onMouseMove(evt));
  }

  isKeyDown(code) {
    return this.down.has({ key: code });
  }

  isKeyUp(code) {
    return this.up.has({ key: code });
  }

  isKeyPressed(code) {
    return this.pressed.has({ key: code });
  }

  isMouseDown(button) {
    return this.down.has({ mouse: button });
  }

  isMouseUp(button) {
    return this.up.has({ mouse: button });
  }

  isMousePressed(button) {
    return this.pressed.has({ mouse: button });
  }

  /**
   * @param {KeyboardEvent} evt
   */
  onKeyDown(evt) {
    this.up.remove({ key: evt.key });
    this.down.add({ key: evt.key });
    this.pressed.add({ key: evt.key });
  }

  /**
   * @param {KeyboardEvent} evt
   */
  onKeyUp(evt) {
    this.down.remove({ key: evt.key });
    this.pressed.remove({ key: evt.key });
    this.up.add({ key: evt.key });
  }

  /**
   * @param {MouseEvent} evt
   */
  onMouseDown(evt) {
    this.down.add({ mouse: evt.button });
    this.pressed.add({ mouse: evt.button });
    this.up.remove({ mouse: evt.button });
  }

  /**
   * @param {MouseEvent} evt
   */
  onMouseUp(evt) {
    this.down.remove({ mouse: evt.button });
    this.pressed.remove({ mouse: evt.button });
    this.up.add({ mouse: evt.button });
  }

  /**
   * @param {MouseEvent} evt
   */
  onMouseMove(evt) {
    this.mouseX = evt.clientX;
    this.mouseY = evt.clientY;
  }

  nextFrame() {
    this.up.clear();
    this.down.clear();
  }
}

class LerpManager {
  /**
   * @type {{ lerp: (i: number) => (), left: number }[]}
   */
  lerps;

  constructor() {
    this.lerps = [];
  }

  loop() {
    let next = [];
    for (const { lerp, left } of this.lerps) {
      lerp(left);
      if (left > 0) {
        next.push({ lerp, left: left - 1 });
      }
    }

    this.lerps = next;
  }

  /**
   * @param {(i: number) => ()} lerp
   * @param {number} frames
   */
  add(lerp, frames) {
    this.lerps.push({ lerp, left: frames });
  }

  /**
   * @param {() => ()} cb
   * @param {number} time
   */
  timeout(cb, time) {
    this.lerps.push({
      lerp: (i) => {
        if (i == 0) {
          cb();
        }
      },
      left: time,
    });
  }
}

/**
 * @param {Minigame} game
 * @param {CanvasRenderingContext2D} ctx
 * @param {InputManager} inp
 */
function run(game, ctx, inp) {
  game.setup(ctx);
  let i = 0;
  let handler = null;

  let mgr = new LerpManager();

  handler = setInterval(() => {
    i += 1;
    if (i > FPS * game.time()) {
      clearInterval(handler);
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    game.loop(ctx, i, mgr, inp);
    mgr.loop();
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
   * @param {LerpManager} mgr
   * @param {InputManager} inp
   */
  loop(ctx, i, mgr, inp) {
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
   * @param {LerpManager} mgr
   * @param {InputManager} inp
   */
  loop(ctx, i, mgr, inp) {
    if (i % 20 == 0) {
      for (let j = 0; j < 20; j++) {
        let x = Math.random() * WIDTH;
        let y = Math.random() * HEIGHT;
        let r = Math.random() * 256;
        let g = Math.random() * 256;
        let b = Math.random() * 256;
        mgr.add((i) => {
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillText("meow", x, y);
          x += 4 * (Math.random() - 0.5);
          y += 4 * (Math.random() - 0.5);
          r = (256 / 720) * inp.mouseX;
          g = (256 / 720) * inp.mouseY;
          b = (256 / 720) * inp.mouseX;
        }, 20);
      }
    }
  }
}
