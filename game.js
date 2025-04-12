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

  run(new DressUpMinigame(), ctx, inp);
  // await run(new PhoneInBedMinigame(), ctx, inp);
  // await run(new MeowMinigame(), ctx, inp);
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
      this.queue.push(() => this.onKeyDown(evt))
    );
    canvas.addEventListener("keyup", (evt) =>
      this.queue.push(() => this.onKeyUp(evt))
    );
    canvas.addEventListener("mousedown", (evt) =>
      this.queue.push(() => this.onMouseDown(evt))
    );
    canvas.addEventListener("mouseup", (evt) =>
      this.queue.push(() => this.onMouseUp(evt))
    );
    canvas.addEventListener("mousemove", (evt) =>
      this.queue.push(() => this.onMouseMove(evt))
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

class DressUpMinigame extends Minigame {
  static Outfit = {
    CUTE: 1,
    GOOD: 2,
    DEPRESSED: 0,
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
    ctx.fillRect(
      CENTER_X - CENTER_X / 2,
      CENTER_Y + 100 + CENTER_Y / 2,
      WIDTH / 2,
      HEIGHT / 12
    );

    // patty TODO: CHANGE TO ACTUAL PHOTO
    this.patty = new Image();
    this.patty.src =
      "https://img.freepik.com/free-vector/cute-cartoon-cow-illustration_1308-176774.jpg";

    // arrows
    this.right_arrow_hat = new Image();
    this.right_arrow_hat.src =
      "https://thumb.ac-illust.com/34/34d2b78a1be7d243530998ce06a184f5_t.jpeg";
    this.right_arrow_hat.width = 100;
    this.right_arrow_hat.height = 100;
    this.right_arrow_hatx = CENTER_X + 250 - this.right_arrow_hat.width / 2;
    this.right_arrow_haty = CENTER_Y - 200 - this.right_arrow_hat.height / 2;

    this.right_arrow_top = new Image();
    this.right_arrow_top.src =
      "https://thumb.ac-illust.com/34/34d2b78a1be7d243530998ce06a184f5_t.jpeg";
    this.right_arrow_top.width = 100;
    this.right_arrow_top.height = 100;
    this.right_arrow_topx = CENTER_X + 250 - this.right_arrow_top.width / 2;
    this.right_arrow_topy = CENTER_Y - 50 - this.right_arrow_top.height / 2;

    this.right_arrow_bottom = new Image();
    this.right_arrow_bottom.src =
      "https://thumb.ac-illust.com/34/34d2b78a1be7d243530998ce06a184f5_t.jpeg";
    this.right_arrow_bottom.width = 100;
    this.right_arrow_bottom.height = 100;
    this.right_arrow_bottomx =
      CENTER_X + 250 - this.right_arrow_bottom.width / 2;
    this.right_arrow_bottomy =
      CENTER_Y + 100 - this.right_arrow_bottom.height / 2;

    // for these arrows, flip the other ones... maybe do it after downloading instead of how they're being hosted rn
    this.left_arrow_hat = new Image();
    this.left_arrow_hat.src = "https://dinopixel.com/preload/0324/arrow.png";
    this.left_arrow_hat.width = 100;
    this.left_arrow_hat.height = 100;
    this.left_arrow_hatx = CENTER_X - 250 - this.left_arrow_hat.width / 2;
    this.left_arrow_haty = CENTER_Y - 200 - this.left_arrow_hat.height / 2;

    this.left_arrow_top = new Image();
    this.left_arrow_top.src = "https://dinopixel.com/preload/0324/arrow.png";
    this.left_arrow_top.width = 100;
    this.left_arrow_top.height = 100;
    this.left_arrow_topx = CENTER_X - 250 - this.left_arrow_top.width / 2;
    this.left_arrow_topy = CENTER_Y - 50 - this.left_arrow_top.height / 2;

    this.left_arrow_bottom = new Image();
    this.left_arrow_bottom.src = "https://dinopixel.com/preload/0324/arrow.png";
    this.left_arrow_bottom.width = 100;
    this.left_arrow_bottom.height = 100;
    this.left_arrow_bottomx = CENTER_X - 250 - this.left_arrow_bottom.width / 2;
    this.left_arrow_bottomy =
      CENTER_Y + 100 - this.left_arrow_bottom.height / 2;

    // state machine for each thing
    this.hat_state = DressUpMinigame.Outfit.DEPRESSED;
    this.top_state = DressUpMinigame.Outfit.DEPRESSED;
    this.bottom_state = DressUpMinigame.Outfit.DEPRESSED;

    // the potential fits fr
    this.hat = new Image();
    this.hat_depressed =
      "https://onlinepngtools.com/images/examples-onlinepngtools/empty-transparent.png";
    this.hat_cute =
      "https://png.pngtree.com/png-vector/20230120/ourmid/pngtree-straw-hat-cartoon-illustration-png-image_6562738.png";
    this.hat_good =
      "https://png.pngtree.com/element_our/20190604/ourmid/pngtree-hat-straw-hat-cute-image_1484940.jpg";

    this.top = new Image();
    this.top_depressed =
      "https://onlinepngtools.com/images/examples-onlinepngtools/empty-transparent.png";
    this.top_cute =
      "https://png.pngtree.com/png-vector/20230120/ourmid/pngtree-straw-hat-cartoon-illustration-png-image_6562738.png";
    this.top_good =
      "https://png.pngtree.com/element_our/20190604/ourmid/pngtree-hat-straw-hat-cute-image_1484940.jpg";

    this.bottom = new Image();
    this.bottom_depressed =
      "https://onlinepngtools.com/images/examples-onlinepngtools/empty-transparent.png";
    this.bottom_cute =
      "https://png.pngtree.com/png-vector/20230120/ourmid/pngtree-straw-hat-cartoon-illustration-png-image_6562738.png";
    this.bottom_good =
      "https://png.pngtree.com/element_our/20190604/ourmid/pngtree-hat-straw-hat-cute-image_1484940.jpg";
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} i
   * @param {InputManager} inp
   */
  loop(ctx, i, mgr, inp) {
    // patty in the middle with arrows that are clickable to change that outfit
    // button will be the ending to the loop if not the timer
    // timer in the top left

    // for the confirm button
    ctx.fillStyle = "grey";
    ctx.fillRect(
      CENTER_X - CENTER_X / 2,
      CENTER_Y + 100 + CENTER_Y / 2,
      WIDTH / 2,
      HEIGHT / 12
    );

    // the constant images
    ctx.drawImage(
      this.patty,
      CENTER_X - WIDTH / 4,
      CENTER_Y - HEIGHT / 3,
      WIDTH / 2,
      HEIGHT / 1.5
    );
    ctx.drawImage(
      this.right_arrow_hat,
      this.right_arrow_hatx,
      this.right_arrow_haty,
      100,
      100
    );

    ctx.drawImage(
      this.right_arrow_top,
      this.right_arrow_topx,
      this.right_arrow_topy,
      this.right_arrow_top.width,
      this.right_arrow_top.height
    );
    ctx.drawImage(
      this.right_arrow_bottom,
      this.right_arrow_bottomx,
      this.right_arrow_bottomy,
      this.right_arrow_bottom.width,
      this.right_arrow_bottom.height
    );
    ctx.drawImage(
      this.left_arrow_hat,
      this.left_arrow_hatx,
      this.left_arrow_haty,
      this.left_arrow_hat.width,
      this.left_arrow_hat.height
    );
    ctx.drawImage(
      this.left_arrow_top,
      this.left_arrow_topx,
      this.left_arrow_topy,
      this.left_arrow_top.width,
      this.left_arrow_top.height
    );
    ctx.drawImage(
      this.left_arrow_bottom,
      this.left_arrow_bottomx,
      this.left_arrow_bottomy,
      this.left_arrow_bottom.width,
      this.left_arrow_bottom.height
    );

    // yipepee yipeee yipee
    if (this.hat_state == DressUpMinigame.Outfit.CUTE) {
      this.hat.src = this.hat_cute;
      console.log("we are doin things");
    } else if (this.hat_state == DressUpMinigame.Outfit.GOOD) {
      this.hat.src = this.hat_good;
      console.log("we are doin things");
    } else {
      this.hat.src = this.hat_depressed;
      console.log("we are doing things");
    }

    // yipepee yipeee yipee
    if (this.top_state == DressUpMinigame.Outfit.CUTE) {
      this.top.src = this.top_cute;
      console.log("we are doin things");
    } else if (this.top_state == DressUpMinigame.Outfit.GOOD) {
      this.top.src = this.top_good;
      console.log("we are doin things");
    } else {
      this.top.src = this.top_depressed;
      console.log("we are doing things");
    }

    // yipepee yipeee yipee
    if (this.bottom_state == DressUpMinigame.Outfit.CUTE) {
      this.bottom.src = this.bottom_cute;
      console.log("we are doin things");
    } else if (this.bottom_state == DressUpMinigame.Outfit.GOOD) {
      this.bottom.src = this.bottom_good;
      console.log("we are doin things");
    } else {
      this.bottom.src = this.bottom_depressed;
      console.log("we are doing things");
    }

    ctx.drawImage(this.hat, CENTER_X - 50, this.right_arrow_haty, 100, 100);
    ctx.drawImage(this.top, CENTER_X - 50, this.right_arrow_topy, 100, 100);
    ctx.drawImage(
      this.bottom,
      CENTER_X - 50,
      this.right_arrow_bottomy,
      100,
      100
    );

    // CONTROL LOGIC FOR the arrow stuff

    //right arrow hat
    if (
      inp.isMouseDown(MOUSE_LEFT) &&
      inp.mouseX >= this.right_arrow_hatx &&
      inp.mouseX <= this.right_arrow_hatx + 100 &&
      inp.mouseY >= this.right_arrow_haty &&
      inp.mouseY <= this.right_arrow_haty + 100
    ) {
      console.log("mouse pressed: right arrow hat");

      //use state machine to figure out which hat to do
      if (this.hat_state == DressUpMinigame.Outfit.DEPRESSED) {
        this.hat_state = DressUpMinigame.Outfit.GOOD;
      } else if (this.hat_state == DressUpMinigame.Outfit.GOOD) {
        this.hat_state = DressUpMinigame.Outfit.CUTE;
      } else {
        this.hat_state = DressUpMinigame.Outfit.DEPRESSED;
      }
    }

    // left arrow hat
    if (
      inp.isMouseDown(MOUSE_LEFT) &&
      inp.mouseX >= this.left_arrow_hatx &&
      inp.mouseX <= this.left_arrow_hatx + 100 &&
      inp.mouseY >= this.left_arrow_haty &&
      inp.mouseY <= this.left_arrow_haty + 100
    ) {
      console.log("mouse pressed: left arrow hat");

      //use state machine to figure out which hat to do
      if (this.hat_state == DressUpMinigame.Outfit.DEPRESSED) {
        this.hat_state = DressUpMinigame.Outfit.CUTE;
      } else if (this.hat_state == DressUpMinigame.Outfit.GOOD) {
        this.hat_state = DressUpMinigame.Outfit.DEPRESSED;
      } else {
        this.hat_state = DressUpMinigame.Outfit.GOOD;
      }
    }

    //right arrow top
    if (
      inp.isMouseDown(MOUSE_LEFT) &&
      inp.mouseX >= this.right_arrow_topx &&
      inp.mouseX <= this.right_arrow_topx + 100 &&
      inp.mouseY >= this.right_arrow_topy &&
      inp.mouseY <= this.right_arrow_topy + 100
    ) {
      console.log("mouse pressed: right arrow top");

      //use state machine to figure out which hat to do
      if (this.top_state == DressUpMinigame.Outfit.DEPRESSED) {
        this.top_state = DressUpMinigame.Outfit.GOOD;
      } else if (this.top_state == DressUpMinigame.Outfit.GOOD) {
        this.top_state = DressUpMinigame.Outfit.CUTE;
      } else {
        this.top_state = DressUpMinigame.Outfit.DEPRESSED;
      }
    }

    // left arrow top TODO: NEED TO MAKE A DIFFERENT STATE MACHINE FOR EACH THANG
    if (
      inp.isMouseDown(MOUSE_LEFT) &&
      inp.mouseX >= this.left_arrow_topx &&
      inp.mouseX <= this.left_arrow_topx + 100 &&
      inp.mouseY >= this.left_arrow_topy &&
      inp.mouseY <= this.left_arrow_topy + 100
    ) {
      console.log("mouse pressed: left arrow top");

      //use state machine to figure out which hat to do
      if (this.top_state == DressUpMinigame.Outfit.DEPRESSED) {
        this.top_state = DressUpMinigame.Outfit.CUTE;
      } else if (this.top_state == DressUpMinigame.Outfit.GOOD) {
        this.top_state = DressUpMinigame.Outfit.DEPRESSED;
      } else {
        this.top_state = DressUpMinigame.Outfit.GOOD;
      }
    }

    //right arrow bottom
    if (
      inp.isMouseDown(MOUSE_LEFT) &&
      inp.mouseX >= this.right_arrow_bottomx &&
      inp.mouseX <= this.right_arrow_bottomx + 100 &&
      inp.mouseY >= this.right_arrow_bottomy &&
      inp.mouseY <= this.right_arrow_bottomy + 100
    ) {
      console.log("mouse pressed: right arrow bottom");

      //use state machine to figure out which hat to do
      if (this.bottom_state == DressUpMinigame.Outfit.DEPRESSED) {
        this.bottom_state = DressUpMinigame.Outfit.GOOD;
      } else if (this.bottom_state == DressUpMinigame.Outfit.GOOD) {
        this.bottom_state = DressUpMinigame.Outfit.CUTE;
      } else {
        this.bottom_state = DressUpMinigame.Outfit.DEPRESSED;
      }
    }

    // left arrow top TODO: NEED TO MAKE A DIFFERENT STATE MACHINE FOR EACH THANG
    if (
      inp.isMouseDown(MOUSE_LEFT) &&
      inp.mouseX >= this.left_arrow_bottomx &&
      inp.mouseX <= this.left_arrow_bottomx + 100 &&
      inp.mouseY >= this.left_arrow_bottomy &&
      inp.mouseY <= this.left_arrow_bottomy + 100
    ) {
      console.log("mouse pressed: left arrow bottom");

      //use state machine to figure out which hat to do
      if (this.bottom_state == DressUpMinigame.Outfit.DEPRESSED) {
        this.bottom_state = DressUpMinigame.Outfit.CUTE;
      } else if (this.bottom_state == DressUpMinigame.Outfit.GOOD) {
        this.bottom_state = DressUpMinigame.Outfit.DEPRESSED;
      } else {
        this.bottom_state = DressUpMinigame.Outfit.GOOD;
      }
    }
  }

  /**
   * @returns {Number}
   */
  time() {
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
          this.height
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
