const WIDTH = 720;
const HEIGHT = 720;
const CENTER_X = WIDTH / 2;
const CENTER_Y = WIDTH / 2;
const FPS = 60;

const MOUSE_LEFT = 0;
const MOUSE_RIGHT = 2;

const ARROW_LEFT = "ArrowLeft";
const ARROW_RIGHT = "ArrowRight";

document.addEventListener("DOMContentLoaded", async () => {
  /** @type HTMLCanvasElement */
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const inp = new InputManager(canvas);
  canvas.focus();

  await run(new CleanUpMinigame(), ctx, inp);
  await run(new PhoneInBedMinigame(), ctx, inp);
  await run(new MeowMinigame(), ctx, inp);
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
    this.offsetX = canvas.offsetLeft;
    this.offsetY = canvas.offsetTop;


    /**
     * @type {(() => ())[]}
     */
    this.queue = [];

    canvas.addEventListener("keydown", (evt) =>
      this.queue.push(() => this.onKeyDown(evt)),
    );
    canvas.addEventListener("keyup", (evt) =>
      this.queue.push(() => this.onKeyUp(evt)),
    );
    canvas.addEventListener("mousedown", (evt) =>
      this.queue.push(() => this.onMouseDown(evt)),
    );
    canvas.addEventListener("mouseup", (evt) =>
      this.queue.push(() => this.onMouseUp(evt)),
    );
    canvas.addEventListener("mousemove", (evt) =>
      this.queue.push(() => this.onMouseMove(evt)),
    );
  }

  isKeyDown(code) {
    return this.down.has(`k${code}`);
  }

  isKeyUp(code) {
    return this.up.has(`k${code}`);
  }

  isKeyPressed(code) {
    return this.pressed.has(`k${code}`);
  }

  isMouseDown(button) {
    return this.down.has(`m${button}`);
  }

  isMouseUp(button) {
    return this.up.has(`m${button}`);
  }

  isMousePressed(button) {
    return this.pressed.has(`m${button}`);
  }

  /**
   * @param {KeyboardEvent} evt
   */
  onKeyDown(evt) {
    if (!evt.repeat) {
      const key = `k${evt.key}`;
      this.up.delete(key);
      this.down.add(key);
      this.pressed.add(key);
    }
  }

  /**
   * @param {KeyboardEvent} evt
   */
  onKeyUp(evt) {
    const key = `k${evt.key}`;
    this.down.delete(key);
    this.pressed.delete(key);
    this.up.add(key);
  }

  /**
   * @param {MouseEvent} evt
   */
  onMouseDown(evt) {
    const key = `m${evt.button}`;
    this.down.add(key);
    this.pressed.add(key);
    this.up.delete(key);
  }

  /**
   * @param {MouseEvent} evt
   */
  onMouseUp(evt) {
    const key = `m${evt.button}`;
    this.down.delete(key);
    this.pressed.delete(key);
    this.up.add(key);
  }

  /**
   * @param {MouseEvent} evt
   */
  onMouseMove(evt) {
    this.mouseX = evt.clientX - this.offsetX;
    this.mouseY = evt.clientY - this.offsetY;
  }

  frameStart() {
    for (const f of this.queue) {
      f();
    }

    this.queue = [];
  }

  frameEnd() {
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

    console.dir(this.lerps);
  }
}

/**
 * @param {Minigame} game
 * @param {CanvasRenderingContext2D} ctx
 * @param {InputManager} inp
 */
