// This value will be updated from dashboard.js based on predicted usage (0–1)
let activityLevel = 0.5;

// Expose a setter so dashboard.js can control animation speed
window.setActivityLevel = function (level) {
  activityLevel = level;
};

// p5 sketch (instance mode so we don't leak globals)
const systemActivitySketch = (p) => {
  let particles = [];
  const NUM_PARTICLES = 28;

  p.setup = () => {
    const container = document.getElementById("systemActivityCanvas");
    const width = container.clientWidth || 600;
    const height = 72;
    const canvas = p.createCanvas(width, height);
    canvas.parent(container);

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: p.random(width),
        yBase: height / 2 + p.random(-10, 10),
        offset: p.random(1000),
      });
    }
  };

  p.windowResized = () => {
    const container = document.getElementById("systemActivityCanvas");
    if (!container) return;
    const width = container.clientWidth || 600;
    p.resizeCanvas(width, 72);
  };

  p.draw = () => {
    // background gradient-ish
    const w = p.width;
    const h = p.height;
    p.noStroke();
    p.background(8, 18, 45);

    const gradSteps = 4;
    for (let i = 0; i < gradSteps; i++) {
      const alpha = 18 + i * 8;
      p.fill(59, 130, 246, alpha); // soft blue layers
      p.rect(0, h / 2 - 18 + i * 4, w, 24, 999);
    }

    // tiny moving pulses
    const speed = p.map(activityLevel, 0, 1, 0.4, 1.6);
    const amp = p.map(activityLevel, 0, 1, 8, 20);

    particles.forEach((pt, idx) => {
      pt.x += speed;
      if (pt.x > w + 10) pt.x = -10;

      const n = p.noise(pt.offset + p.frameCount * 0.01 * speed);
      const y = pt.yBase + (n - 0.5) * 2 * amp;

      const size = 4 + n * 6;
      const glow = 80 + n * 80;

      // glow halo
      p.noStroke();
      p.fill(129, 140, 248, glow * 0.3);
      p.ellipse(pt.x, y, size * 2.8, size * 2.1);

      // core
      p.fill(191, 219, 254);
      if (idx % 7 === 0) {
        // occasional "pulse" packet
        p.fill(248, 250, 252);
      }
      p.ellipse(pt.x, y, size, size);
    });

    // faint grid lines
    p.stroke(15, 23, 42, 120);
    p.strokeWeight(1);
    for (let i = 0; i < 5; i++) {
      const gx = (w / 4) * i;
      p.line(gx, 12, gx, h - 12);
    }
  };
};

new p5(systemActivitySketch);
