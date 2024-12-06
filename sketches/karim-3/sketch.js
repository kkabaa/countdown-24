//imports
import { createEngine } from "../../shared/engine.js";
import { Spring } from "../../shared/spring.js";

const { renderer, input, math, run, finish, audio } = createEngine();
const { ctx, canvas } = renderer;
let successes = 0;

const alert = await audio.load("metal_gear.wav");
const finalAlert = await audio.load("item.wav");
let BlowBubbleInst = null;
run(update);

let readyForClick = false;

const springX = new Spring({
  position: canvas.width / 2,
  frequency: 2.5,
  halfLife: 0.05,
});

const springY = new Spring({
  position: canvas.height / 2,
  frequency: 2.5,
  halfLife: 0.05,
});

const spring = new Spring({
  position: 1,
  frequency: 2.5,
  halfLife: 0.05,
});

let eventTriggered = false;

let waitForMove = false;
let found = 0;

let numberPosition = { x: canvas.width / 2, y: canvas.height / 2 };
let newPosition = { x: canvas.width / 2, y: canvas.height / 2 };
let mouseX = 0;
let mouseY = 0;
let inputStarted = false;
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  inputStarted = true;
});

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  inputStarted = true;

  if (readyForClick) {
    eventTriggered = true; // Set the flag so the event won't happen again
    found++;
    if (found < 3) {
      BlowBubbleInst = alert.play();
      setTimeout(() => {
        BlowBubbleInst.setVolume(0);
        BlowBubbleInst = null;
      }, 2000);
    } else if (found == 3) {
      BlowBubbleInst = finalAlert.play();
      setTimeout(() => {
        BlowBubbleInst.setVolume(0);
        BlowBubbleInst = null;
      }, 2000);
    }
    console.log("found" + found);
    console.log("Please move" + successes);
    const minDistance = 400;

    // Relocate the "3" to a random position

    const angle = Math.random() * Math.PI * 2; // Random angle in radians
    newPosition = {
      x: numberPosition.x + minDistance * Math.cos(angle),
      y: numberPosition.y + minDistance * Math.sin(angle),
    };

    if (newPosition.x > canvas.width) {
      newPosition.x -= canvas.width;
    }
    if (newPosition.y > canvas.height) {
      newPosition.y -= canvas.height;
    }
    if (newPosition.x < 0) {
      newPosition.x += canvas.width;
    }
    if (newPosition.y < 0) {
      newPosition.y += canvas.height;
    }
    numberPosition = newPosition;

    waitForMove = true;
    successes++;
  }
});

// function isPositionOverText(x, y, text, fontSize, position) {
//   ctx.font = `${fontSize}px Helvetica Neue, Helvetica, Arial, bold`;
//   const textMetrics = ctx.measureText(text);
//   const textWidth = textMetrics.width;
//   const textHeight = fontSize; // Approximation for text height

//   const left = position.x - textWidth / 2;
//   const right = position.x + textWidth / 2;
//   const top = position.y - textHeight / 2;
//   const bottom = position.y + textHeight / 2;

//   return x >= left && x <= right && y >= top && y <= bottom;
// }

function update(dt) {
  spring;
  springX.target = numberPosition.x;
  springY.target = numberPosition.y;

  springX.step(dt);
  springY.step(dt);

  // Clear the canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const fontSize = canvas.height / 4;

  // console.log(mouseX, mouseY, numberPosition);

  const clickRadius = 150;
  const isClose =
    math.dist(mouseX, mouseY, springX.position, springY.position) < clickRadius;
  if (!isClose) waitForMove = false;

  readyForClick = inputStarted && !waitForMove && isClose;

  if (successes >= 3) {
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const scale = Math.max(spring.position, 0);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ctx.fillStyle = "white";
    // ctx.textBaseline = "middle";
    // ctx.font = `${canvas.height}px Helvetica Neue, Helvetica , bold`;
    // ctx.textAlign = "center";
    // ctx.translate(x, y);
    // ctx.scale(scale, scale);
    // ctx.fillText("3", 0, 0);
    setTimeout(() => {
      finish();
    }, 2000);
  } else {
    // Draw the moving circle
    ctx.fillStyle = "grey";
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 150, 0, Math.PI * 2);
    ctx.fill();

    // Spotlight effect
    ctx.save();
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 150, 0, Math.PI * 2); // Spotlight radius
    ctx.fillStyle = "grey";
    ctx.clip();

    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    ctx.font = `${canvas.height / 4}px Helvetica Neue, Helvetica , bold`;
    ctx.textAlign = "center";
    ctx.translate(springX.position, springY.position);
    if (readyForClick) {
      ctx.scale(1.1, 1.1);
    }
    ctx.fillText("3", 0, 0);
  }

  // ctx.save();
  // ctx.fillStyle = "green";
  // ctx.beginPath();
  // ctx.ellipse(0, 0, clickRadius, clickRadius, 0, 0, Math.PI * 2);
  // ctx.stroke();
  // ctx.restore();

  // Restore context to remove clipping
  ctx.restore();
}
