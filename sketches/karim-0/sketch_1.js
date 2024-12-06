import { createEngine } from "../../shared/engine.js";

import { createSpringSettings, Spring } from "../../shared/spring.js";

import Utils from "./Utils.js";

const { renderer, input, math, run, finish, audio } = createEngine();

const { ctx, canvas } = renderer;

const BlowBubble = await audio.load("blowing-balloon2.wav");
let BlowBubbleInst = null;
const PopBubble = await audio.load("Bubble_pop.wav");
init();
run(update);

let pathPoints = [];
let interactivePoints = [];
let selectedPoint = null; // To store the currently selected point
let originalPositions = []; // Store original positions of interactive points
let springs = []; // Store spring objects for each interactive point

const translateX = -300; // Amount to move the shape in the X direction
const translateY = 300; // Amount to move the shape in the Y direction

async function init() {
  pathPoints = await Utils.loadSVG("./gumgum.svg");

  pathPoints.forEach((arrayofpoints) => {
    arrayofpoints.forEach((point) => {
      point.x += translateX;
      point.y += translateY;
    });
  });

  console.log(pathPoints);

  extractInteractivePoints();

  // Initialize springs for each interactive point

  initializeSprings();
}

const spring = new Spring({
  position: 0,
});

const settings1 = createSpringSettings({
  frequency: 3.5,

  halfLife: 0.05,
});

const settings2 = createSpringSettings({
  frequency: 0.2,

  halfLife: 1.15,
});

let candyRadius = 30;

// Initial positions for the triangles

let leftTriangleY = 0;

let rightTriangleY = 0;

// Falling speed

const fallSpeed = 700;

// Falling state

let isFalling = false;
let eventTriggered = false;

function update(dt) {
  // Start falling when mouse is clicked

  if (input.isPressed() && candyRadius < 501) {
    spring.target = -0.1;

    spring.settings = settings2;

    candyRadius += 1;
    isFalling = true; // Enable falling when mouse is clicked
  } else {
    spring.target = 1;
    spring.settings = settings1;
  }
  if (candyRadius < 500) {
    if (input.isDown()) {
      BlowBubbleInst = BlowBubble.play();
      BlowBubbleInst.setVolume(30);
    }
    if (input.isUp()) {
      BlowBubbleInst.setVolume(0);
      BlowBubbleInst = null;
    }
  }

  // Update positions only if falling

  if (isFalling) {
    leftTriangleY += fallSpeed * dt;

    rightTriangleY += fallSpeed * dt;
  }

  handleInteraction(dt);

  drawPath();

  spring.step(dt);

  const x = canvas.width / 2;

  const y = canvas.height / 2;

  const scale = Math.max(spring.position, 0);

  ctx.fillStyle = "black";

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the candy with packaging

  ctx.save();

  ctx.translate(x, y);

  ctx.rotate(math.toRadian(-spring.velocity * 0.03));

  // Draw the left triangle

  // ctx.fillStyle = "red";

  // ctx.beginPath();

  // ctx.moveTo(-50, -30 + leftTriangleY);

  // ctx.lineTo(-30, 0 + leftTriangleY);

  // ctx.lineTo(-50, 30 + leftTriangleY);

  // ctx.closePath();

  // ctx.fill();

  // Draw the right triangle

  // ctx.beginPath();

  // ctx.moveTo(50, -30 + rightTriangleY);

  // ctx.lineTo(30, 0 + rightTriangleY);

  // ctx.lineTo(50, 30 + rightTriangleY);

  // ctx.closePath();

  // ctx.fill();

  // Draw the circle candy

  ctx.fillStyle = "pink";

  ctx.beginPath();

  ctx.arc(0, 0, candyRadius, 0, Math.PI * 2);

  ctx.fill();

  let PopBubbleAsPlayed = false;

  if (candyRadius >= 500) {
    if (candyRadius > 500 && !eventTriggered) {
      console.log("Once");
      eventTriggered = true; // Set the flag so the event won't happen again
      BlowBubbleInst.setVolume(0);
      BlowBubbleInst = null;
      PopBubble.play({
        rate: 1,
        volume: 20,
      });
    }
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.fillStyle = "black";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";

    ctx.textBaseline = "middle";

    ctx.font = `${canvas.height}px Helvetica Neue, Helvetica , bold`;

    ctx.textAlign = "center";

    // ctx.translate(x, y);

    ctx.fillText("0", canvas.width / 2, canvas.height / 2 + 50);

    handleInteraction(dt);

    drawPath();
  }
  ctx.restore();

  // if (scale <= 0) {

  // finish();

  // }
}

function extractInteractivePoints() {
  const step = 1; // Adjust step for the density of points

  interactivePoints = pathPoints.flatMap((path) =>
    path.filter((_, index) => index % step === 0)
  );
}

const radius = 15; // Interaction radius

const range = 4; // Range of points to move

let selectedIndex = null; // Index of the selected point

