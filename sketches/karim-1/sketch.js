import { createEngine } from "../../shared/engine.js";
import { Spring } from "../../shared/spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

const spring = new Spring({
  position: -canvas.width,
  frequency: 0.5,
  halfLife: 0.3,
});

// Particle setup
const particles = [];
const numParticles = 100;
const boundingBox = { x: 0, y: 0, width: canvas.width, height: canvas.height };
let stopMovement = false;
for (let i = 0; i < numParticles; i++) {
  const baseRadius = Math.random(20, 30) + 10;
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: -3 + Math.random() * 6,
    vy: -3 + Math.random() * 6,
    baseRadius: baseRadius,
    radius: 0,
  });
}

const oneShapeWidth = 100;
// Progressively morph bounding box to "1" shape when mouse is pressed
function updateBoundingBox(dt) {
  const fullBox = { x: 0, y: 0, width: canvas.width, height: canvas.height };
  const oneShapeBox = {
    x: canvas.width / 2 - 50,
    y: canvas.height / 2 - 300,
    width: oneShapeWidth,
    height: 600,
  };

  const targetBox = stopMovement || input.isPressed() ? oneShapeBox : fullBox;

  const lerp = (a, b, t) => a + (b - a) * t;

  boundingBox.x = lerp(boundingBox.x, targetBox.x, dt * 2); // Adjust dt multiplier for speed
  boundingBox.y = lerp(boundingBox.y, targetBox.y, dt * 2);
  boundingBox.width = lerp(boundingBox.width, targetBox.width, dt * 2);
  boundingBox.height = lerp(boundingBox.height, targetBox.height, dt * 2);

  if (stopMovement) {
    setTimeout(() => {
      finish();
    }, 2000);
  }
}
function updateParticles(dt) {
  particles.forEach((particle) => {
    if (stopMovement) {
      particle.vx *= 0.9;
      particle.vy *= 0.9;
    }
    particle.x += particle.vx * 200 * dt;
    particle.y += particle.vy * 200 * dt;

    // Contain particles within the bounding box
    const boundMinX = boundingBox.x + particle.radius;
    const boundMaxX = boundingBox.x + boundingBox.width - particle.radius;
    if (particle.x < boundMinX || particle.x > boundMaxX) {
      particle.vx *= -1;
      particle.x = math.clamp(particle.x, boundMinX, boundMaxX);
    }

    const boundMinY = boundingBox.y + particle.radius;
    const boundMaxY = boundingBox.y + boundingBox.height - particle.radius;

    if (particle.y < boundMinY || particle.y > boundMaxY) {
      particle.vy *= -1;
      particle.y = math.clamp(particle.y, boundMinY, boundMaxY);
    }
  });
}
function update(dt) {
  // if (input.isPressed()) {
  // 	spring.target = canvas.width
  // }
  // else {
  // 	spring.target = 0
  // }

  // spring.step(dt)

  // const x = canvas.width / 2 + spring.position;
  // const y = canvas.height / 2;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  updateBoundingBox(dt);
  const progress = math.mapClamped(
    boundingBox.width,
    oneShapeWidth + 100,
    oneShapeWidth + 1,
    0,
    1
  );
  if (progress > 0.99) {
    stopMovement = true;
  }

  updateParticles(dt);

  ctx.fillStyle = "white";
  ctx.textBaseline = "middle";
  ctx.font = `${canvas.height}px Helvetica Neue, Helvetica , bold`;
  ctx.textAlign = "center";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(math.toRadian(-spring.velocity * 0.03));
  // ctx.fillText("1", 0, 0);

  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  particles.forEach((particle) => {
    const targetRadius = math.lerp(
      particle.baseRadius,
      oneShapeWidth / 2,
      progress
    );
    particle.radius = math.lerp(particle.radius, targetRadius, 0.01);
  });
  updateParticles(dt);

  particles.forEach((particle) => {
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.roundRect(
      particle.x - particle.radius,
      particle.y - particle.radius,
      particle.radius * 2,
      particle.radius * 2,
      math.lerp(particle.radius, 0, progress)
    );
    //ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // if (spring.position >= canvas.width - 10) {
  // 	finish()
  // }
}

run(update);
