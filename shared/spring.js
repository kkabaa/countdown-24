/**
 * @typedef {object} SpringSettings
 * @property {Number} omega - The angular frequency in radians per second.
 * @property {Number} zeta - The damping ratio of the spring.
 */

/**
 * @param {Object} options - The options for the spring.
 * @param {Number} options.frequency - The frequency of the spring.
 * @param {Number} options.halfLife - The half life of the spring.
 */
export function createSpringSettings({ frequency, halfLife }) {
  const omega = 2 * Math.PI * frequency;
  const zeta = -Math.log(0.5) / (omega * halfLife);
  return /** {SpringSettings} */ { omega, zeta };
}

export class Spring {
  /**
   * @param {Object} options - The options for the spring.
   * @param {Number} options.frequency - The frequency of the spring.
   * @param {Number} options.halfLife - The half life of the spring.
   * @param {Number} options.position - The current position of the spring.
   * @param {Number} options.target - The target position of the spring.
   * @param {Number} [options.wrap] - The wrap position of the spring.
   */
  constructor({ frequency, halfLife, position, velocity, target, wrap }) {
    this.settings = createSpringSettings({ frequency, halfLife });

    this.position = position ?? 0;
    this.velocity = velocity ?? 0;
    this.target = target ?? position ?? 0;
    this.wrap = wrap;
  }
  /**
   * @param {Number} deltaTime - Simulation delta time in seconds
   */
  step(deltaTime) {
    if (this.wrap !== undefined) {
      let distToTarget = this.target - this.position;
      if (distToTarget > this.wrap) distToTarget %= this.wrap;

      if (distToTarget > this.wrap / 2) distToTarget -= this.wrap;
      this.target = this.position + distToTarget;
    }

    // Implicit method
    var f = 1 + 2 * deltaTime * this.settings.zeta * this.settings.omega;
    var oo = this.settings.omega * this.settings.omega;
    var hoo = deltaTime * oo;
    var hhoo = deltaTime * hoo;
    var detInv = 1 / (f + hhoo);
    var detX =
      f * this.position + deltaTime * this.velocity + hhoo * this.target;
    var detV = this.velocity + hoo * (this.target - this.position);
    this.position = detX * detInv;
    this.velocity = detV * detInv;
  }
}
