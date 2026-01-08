// BikeAgent (reactive “search” behavior)

// This is your AI-art centerpiece: agents moving toward higher comfort.

export class BikeAgent {
  constructor(pos) {
    this.pos = pos.copy();
    this.vel = pos.copy().mult(0.0);
    this.maxSpeed = 2.2;

    this.trail = [];
    this.trailMax = 80;

    this._prevPos = pos.copy();
  }

  update(p, field, dt, t) {
    // Hill-climbing / gradient ascent
    const grad = this.estimateGradient(p, field, t);
    this.vel.add(grad.mult(0.6));

    // Human-ish jitter
    const jitter = p.createVector(p.random(-1, 1), p.random(-1, 1));
    if (jitter.magSq() > 0) jitter.normalize();
    jitter.mult(0.15);
    this.vel.add(jitter);

    this.vel.limit(this.maxSpeed);

    // save prev
    this._prevPos.set(this.pos);

    // move
    this.pos.add(this.vel);

    // --- wrap + detect teleport ---
    let teleported = false;

    if (this.pos.x < 0) { this.pos.x += p.width; teleported = true; }
    else if (this.pos.x >= p.width) { this.pos.x -= p.width; teleported = true; }

    if (this.pos.y < 0) { this.pos.y += p.height; teleported = true; }
    else if (this.pos.y >= p.height) { this.pos.y -= p.height; teleported = true; }

    // --- trail ---
    // push a "break" marker when teleporting so the line doesn't connect
    if (teleported) this.trail.push(null);
    this.trail.push(this.pos.copy());

    // trim (keep breaks too)
    while (this.trail.length > this.trailMax) this.trail.shift();

    // respawn if stuck / low comfort
    const cHere = field.sample(p, this.pos.x, this.pos.y, t);
    if (cHere < 0.12 || this.vel.magSq() < 0.02) {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.vel.mult(0);
      this.trail = [];
    }
  }

  estimateGradient(p, field, t) {
    const eps = 8;
    const c0 = field.sample(p, this.pos.x, this.pos.y, t);
    const cx = field.sample(p, this.pos.x + eps, this.pos.y, t);
    const cy = field.sample(p, this.pos.x, this.pos.y + eps, t);
    return p.createVector(cx - c0, cy - c0).mult(3.0);
  }

  draw(p) {
    // trail
    // p.noFill();
    // p.stroke(210, 15, 60, 30); // cool blue-grey trail
    // p.strokeWeight(2);

    // p.beginShape();
    // for (const pt of this.trail) {
    //     if (!pt) {
    //     p.endShape();
    //     p.beginShape();
    //     continue;
    //     }
    //     p.vertex(pt.x, pt.y);
    // }
    // p.endShape();

    // cyclist dot
    p.noStroke();
    p.fill(195, 40, 90, 90);   // teal-ish dot
    p.ellipse(this.pos.x, this.pos.y, 16,16);

    // halo
    p.noFill();
    p.stroke(0, 0, 100, 50);   // white halo
    p.strokeWeight(1);
    p.ellipse(this.pos.x, this.pos.y, 24, 24);
    }
}
