import { createEngine } from "../../shared/engine.js";
import { Spring } from "../../shared/spring.js";

const { renderer, input, math, run, finish, audio } = createEngine();
const { ctx, canvas } = renderer;

const spring = new Spring({
  position: canvas.height + 1500,
  frequency: 1.5,
  halfLife: 0.09,
});

// const ambienceSound = await audio.load({
//   src: "sample-audio/assets/fast_lick.wav",
//   loop: true
// })
// const ambienceSoundInst = ambienceSound.play()

const lickSound = await audio.load("fast_lick.wav");

let licked = 0;
let lastPressed = false;

let finalAnimation = 0;

// Logic for blackout
let blackedout = false;
let currentState = "normal"; // Can be "normal", "blackout", "text"
let timeSinceBlackout = 0;
let displayTextTime = 1000; // Time in milliseconds before showing text

// const inputPoints = [
//   { x: 0, y: 0 },
//   { x: 4, y: 0 },
//   { x: 8, y: 2 },
//   { x: 4, y: 4 },
//   { x: 3, y: 8, angle: 0 },
//   { x: 8, y: 8 },
//   { x: 8, y: 10 },
//   { x: -2, y: 10 },
//   { x: 2, y: 3 },
//   { x: -2, y: 2 },
// ];
const inputPoints = [
  { x: 1, y: 3 },
  { x: 3, y: 1 },
  { x: 6, y: 1 },
  { x: 8, y: 1 },
  { x: 9, y: 3, angle: 0 },
  { x: 8, y: 5, angle: 0 },
  { x: 4, y: 8, angle: 0 },
  { x: 9, y: 8 },
  { x: 9, y: 10 },
  { x: 1, y: 10 },
  { x: 1, y: 8 },
  { x: 4, y: 6, angle: 180 },
  { x: 6, y: 5, angle: 180 },
  { x: 7, y: 4, angle: 180 },
  { x: 6, y: 3, angle: 180 },
  { x: 4, y: 3, angle: 180 },
  { x: 3, y: 5, angle: 180 },
];
const pointsCenter = { x: 4, y: 4 };

// set angles of all points
for (const point of inputPoints) {
  point.x -= pointsCenter.x;
  point.y -= pointsCenter.y;
  let angle = point.angle;

  if (angle === undefined) {
    angle = math.toDegrees(Math.atan2(point.y, point.x));
  }

  point.angle = angle;
}

const points = [];

const stepsPerDistance = 1;
points.push(inputPoints[0]);
for (let i = 1; i < inputPoints.length; i++) {
  const point = inputPoints[i];
  const prevPoint = inputPoints[i - 1];
  const distance = math.dist(point.x, point.y, prevPoint.x, prevPoint.y);
  const steps = Math.ceil(distance * stepsPerDistance);

  for (let t = 0; t < steps; t++) {
    const lerp = math.invLerpClamped(0, steps, t);
    const x = math.lerp(prevPoint.x, point.x, lerp);
    const y = math.lerp(prevPoint.y, point.y, lerp);
    const angle = math.lerpAngleDeg(prevPoint.angle, point.angle, lerp);
    points.push({ x, y, angle });
  }
}

run(update);