async function run(game, ctx, inp) {
  game.setup(ctx);
  let i = 0;
  let handler = null;

  let mgr = new LerpManager();

  return new Promise((resolve, reject) => {
    handler = setInterval(() => {
      i += 1;
      if (i > FPS * game.time()) {
        clearInterval(handler);
        resolve(null);
      }

      inp.frameStart();
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      game.loop(ctx, i, mgr, inp);
      mgr.loop();
      inp.frameEnd();
    }, 1000.0 / FPS);
  });
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

class PhoneInBedMinigame {
  constructor() {
    this.x = WIDTH / 2;
    this.y = (HEIGHT * 3) / 4;
    this.vx = 0;
    this.vy = 0;
    this.width = 256;
    this.height = 256;
    this.phone = new Image();
    this.phone.src = "assets/PHONE.png";
    this.patty = new Image();
    this.patty.src = "assets/PATTY_BED.png";
    this.state = 4;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  setup(ctx) {}

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} i
   * @param {LerpManager} mgr
   * @param {InputManager} inp
   */
  loop(ctx, i, mgr, inp) {
    console.dir(this.state);
    switch (this.state) {
      case 4:
        mgr.timeout(() => {
          this.state--;
          mgr.timeout(() => {
            this.state--;
            mgr.timeout(() => {
              this.state--;
            }, FPS);
          }, FPS);
        }, FPS);
        this.state--;
      case 3:
      case 2:
      case 1:
        const l = this.state.toString();
        ctx.font = "40px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.fillText(l, WIDTH / 2, HEIGHT / 2);
        break;
      case 0:
        ctx.drawImage(this.phone, 0, 0, WIDTH, HEIGHT);

        const C = 1;

        const left = inp.isKeyDown(ARROW_LEFT);
        const right = inp.isKeyDown(ARROW_RIGHT);

        this.vy -= C;

        const D = 5;

        if (left && !right) {
          // this.vx -= D;
          this.vy += D;
        }

        if (right && !left) {
          // this.vx += D;
          this.vy += D;
        }

        this.x += this.vx;
        this.y += this.vy;

        this.x = Math.min(WIDTH, Math.max(0, this.x));
        this.y = Math.min(HEIGHT, Math.max(0, this.y));

        ctx.drawImage(
          this.patty,
          this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height,
        );
        break;
    }
  }

  /**
   * @returns {Number}
   */
  time() {
    return 10;
  }
}

/**
 *
 * @param {string} src
 * @returns {HTMLImageElement}
 */
function load(src) {
  const image = new Image();
  image.src = src;
  return image;
}

class GrabbableThing {
  constructor(x, y, w, h, img, bin, z) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.img = img;
    this.bin = bin;
    this.z = z;
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    ctx.drawImage(
      this.img,
      this.x - this.w / 2,
      this.y - this.h / 2,
      this.w,
      this.h,
    );
  }

  contains(x, y) {
    return (
      this.x - this.w / 2 <= x &&
      x <= this.x + this.w / 2 &&
      this.y - this.h / 2 <= y &&
      y <= this.y + this.h / 2
    );
  }
}

class CleanUpMinigame extends Minigame {
  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  setup(ctx) {
    const thingTypes = [
      { img: load("assets/mug.jpg"), w: 64, h: 64, bin: 0 },
      { img: load("assets/bag.jpg"), w: 32, h: 32, bin: 1 },
      { img: load("assets/costco cup.jpg"), w: 32, h: 64, bin: 1 },
      { img: load("assets/hoodie.jpg"), w: 96, h: 96, bin: 2 },
    ];

    this.bins = [
      new GrabbableThing(100, 100, 200, 150, load("assets/dish bin.jpg"), 0, 0),
      new GrabbableThing(
        300,
        400,
        150,
        200,
        load("assets/trash bin.gif"),
        1,
        1,
      ),
      new GrabbableThing(500, 600, 100, 250, load("assets/hamper.jpeg"), 2, 2),
    ];

    /**
     * @type {GrabbableThing[]}
     */
    this.things = [];

    for (let z = 0; z < 50; z++) {
      const type = thingTypes[Math.floor(Math.random() * thingTypes.length)];
      const thing = new GrabbableThing(
        Math.random() * WIDTH,
        Math.random() * HEIGHT,
        type.w,
        type.h,
        type.img,
        type.bin,
        z,
      );

      this.things.push(thing);
    }

    /**
     * @type {number | null}
     */
    this.grabbed = null;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} i
   * @param {LerpManager} mgr
   * @param {InputManager} inp
   */
  loop(ctx, i, mgr, inp) {
    if (inp.isMouseDown(MOUSE_LEFT)) {
      this.grabbed = null;
      for (const i in this.things) {
        if (this.things[i].contains(inp.mouseX, inp.mouseY)) {
          this.grabbed = i;
        }
      }
    }

    if (inp.isMousePressed(MOUSE_LEFT)) {
      if (this.grabbed != null) {
        this.things[this.grabbed].x = inp.mouseX;
        this.things[this.grabbed].y = inp.mouseY;
      }
    }

    if (inp.isMouseUp(MOUSE_LEFT)) {
      if (this.grabbed) {
        const thing = this.things[this.grabbed];
        let yay = false;
        for (const x of [thing.x - thing.w / 2, thing.x + thing.w / 2]) {
          for (const y of [thing.y - thing.h / 2, thing.y + thing.h / 2]) {
            if (this.bins[this.things[this.grabbed].bin].contains(x, y)) {
              yay = true;
            }
          }
        }

        if (yay) {
          // i hate java sript
          this.things.splice(this.grabbed, 1);
        }
        this.grabbed = null;
      }
    }

    for (const bin of this.bins) {
      bin.draw(ctx);
    }

    for (const thing of this.things) {
      thing.draw(ctx);
    }
  }

  /**
   * @returns {Number}
   */
  time() {
    return 10;
  }
}

