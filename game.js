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

  run(new DressUpMinigame(), ctx);
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

    canvas.addEventListener("keydown", (evt) => this.onKeyDown(evt));
    canvas.addEventListener("keyup", (evt) => this.onKeyUp(evt));
    canvas.addEventListener("mousedown", (evt) => this.onMouseDown(evt));
    canvas.addEventListener("mouseup", (evt) => this.onMouseUp(evt));
    canvas.addEventListener("mousemove", (evt) => this.onMouseMove(evt));
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
    const key = `k${evt.key}`;
    this.up.delete(key);
    this.down.add(key);
    this.pressed.add(key);
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

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      game.loop(ctx, i, mgr, inp);
      mgr.loop();
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

class DressUpMinigame extends Minigame {

  static Outfit = {
    CUTE: 1,
    GOOD: 2,
    DEPRESSED: 0
  };

  /**
   * @param {CanvasRenderingContext2D} ctx
   */

  setup(ctx) {
    // how we want it to start
    // make it such that the screen of outfits is up, 3 outfits: 1 really bad one, 1 good one, 1 eh one

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // for the confirm button
    ctx.fillStyle = "grey";
    ctx.fillRect(CENTER_X - (CENTER_X / 2), CENTER_Y + 100 + (CENTER_Y / 2), WIDTH / 2, HEIGHT /12);

    // patty TODO: CHANGE TO ACTUAL PHOTO
    this.patty = new Image();
    this.patty.src = "https://img.freepik.com/free-vector/cute-cartoon-cow-illustration_1308-176774.jpg";
    

    // arrows
    this.right_arrow_hat = new Image();
    this.right_arrow_hat.src = "https://thumb.ac-illust.com/34/34d2b78a1be7d243530998ce06a184f5_t.jpeg";
    this.right_arrow_hat.width = 100;
    this.right_arrow_hat.height = 100;

    this.right_arrow_top = new Image();
    this.right_arrow_top.src = "https://thumb.ac-illust.com/34/34d2b78a1be7d243530998ce06a184f5_t.jpeg";
    this.right_arrow_top.width = 100;
    this.right_arrow_top.height = 100;

    this.right_arrow_bottom = new Image();
    this.right_arrow_bottom.src = "https://thumb.ac-illust.com/34/34d2b78a1be7d243530998ce06a184f5_t.jpeg";
    this.right_arrow_bottom.width = 100;
    this.right_arrow_bottom.height = 100;

    // for these arrows, flip the other ones... maybe do it after downloading instead of how they're being hosted rn
    this.left_arrow_hat = new Image();
    this.left_arrow_hat.src = "https://dinopixel.com/preload/0324/arrow.png";
    this.left_arrow_hat.width = 100;
    this.left_arrow_hat.height = 100;

    this.left_arrow_top = new Image();
    this.left_arrow_top.src = "https://dinopixel.com/preload/0324/arrow.png";
    this.left_arrow_top.width = 100;
    this.left_arrow_top.height = 100;

    this.left_arrow_bottom = new Image();
    this.left_arrow_bottom.src = "https://dinopixel.com/preload/0324/arrow.png";
    this.left_arrow_bottom.width = 100;
    this.left_arrow_bottom.height = 100;
    

    // state machine for each thing
    this.hat_state = DressUpMinigame.Outfit.DEPRESSED;
    this.top_state = DressUpMinigame.Outfit.DEPRESSED;
    this.bottom_state = DressUpMinigame.Outfit.DEPRESSED;

    // the potential fits fr
    this.hat = new Image();
    this.hat_depressed = "https://onlinepngtools.com/images/examples-onlinepngtools/empty-transparent.png";
    this.hat_cute = "https://png.pngtree.com/png-vector/20230120/ourmid/pngtree-straw-hat-cartoon-illustration-png-image_6562738.png"
    this.hat_good = "https://png.pngtree.com/element_our/20190604/ourmid/pngtree-hat-straw-hat-cute-image_1484940.jpg"
    

  }


  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} i
   */
  loop(ctx, i) {
    // patty in the middle with arrows that are clickable to change that outfit
    // button will be the ending to the loop if not the timer
    // timer in the top left

    
    // for the confirm button
    ctx.fillStyle = "grey";
    ctx.fillRect(CENTER_X - (CENTER_X / 2), CENTER_Y + 100 + (CENTER_Y / 2), WIDTH / 2, HEIGHT /12);

    // the constant images
    ctx.drawImage(this.patty, CENTER_X - WIDTH / 4, CENTER_Y - HEIGHT / 3, WIDTH / 2, HEIGHT / 1.5);
    ctx.drawImage(this.right_arrow_hat, CENTER_X + 250- this.right_arrow_hat.width / 2, CENTER_Y - 200 - this.right_arrow_hat.height / 2, this.right_arrow_hat.width, this.right_arrow_hat.height);
    ctx.drawImage(this.right_arrow_top, CENTER_X + 250- this.right_arrow_top.width / 2, CENTER_Y - 50 - this.right_arrow_top.height / 2, this.right_arrow_top.width, this.right_arrow_top.height);
    ctx.drawImage(this.right_arrow_bottom, CENTER_X + 250- this.right_arrow_bottom.width / 2, CENTER_Y + 100  - this.right_arrow_bottom.height / 2, this.right_arrow_bottom.width, this.right_arrow_bottom.height);
    ctx.drawImage(this.left_arrow_hat, CENTER_X - 250- this.left_arrow_hat.width / 2, CENTER_Y - 200 - this.left_arrow_hat.height / 2, this.left_arrow_hat.width, this.left_arrow_hat.height);
    ctx.drawImage(this.left_arrow_top, CENTER_X - 250- this.left_arrow_top.width / 2, CENTER_Y - 50  - this.left_arrow_top.height / 2, this.left_arrow_top.width, this.left_arrow_top.height);
    ctx.drawImage(this.left_arrow_bottom, CENTER_X - 250- this.left_arrow_bottom.width / 2, CENTER_Y + 100  - this.left_arrow_bottom.height / 2, this.left_arrow_bottom.width, this.left_arrow_bottom.height);

    
    // yipepee yipeee yipee
    if (this.hat_state == DressUpMinigame.Outfit.CUTE) {
      this.hat.src = this.hat_cute;
      console.log("we are doin things");

    }

    else if (this.hat_state == DressUpMinigame.Outfit.GOOD) {
      this.hat.src = this.hat_good;
      console.log("we are doin things");

    }
    else {
      this.hat.src = this.hat_depressed;
      console.log("we are doing things");
    }

    ctx.drawImage(this.hat, CENTER_X - 50, CENTER_Y - 250, 100, 100);

    // CONTROL LOGIC FOR the arrow stuff
    if ()
    

  }

  /**
   * @returns {Number}
   */
  time () {
    // how long we want minigame to last!
    return 20;
  }
  
}

  class PhoneInBedMinigame {
    constructor() {
      this.x = WIDTH / 2;
      this.y = (HEIGHT * 3) / 4;
      this.vx = 0;
      this.vy = 0;
      this.width = 64;
      this.height = 96;
      this.phone;
    }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  setup(ctx) {}
  
  /**
   * @param {LerpManager} mgr
   * @param {InputManager} inp
   */
  loop(ctx, i, mgr, inp) {
    ctx.fillStyle = "black";
    ctx.fillRect(WIDTH / 2 - 64, 0, 128, 128);

    const C = 10;

    let ax = 0;
    let ay = 0;

    const dx = this.x - WIDTH / 2;
    const dy = this.y - 64;

    const d = dy * dy + dx * dx;

    if (d !== 0) {
      const denom = Math.max(0.01, Math.pow(d, 3 / 4));
      ax += -(Math.sign(dx) * (C * Math.pow(dx, 2))) / denom;
      ay += -(Math.sign(dy) * (C * (Math.abs(dy) + Math.abs(dx)))) / denom;
    }

    const left = inp.isKeyDown(ARROW_LEFT);
    const right = inp.isKeyDown(ARROW_RIGHT);

    const D = 1.2;

    if (left && !right) {
      this.vx -= D;
      this.vy += D;
    }

    if (right && !left) {
      this.vx += D;
      this.vy += D;
    }

    console.dir(
      `(${ax}, ${ay}), (${this.vx}, ${this.vy}), (${this.x}, ${this.y})`,
    );

    this.vx += ax;
    this.vy += ay;
    this.x += this.vx;
    this.y += this.vy;

    ctx.fillStyle = "#0xdeadbe";
    ctx.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
    );
  }

  /**
   * @returns {Number}
   */
  time() {
    return 10;
  }
  
}