function initializeSprings() {
  // Initialize spring for each interactive point with its original position

  interactivePoints.forEach((point, index) => {
    springs[index] = new Spring({
      position: point,

      target: point, // Target is initially the original position

      frequency: 1,

      halfLife: 0.1,
    });

    originalPositions[index] = { ...point }; // Save the original position
  });
}
let mouseOffsetX = canvas.width / 2;
let mouseOffsetY = canvas.height / 2 - 500;
function handleInteraction(dt) {
  const mouseX = input.getX() - mouseOffsetX;

  const mouseY = input.getY() - mouseOffsetY;

  if (input.isDown() && !selectedPoint) {
    console.log("Mouse pressed");

    // Detect drag start: Check if the mouse is near any interactive point

    interactivePoints.forEach((point, index) => {
      console.log("Checking point:", point.x);

      const distance = Math.hypot(mouseX - point.x, mouseY - point.y);

      if (distance < radius) {
        selectedPoint = point; // Mark this point as selected

        selectedIndex = index; // Store the index of the selected point

        console.log("Interactive point clicked at index:", selectedIndex); // Log the index
      }
    });
  } else if (input.isPressed() && selectedPoint) {
    console.log("Mouse dragged");

    // Calculate the offset of the mouse to maintain the distance between selected and adjacent points

    const offsetX = mouseX - selectedPoint.x;

    const offsetY = mouseY - selectedPoint.y;

    // Move the selected point

    selectedPoint.x = mouseX;

    selectedPoint.y = mouseY;

    // Move previous points within range (up to 3 before the selected point)

    for (let i = 1; i <= range; i++) {
      const prevIndex = selectedIndex - i;

      if (prevIndex >= 0) {
        const prevPoint = interactivePoints[prevIndex];

        prevPoint.x += offsetX;

        prevPoint.y += offsetY;
      }
    }

    // Move next points within range (up to 3 after the selected point)

    for (let i = 1; i <= range; i++) {
      const nextIndex = selectedIndex + i;

      if (nextIndex < interactivePoints.length) {
        const nextPoint = interactivePoints[nextIndex];

        nextPoint.x += offsetX;

        nextPoint.y += offsetY;
      }
    }
  } else if (input.isUp() && selectedPoint) {
    console.log("Mouse released");

    // Release the point: Start the spring effect to restore original positions

    interactivePoints.forEach((point, index) => {
      // Move the point back to its original position

      point.x = originalPositions[index].x;

      point.y = originalPositions[index].y;

      // Use spring to smoothly move back to the original position

      springs[index].target = originalPositions[index]; // Set target to the original position
    });

    selectedPoint = null;

    selectedIndex = null; // Reset index when mouse is released
  }

  // Update the springs for each interactive point

  springs.forEach((spring) => spring.step(dt));

  // Check the distance and move the shape if the distance exceeds 200px

  let maxDistance = 0;

  let offsetX = 0;

  let offsetY = 0;

  // Find the point with the maximum distance moved

  interactivePoints.forEach((point, index) => {
    const distance = Math.hypot(
      point.x - originalPositions[index].x,

      point.y - originalPositions[index].y
    );

    if (distance > maxDistance) {
      maxDistance = distance;

      offsetX = point.x - originalPositions[index].x; // Store the offset for the dragged point

      offsetY = point.y - originalPositions[index].y;
    }
  });

  // If any point has moved more than 200px, apply the offset to all points

  if (maxDistance > 200) {
    interactivePoints.forEach((point) => {
      console.log(offsetX);
      if (
        Math.abs(point.x) > canvas.width * 10000 ||
        Math.abs(point.y) > canvas.height * 10000
      ) {
        setTimeout(() => {
          finish();
        }, 1500);
      }

      point.x += offsetX * 0.1; // Apply the offset

      point.y += offsetY * 0.1;
    });

    // Set the shape color to red

    ctx.fillStyle = "rgba(255, 255, 255, 1)"; // Shape turns red if points moved more than 200px

    selectedPoint = null; // Deselect the point
  } else {
    // Reset the color back to original

    // ctx.fillStyle = "rgba(255, 255, 255, 1)"; // Default color (white)
    ctx.fillStyle = "pink"; // Set the shape color to pink
  }
}

function drawPath() {
  // Draw the filled SVG shape

  // Save the current transformation matrix (for the path)

  ctx.save();

  // Translate the whole canvas context for drawing the path

  ctx.translate(mouseOffsetX, mouseOffsetY);

  ctx.beginPath();

  pathPoints.forEach((path) => {
    path.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });

    ctx.closePath();
  });

  ctx.fill();

  // Draw interactive points

  // interactivePoints.forEach((point) => {
  //   ctx.fillStyle = point === selectedPoint ? "blue" : "red"; // Highlight selected point

  //   ctx.beginPath();

  //   ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);

  //   ctx.fill();
  // });

  ctx.restore();

  // Restore the transformation matrix
}