function update(dt) {
  const x = 0;
  const y = 0;
  // console.log(finalAnimation);
  // Detect click event (transition from unpressed to pressed)

  const maxRadius = canvas.height / 3;
  const minRadius = canvas.height / 4;
  let radius = minRadius;
  let progress = 1;
  if (currentState === "normal") {
    spring.target = canvas.height / 2;
    if (input.isDown() && !lastPressed) {
      licked++;
      lickSound.play({
        rate: 0.5 + Math.random() * 1,
        volume: 0.5 + Math.random() * 0.5,
      });
      console.log("Licked:", licked);

      // lastPressed = input.isPressed(); // Update last press state
      //console.log(lastPressed);
      // spring.step(dt);
    }
    progress = math.clamp01(licked / 10);
    radius = math.mapClamped(licked, 0, 10, maxRadius, minRadius); // Candy shrinks in steps

    /// if (input.isPressed() && licked <= 10) {
    //   impactSound.play({
    //     rate: 1 ,
    //     volume: 0.5
    // });
    // }

    if (progress >= 1) {
      finalAnimation++;
      if (licked >= 11) {
        currentState = "blackout";
      }
    }
  } else if (currentState === "blackout") {
    spring.target = canvas.height + 1500;
    if (spring.position >= spring.target - 10) {
      finish();
    }
  }

  // Clear the canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ctx.translate(0, spring.position);
  ctx.translate(0, 0);

  // Draw the lollipop stick
  // ctx.fillRect(10, 10, 100, 100);

  spring.step(dt);

  ctx.translate(canvas.width / 2, spring.position);

  ctx.fillStyle = "brown";
  ctx.fillRect(x - 5, y + 10, 15, canvas.height / 2);
  ctx.beginPath();

  const scaleFactor = maxRadius / 10;

  if (progress >= 1) {
    ctx.fillStyle = "blue";
    if (licked >= 11) {
      currentState = "blackout";
    }
  } else {
    ctx.fillStyle = "red";
  }
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const angle = math.toRadian(point.angle);
    const circlePoint = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
    point.drawX = math.lerpClamped(
      circlePoint.x,
      point.x * scaleFactor,
      progress
    );
    point.drawY = math.lerpClamped(
      circlePoint.y,
      point.y * scaleFactor,
      progress
    );
  }

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (i === 0) {
      ctx.moveTo(point.drawX, point.drawY);
    } else {
      const prevPoint = points[math.repeat(i - 1, points.length)];
      const nextPoint = points[math.repeat(i + 1, points.length)];
      const tangentX = nextPoint.drawX - prevPoint.drawX;
      const tangentY = nextPoint.drawY - prevPoint.drawY;
      const tangentLength = math.len(tangentX, tangentY);
      const tangentXNormalized = tangentX / tangentLength;
      const tangentYNormalized = tangentY / tangentLength;
      const distToPrevPoint = math.dist(
        point.drawX,
        point.drawY,
        prevPoint.drawX,
        prevPoint.drawY
      );
      const controlX = point.drawX - tangentXNormalized * distToPrevPoint * 0.5;
      const controlY = point.drawY - tangentYNormalized * distToPrevPoint * 0.5;
      ctx.quadraticCurveTo(controlX, controlY, point.drawX, point.drawY);
      //ctx.lineTo( point.drawX, point.drawY);
    }
  }
  ctx.closePath();
  //ctx.strokeStyle = "blue";
  ctx.fill();

  // if (progress >= 1) {
  //   spring.target = -100;
  // }
  // if (licked >= 11) {
  //   spring.target = canvas.height;
  //   if (spring.position >= canvas.height) {
  //     spring.position++;
  //   }

  //blackout();
  //}
}

function lollipop(radius, scaleFactor, progress) {
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const angle = math.toRadian(point.angle);
    const circlePoint = {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
    point.drawX = math.lerpClamped(
      circlePoint.x,
      point.x * scaleFactor,
      progress
    );
    point.drawY = math.lerpClamped(
      circlePoint.y,
      point.y * scaleFactor,
      progress
    );
  }

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (i === 0) {
      ctx.moveTo(point.drawX, point.drawY);
    } else {
      const prevPoint = points[math.repeat(i - 1, points.length)];
      const nextPoint = points[math.repeat(i + 1, points.length)];
      const tangentX = nextPoint.drawX - prevPoint.drawX;
      const tangentY = nextPoint.drawY - prevPoint.drawY;
      const tangentLength = math.len(tangentX, tangentY);
      const tangentXNormalized = tangentX / tangentLength;
      const tangentYNormalized = tangentY / tangentLength;
      const distToPrevPoint = math.dist(
        point.drawX,
        point.drawY,
        prevPoint.drawX,
        prevPoint.drawY
      );
      const controlX = point.drawX - tangentXNormalized * distToPrevPoint * 0.5;
      const controlY = point.drawY - tangentYNormalized * distToPrevPoint * 0.5;
      ctx.quadraticCurveTo(controlX, controlY, point.drawX, point.drawY);
      //ctx.lineTo( point.drawX, point.drawY);
    }
  }
}

function blackout() {
  currentState = "blackout";
  blackedout = true;
  timeSinceBlackout = 0;
}
