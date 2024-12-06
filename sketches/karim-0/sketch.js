import { createEngine } from "../../shared/engine.js";
import { createSpringSettings, Spring } from "../../shared/spring.js";
import Utils from "./Utils.js";
const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;
init();
run(update);

let pathPoints = [];
let interactivePoints = [];
let selectedPoint = null; // To store the currently selected point
let originalPositions = []; // Store original positions of interactive points
let springs = []; // Store spring objects for each interactive point

async function init() {
  pathPoints = await Utils.loadSVG("./gumgum.svg");
  console.log(pathPoints);
  extractInteractivePoints();
  // Initialize springs for each interactive point
  initializeSprings();
}

function update(dt) {
  ctx.fillStyle = "orange";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Start falling when mouse is clicked
  if (input.isPressed()) {
    spring.target = -0.1;
    spring.settings = settings2;
    candyRadius += 1;
    isFalling = true; // Enable falling when mouse is clicked
  } else {
    spring.target = 1;
    spring.settings = settings1;
  }

  // Update positions only if falling
  if (isFalling) {
    leftTriangleY += fallSpeed * dt;
    rightTriangleY += fallSpeed * dt;
  }

  handleInteraction(dt);
  drawPath();

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

function handleInteraction(dt) {
  const mouseX = input.getX();
  const mouseY = input.getY();

  if (input.isDown() && !selectedPoint) {
    // Detect drag start: Check if the mouse is near any interactive point
    interactivePoints.forEach((point, index) => {
      const distance = Math.hypot(mouseX - point.x, mouseY - point.y);
      if (distance < radius) {
        selectedPoint = point; // Mark this point as selected
        selectedIndex = index; // Store the index of the selected point
        console.log("Interactive point clicked at index:", selectedIndex); // Log the index
      }
    });
  } else if (input.isPressed() && selectedPoint) {
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

      point.x += offsetX * 0.1; // Apply the offset
      point.y += offsetY * 0.1;
    });
    // Set the shape color to red
    ctx.fillStyle = "rgba(255, 255, 255, 1)"; // Shape turns red if points moved more than 200px
    selectedPoint = null; // Deselect the point
  } else {
    // Reset the color back to original
    ctx.fillStyle = "rgba(255, 255, 255, 1)"; // Default color (white)
  }
}

function drawPath() {
  // Draw the filled SVG shape
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
}
