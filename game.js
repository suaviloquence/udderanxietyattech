const WIDTH = 720;
const HEIGHT = 720;
const CENTER_X = WIDTH / 2;
const CENTER_Y = WIDTH / 2;
const FPS = 60;

const MOUSE_LEFT = 0;
const MOUSE_RIGHT = 2;

const ARROW_LEFT = "ArrowLeft";
const ARROW_RIGHT = "ArrowRight";
const ARROW_DOWN = "ArrowDown";
const ARROW_UP = "ArrowUp";

document.addEventListener("DOMContentLoaded", async () => {
  /** @type HTMLCanvasElement */
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const inp = new InputManager(canvas);
  canvas.focus();
  let dimness = 0.5;
  run(new BossFight(), ctx, inp, dimness);
  // dimness = await run(new PhoneInBedMinigame(), ctx, inp, dimness);
  // dimness = await run(new DressUpMinigame(), ctx, inp, dimness);
  // dimness = await run(new CookingMinigame(), ctx, inp, dimness);
  // dimness = await run(new CleanUpMinigame(), ctx, inp, dimness);
  // dimness = await run(new MazeMinigame(), ctx, inp, dimness);
  // dimness = await run(new MeowMinigame(), ctx, inp, dimness);
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
async function run(game, ctx, inp, dimness) {
  console.log(dimness);
  const timer = document.getElementById("timer");
  const prompt = document.getElementById("prompt");

  game.setup(ctx);
  let i = 0;
  let handler = null;

  let mgr = new LerpManager();

  timer.textContent = game.time().toString();

  return new Promise((resolve, reject) => {
    handler = setInterval(() => {
      i += 1;
      if (i > FPS * game.time()) {
        clearInterval(handler);
        if (game.win()) {
          resolve(Math.min(dimness + 0.15, 1));
        } else {
          resolve(Math.max(dimness - 0.15, 0.5));
        }
      }

      prompt.textContent = game.prompt();

      if (i % FPS === 0) {
        timer.textContent = `${game.time() - i / FPS}`;
      }

      inp.frameStart();
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      game.loop(ctx, i, mgr, inp);
      mgr.loop();
      inp.frameEnd();

      let id = ctx.getImageData(0, 0, WIDTH, HEIGHT);
      let data = new ImageData(WIDTH, HEIGHT);
      for (let i = 0; i < id.data.length; i += 4) {
        data.data[i] = id.data[i] * dimness;
        data.data[i + 1] = id.data[i + 1] * dimness;
        data.data[i + 2] = id.data[i + 2] * dimness;
        data.data[i + 3] = id.data[i + 3];
      }
      ctx.putImageData(data, 0, 0);
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

  /**
   * @returns {Number}
   */
  time() {
    throw new Error("unimplemented");
  }

  /**
   * @returns {string}
   */
  prompt() {
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

  /**
   * @returns {string}
   */
  prompt() {
    return "meow meow meow";
  }
}

class DressUpMinigame extends Minigame {
  static Outfit = {
    CUTE: 2,
    GOOD: 1,
    DEPRESSED: 0,
  };

  /**
   * @param {CanvasRenderingContext2D} ctx
   */

  setup(ctx) {
    // how we want it to start
    // make it such that the screen of outfits is up, 3 outfits: 1 really bad one, 1 good one, 1 eh one

    // background image
    this.bkg = new Image();
    this.bkg.src = "assets/dressup/phone_back.png";

    // confirm button
    this.confirm = new Image();
    this.confirm.src = "assets/dressup/CONFIRM.png";

    // patty
    this.patty = new Image();
    this.patty.src = "assets/dressup/PATTY_DRESS.png";

    // arrows
    this.right_arrow_hat = new Image();
    this.right_arrow_hat.src = "assets/dressup/ARROW_R.png";
    this.right_arrow_hat.width = 100;
    this.right_arrow_hat.height = 100;
    this.right_arrow_hatx = CENTER_X + 250 - this.right_arrow_hat.width / 2;
    this.right_arrow_haty = CENTER_Y - 250 - this.right_arrow_hat.height / 2;

    this.right_arrow_top = new Image();
    this.right_arrow_top.src = "assets/dressup/ARROW_R.png";
    this.right_arrow_top.width = 100;
    this.right_arrow_top.height = 100;
    this.right_arrow_topx = CENTER_X + 250 - this.right_arrow_top.width / 2;
    this.right_arrow_topy = CENTER_Y - this.right_arrow_top.height / 2;

    this.right_arrow_bottom = new Image();
    this.right_arrow_bottom.src = "assets/dressup/ARROW_R.png";
    this.right_arrow_bottom.width = 100;
    this.right_arrow_bottom.height = 100;
    this.right_arrow_bottomx =
      CENTER_X + 250 - this.right_arrow_bottom.width / 2;
    this.right_arrow_bottomy =
      CENTER_Y + 150 - this.right_arrow_bottom.height / 2;

    // for these arrows, flip the other ones... maybe do it after downloading instead of how they're being hosted rn
    this.left_arrow_hat = new Image();
    this.left_arrow_hat.src = "assets/dressup/ARROW_L.png";
    this.left_arrow_hat.width = 100;
    this.left_arrow_hat.height = 100;
    this.left_arrow_hatx = CENTER_X - 250 - this.left_arrow_hat.width / 2;
    this.left_arrow_haty = CENTER_Y - 250 - this.left_arrow_hat.height / 2;

    this.left_arrow_top = new Image();
    this.left_arrow_top.src = "assets/dressup/ARROW_L.png";
    this.left_arrow_top.width = 100;
    this.left_arrow_top.height = 100;
    this.left_arrow_topx = CENTER_X - 250 - this.left_arrow_top.width / 2;
    this.left_arrow_topy = CENTER_Y - this.left_arrow_top.height / 2;

    this.left_arrow_bottom = new Image();
    this.left_arrow_bottom.src = "assets/dressup/ARROW_L.png";
    this.left_arrow_bottom.width = 100;
    this.left_arrow_bottom.height = 100;
    this.left_arrow_bottomx = CENTER_X - 250 - this.left_arrow_bottom.width / 2;
    this.left_arrow_bottomy =
      CENTER_Y + 150 - this.left_arrow_bottom.height / 2;

    // state machine for each thing
    this.hat_state = DressUpMinigame.Outfit.DEPRESSED;
    this.top_state = DressUpMinigame.Outfit.DEPRESSED;
    this.bottom_state = DressUpMinigame.Outfit.DEPRESSED;

    // the potential fits fr
    this.hat = new Image();
    this.hat_depressed = "assets/dressup/HAT_D.png";
    this.hat_cute = "assets/dressup/HAT_C.png";
    this.hat_good = "assets/dressup/HAT_G.png";

    this.top = new Image();
    this.top_depressed = "assets/dressup/TOP_D.png";
    this.top_cute = "assets/dressup/TOP_C.png";
    this.top_good = "assets/dressup/TOP_G.png";

    this.bottom = new Image();
    this.bottom_depressed = "assets/dressup/BOTTOM_D.png";
    this.bottom_cute = "assets/dressup/BOTTOM_C.png";
    this.bottom_good = "assets/dressup/BOTTOM_G.png";
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
    ctx.drawImage(this.bkg, 0, 0);
    ctx.drawImage(
      this.confirm,
      CENTER_X - CENTER_X / 2,
      CENTER_Y + 100 + CENTER_Y / 2
    ),
      WIDTH / 2,
      HEIGHT / 2;

    // the constant images
    ctx.drawImage(
      this.patty,
      CENTER_X - WIDTH / 2.2,
      CENTER_Y - 50 - HEIGHT / 2.2,
      WIDTH / 1.1,
      HEIGHT / 1.1
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

    ctx.drawImage(
      this.hat,
      CENTER_X - WIDTH / 2.2,
      CENTER_Y - HEIGHT / 2.2 - 50,
      WIDTH / 1.1,
      HEIGHT / 1.1
    );
    ctx.drawImage(
      this.top,
      CENTER_X - WIDTH / 2.2,
      CENTER_Y - HEIGHT / 2.2 - 50,
      WIDTH / 1.1,
      HEIGHT / 1.1
    );
    ctx.drawImage(
      this.bottom,
      CENTER_X - WIDTH / 2.2,
      CENTER_Y - HEIGHT / 2.2 - 50,
      WIDTH / 1.1,
      HEIGHT / 1.1
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
    return 10;
  }

  prompt() {
    return "Change clothing with the arrows to build Patricia's favorite outfit";
  }

  win() {
    // TODO
    return false;
  }
}

class CookingMinigame extends Minigame {
  constructor() {
    super(); // Make sure to call the parent constructor if needed

    this.tileSize = 100;
    this.tileGap = 10;
    this.gridSize = 3;
    this.tiles = [];

    this.sequence = [];
    this.userInput = [];
    this.acceptingInput = false;
    this.currentFlash = -1;
    this.lastFlashTime = 0;
    this.flashStep = 0;
    this.flashInterval = 600;

    this.userFlashIndex = -1;
    this.userFlashTime = 0;
    this.userFlashInterval = 600; // same as red flash
  }

  // Set up the tiles for the grid
  setup(ctx) {
    this.tiles = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const x = col * (this.tileSize + this.tileGap) + this.tileGap + 170;
        const y = row * (this.tileSize + this.tileGap) + this.tileGap + 170;
        this.tiles.push({ x, y, index: row * this.gridSize + col });
      }
    }

    this.nextRound();

    this.bkg = new Image();
    this.bkg.src = "assets/cooking_back.png";
  }

  // Start the next round by adding a random tile to the sequence
  nextRound() {
    const next = Math.floor(Math.random() * this.tiles.length);
    this.sequence.push(next);
    this.userInput = [];
    this.flashStep = 0;
    this.lastFlashTime = performance.now();
    this.acceptingInput = false;
    this.flashNextTile();
  }

  // Flash the next tile in the sequence
  flashNextTile() {
    if (this.flashStep < this.sequence.length) {
      this.currentFlash = this.sequence[this.flashStep];
      const r = Math.random() * 255;
      const g = Math.random() * 255;
      const b = Math.random() * 255;
      this.currentColor = `rgb(${r}, ${g}, ${b})`;
      this.flashStep++;
      this.lastFlashTime = performance.now();
    } else {
      this.acceptingInput = true; // Allow user input after sequence is flashed
      this.currentFlash = -1;
      this.currentColor = null;
    }
  }

  loop(ctx, i, mgr, inp) {
    ctx.drawImage(this.bkg, 0, 0);
    // Clear the canvas before redrawing
    ctx.fillStyle = "#5b2f0b";
    ctx.fillRect(170, 170, 340, 340);

    // ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.drawTiles(ctx);

    const currentTime = performance.now();

    if (!this.acceptingInput) {
      if (currentTime - this.lastFlashTime >= this.flashInterval) {
        this.flashNextTile();
      }

      if (this.currentFlash !== -1) {
        this.drawFlashingTile(ctx, this.currentColor);
      }
    }

    // 🔵 Show blue flash if user clicked recently
    if (this.userFlashIndex !== -1) {
      if (currentTime - this.userFlashTime <= this.userFlashInterval) {
        const tile = this.tiles[this.userFlashIndex];
        ctx.fillStyle = "#0000FF";
        ctx.fillRect(tile.x, tile.y, this.tileSize, this.tileSize);
      } else {
        this.userFlashIndex = -1;
      }
    }

    // If the game is in the input phase, check the user's input
    if (this.acceptingInput) {
      if (inp.isMouseDown(MOUSE_LEFT)) {
        // Check if the user clicked on any tile
        const mouseX = inp.mouseX;
        const mouseY = inp.mouseY;

        for (let tile of this.tiles) {
          if (
            mouseX >= tile.x &&
            mouseX <= tile.x + this.tileSize &&
            mouseY >= tile.y &&
            mouseY <= tile.y + this.tileSize
          ) {
            this.userInput.push(tile.index); // Store user input

            // TODO: i want to flash the tile pressed blue

            // Flash the tile blue
            this.userFlashIndex = tile.index;
            this.userFlashTime = performance.now(); // Flash duration (e.g., 300ms)

            if (this.userInput.length === this.sequence.length) {
              if (this.userInput.join() === this.sequence.join()) {
                console.log("Correct sequence!");
                setTimeout(() => {
                  this.nextRound();
                }, 600);
              } else {
                console.log("Incorrect sequence!");
                this.resetGame();
              }
            }
            break;
          }
        }
      }
    }
  }

  drawTiles(ctx) {
    // Draw all tiles in the grid (always visible)
    for (let tile of this.tiles) {
      ctx.fillStyle = "#cb7539";
      ctx.fillRect(tile.x, tile.y, this.tileSize, this.tileSize);
      ctx.strokeStyle = "#df8235";
      ctx.strokeRect(tile.x, tile.y, this.tileSize, this.tileSize);
    }
  }

  drawFlashingTile(ctx, color) {
    // Draw the tile that's currently flashing
    if (this.currentFlash !== -1) {
      const tile = this.tiles[this.currentFlash];
      ctx.fillStyle = color; // Highlight the flashing tile with red
      ctx.fillRect(tile.x, tile.y, this.tileSize, this.tileSize);
    }
  }

  resetGame() {
    // Reset the game for a new round
    console.log("Game Over! Resetting...");
    this.sequence = [];
    this.userInput = [];
    this.acceptingInput = false;
    // this.nextRound();
  }

  // Time to complete this round (e.g., 15 seconds)
  time() {
    return 20;
  }

  /**
   * @returns {string}
   */
  prompt() {
    return "Click the tiles in order of which they light up";
  }

  win() {
    return this.sequence.length >= 4;
  }
}

class BossFight extends Minigame {
  constructor() {
    // MASH
    super();
    this.x = WIDTH / 2;
    this.y = (HEIGHT * 3) / 4;
    this.vx = 0;
    this.vy = 0;
    this.width = 256;
    this.height = 256;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */

  static Game_state = {
    default: 0,
    mash: 1,
    maze: 2,
    pattern: 3,
    end: 4,
  };

  static are_you_sure = {
    default:
      "Let’s see, that barista is the only other person I see here. I need to get used to talking to people more, so here goes nothing.",
    first: "Are you sure you want to approach?",
    second: "Are you sure?",
    third: "Are you sure??",
    fourth: "Are you sure???",
    no: "No, not today… Maybe another time…",
    yes: "This feels intense, I haven’t even said anything but I feel so scared. I can’t back down now though, I’m too far in to run now. Meeting new people is hard, but I WILL talk to them. I WILL order my coffee!",
  };

  createButtons(ctx) {
    //Buttons:
    //naur button

    ctx.fillStyle = "grey";
    ctx.fillRect(WIDTH / 2 + 20, HEIGHT / 2 + 200, 300, 100);

    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("no... i'm not", WIDTH / 2 + 20 + 150, HEIGHT / 2 + 200 + 50);

    // yes button

    ctx.fillStyle = "grey";
    ctx.fillRect(40, HEIGHT / 2 + 200, 300, 100);

    ctx.fillStyle = "black";
    ctx.fillText("yes!", 40 + 150, HEIGHT / 2 + 200 + 50);
  }

  setup(ctx) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    this.barista = new Image();
    this.barista.src =
      "https://64.media.tumblr.com/51c1f4f6e31e22170c3c70ce1e857410/tumblr_ok8gprvz4h1vl7x77o1_1280.png";

    this.patty = new Image();
    this.patty.src = "assets/PATTY.png";

    this.health = WIDTH / 2;

    this.game_state = BossFight.Game_state.default;

    // DEFAULT
    this.naur_buttonx = WIDTH / 2 + 20;
    this.naur_buttony = HEIGHT / 2 + 200;
    this.yes_buttonx = 40;
    this.yes_buttony = HEIGHT / 2 + 200;
    this.prompt_text = BossFight.are_you_sure.default;

    // MASH
    this.state = 4;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} i
   * @param {LerpManager} mgr
   * @param {InputManager} inp
   */
  loop(ctx, i, mgr, inp) {
    // TODO: BACKGROUND CHANGE
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // OUR CHARACTERS
    ctx.drawImage(this.patty, 0, HEIGHT / 4, WIDTH / 2, HEIGHT / 2);

    if (this.game_state == BossFight.Game_state.default) {
      // this is the continuous prompting thing
      let ready = true;
      ctx.drawImage(this.patty, 0, HEIGHT / 4, WIDTH / 2, HEIGHT / 2);

      if (this.prompt_text == BossFight.are_you_sure.default) {
        setTimeout(() => {
          this.createButtons(ctx);
          this.prompt_text = BossFight.are_you_sure.first;
        }, 700);
      } else {
        this.createButtons(ctx);
      }

      //TODO: fix the timing
      if (this.prompt_text == BossFight.are_you_sure.yes) {
        setTimeout(() => {
          this.game_state = BossFight.Game_state.mash;
        }, 1000);
      }

      //if no button is clicked, ready is false
      if (
        inp.isMouseDown(MOUSE_LEFT) &&
        inp.mouseX >= this.naur_buttonx &&
        inp.mouseX <= this.naur_buttonx + 300 &&
        inp.mouseY >= this.naur_buttony &&
        inp.mouseY <= this.naur_buttony + 100
      ) {
        ready = false;
        this.game_state = BossFight.Game_state.end;
      }

      // if yes clicked, want to advance
      if (
        inp.isMouseDown(MOUSE_LEFT) &&
        inp.mouseX >= this.yes_buttonx &&
        inp.mouseX <= this.yes_buttonx + 300 &&
        inp.mouseY >= this.yes_buttony &&
        inp.mouseY <= this.yes_buttony + 100
      ) {
        console.log("yes clicked");
        console.log(this.prompt_text);

        if (this.prompt_text == BossFight.are_you_sure.first) {
          this.prompt_text = BossFight.are_you_sure.second;
        } else if (this.prompt_text == BossFight.are_you_sure.second) {
          this.prompt_text = BossFight.are_you_sure.third;
        } else if (this.prompt_text == BossFight.are_you_sure.third) {
          this.prompt_text = BossFight.are_you_sure.fourth;
          console.log(ready);
        } else if (this.prompt_text == BossFight.are_you_sure.fourth && ready) {
          this.prompt_text = BossFight.are_you_sure.yes;
          console.log("yes girl");
        }
      }
    } else if (this.game_state == BossFight.Game_state.mash) {
      // health bar?
      ctx.fillStyle = "black";
      ctx.fillRect(WIDTH / 2 - 15, 5, WIDTH / 2 + 10, HEIGHT / 20 + 10);
      ctx.fillStyle = "red";
      ctx.fillRect(WIDTH / 2 - 10, 10, this.health, HEIGHT / 20); // shrink the width depending on the health: 360

      ctx.drawImage(this.barista, WIDTH / 2, HEIGHT / 4, WIDTH / 2, HEIGHT / 2);

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
    } else if (this.game_state == BossFight.Game_state.maze) {
      // health bar?
      ctx.fillStyle = "black";
      ctx.fillRect(WIDTH / 2 - 15, 5, WIDTH / 2 + 10, HEIGHT / 20 + 10);
      ctx.fillStyle = "red";
      ctx.fillRect(WIDTH / 2 - 10, 10, this.health, HEIGHT / 20); // shrink the width depending on the health: 360

      ctx.drawImage(this.barista, WIDTH / 2, HEIGHT / 4, WIDTH / 2, HEIGHT / 2);
    } else {
      // health bar?
      ctx.fillStyle = "black";
      ctx.fillRect(WIDTH / 2 - 15, 5, WIDTH / 2 + 10, HEIGHT / 20 + 10);
      ctx.fillStyle = "red";
      ctx.fillRect(WIDTH / 2 - 10, 10, this.health, HEIGHT / 20); // shrink the width depending on the health: 360

      // the pattern
      ctx.drawImage(this.barista, WIDTH / 2, HEIGHT / 4, WIDTH / 2, HEIGHT / 2);
    }
  }

  prompt() {
    if (this.game_state == BossFight.Game_state.default) {
      return this.prompt_text;
    } else {
      return "";
    }
  }

  /**
   * @returns {Number}
   */
  time() {
    return 60;
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
    this.phone = load("assets/PHONE.png");
    this.patty = load("assets/PATTY_BED.png");
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  setup(ctx) {
    this.state = 4;
  }

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

  /**
   * @returns {string}
   */
  prompt() {
    return "Click LEFT and RIGHT repeatedly to balance yourself and keep center to escape your phone's grasp";
  }

  win() {
    return this.y >= (HEIGHT * 3) / 4;
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
      this.h
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
      new GrabbableThing(100, 500, 200, 150, load("assets/dish bin.jpg"), 0, 0),
      new GrabbableThing(
        300,
        500,
        150,
        200,
        load("assets/trash bin.gif"),
        1,
        1
      ),
      new GrabbableThing(500, 500, 100, 250, load("assets/hamper.jpeg"), 2, 2),
    ];

    /**
     * @type {GrabbableThing[]}
     */
    this.things = [];

    for (let z = 0; z < 10; z++) {
      const type = thingTypes[Math.floor(Math.random() * thingTypes.length)];
      const thing = new GrabbableThing(
        Math.random() * WIDTH,
        Math.random() * 400,
        type.w,
        type.h,
        type.img,
        type.bin,
        z
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

  /**
   * @returns {string}
   */
  prompt() {
    if (this.win()) {
      return "Decluttering complete!";
    } else {
      return `Drag and drop ${this.things.length - 4} more item${
        this.things.length - 4 === 1 ? "" : "s"
      } to their corresponding place`;
    }
  }

  win() {
    return this.things.length <= 4;
  }
}

class MazeMinigame extends Minigame {
  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  setup(ctx) {
    this.maze = load("assets/maze3.svg");

    this.patty = new GrabbableThing(
      316,
      326,
      32,
      32,
      load("assets/cow face.png")
    );

    this.creatures = [
      new GrabbableThing(606, 397, 32, 32, load("assets/cat face.png")),
      new GrabbableThing(316, 46, 32, 32, load("assets/crow fac.png")),
      new GrabbableThing(269, 168, 32, 32, load("assets/penguin.png")),
    ];
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Number} i
   * @param {LerpManager} mgr
   * @param {InputManager} inp
   */
  loop(ctx, i, mgr, inp) {
    ctx.drawImage(this.maze, 0, 0, WIDTH, HEIGHT);

    for (const creature of this.creatures) {
      creature.draw(ctx);
    }

    const K = 5;

    if (inp.isKeyPressed(ARROW_LEFT)) {
      for (let i = 0; i < K; i++) {
        const dt = ctx.getImageData(
          this.patty.x - this.patty.w / 2 - 1,
          this.patty.y - this.patty.h / 2,
          1,
          this.patty.h
        );

        if (!dt.data.every((x) => x === 255)) {
          break;
        }
        this.patty.x--;
      }
    }

    if (inp.isKeyPressed(ARROW_RIGHT)) {
      for (let i = 0; i < K; i++) {
        const dt = ctx.getImageData(
          this.patty.x + this.patty.w / 2 + 1,
          this.patty.y - this.patty.h / 2,
          1,
          this.patty.h
        );

        if (!dt.data.every((x) => x === 255)) {
          break;
        }
        this.patty.x++;
      }
    }

    if (inp.isKeyPressed(ARROW_DOWN)) {
      for (let i = 0; i < K; i++) {
        const dt = ctx.getImageData(
          this.patty.x - this.patty.w / 2,
          this.patty.y + this.patty.h / 2 + 1,
          this.patty.w,
          1
        );

        if (!dt.data.every((x) => x === 255)) {
          break;
        }
        this.patty.y++;
      }
    }
    if (inp.isKeyPressed(ARROW_UP)) {
      for (let i = 0; i < K; i++) {
        const dt = ctx.getImageData(
          this.patty.x - this.patty.w / 2,
          this.patty.y - this.patty.h / 2 - 1,
          this.patty.w,
          1
        );

        if (!dt.data.every((x) => x === 255)) {
          break;
        }
        this.patty.y--;
      }
    }

    this.patty.draw(ctx);

    let remove = null;
    for (const i in this.creatures) {
      let yay = false;
      for (const x of [
        this.patty.x - this.patty.w / 2,
        this.patty.x + this.patty.w / 2,
      ]) {
        for (const y of [
          this.patty.y - this.patty.h / 2,
          this.patty.y + this.patty.h / 2,
        ]) {
          if (this.creatures[i].contains(x, y)) {
            yay = true;
          }
        }
      }
      if (yay) {
        remove = i;
      }
    }
    if (remove) this.creatures.splice(remove, 1);
  }

  /**
   * @returns {Number}
   */
  time() {
    return 15;
  }

  prompt() {
    if (this.win()) {
      return "Enjoy the walk with your friends!";
    } else {
      return `Navigate through the maze and find at least ${
        this.creatures.length - 1
      } more frien${this.creatures.length - 1 === 1 ? "d" : "ds"}`;
    }
  }

  win() {
    return this.creatures.length <= 1;
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
