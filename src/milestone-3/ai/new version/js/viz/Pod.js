//Responsibility: draw + expose “influence” to field + optional pulsing.
// viz/Pod.js
export class Pod {
  constructor({ p, id, pos, comfort, predictedOcc, label }) {
    this.p = p;                
    this.id = id;
    this.pos = pos.copy();
    this.comfort = comfort;           // 0..1
    this.predictedOcc = predictedOcc; // 0..1
    this.label = label;

    this.baseR = 10;
    this.pulsePhase = this.p.random(this.p.TWO_PI);
  }

  update(dt, t) {
    // pulse speed tied to predicted occupancy (future pressure)
    this.pulsePhase += dt * (0.8 + this.predictedOcc * 2.0);
  }

  influenceRadius() {
    return 60 + this.comfort * 140;
  }

  strength() {
    // high comfort attracts, high predicted occupancy reduces attraction
    const futurePenalty = this.predictedOcc * 0.5;
    return Math.max(0, this.comfort - futurePenalty); 
  }

    // draw(t) {
    // const p = this.p;
    // const pulse = 1 + 0.15 * p.sin(this.pulsePhase);

    // p.push();
    // p.translate(this.pos.x, this.pos.y);

    // // --- halo (comfort) ---
    // const haloR = this.influenceRadius() * 0.35;
    // const haloA = p.map(this.comfort, 0, 1, 8, 22);     // alpha in 0..100
    // p.noStroke();
    // p.fill(0, 0, 100, haloA);                           // white glow
    // p.ellipse(0, 0, haloR * 1.5, haloR * 1.5);

    // // --- station ring ---
    // const r = (this.baseR + this.comfort * 10) * pulse;
    // p.noFill();
    // p.stroke(0, 0, 100, 80);                             // white ring
    // p.strokeWeight(2);
    // p.ellipse(0, 0, r * 2, r * 2);

    // // --- availability arc (user-facing) ---
    // const availability = 1 - p.constrain(this.predictedOcc, 0, 1);
    // const arcR = r + 6;
    // const start = -p.HALF_PI;
    // const end = start + p.TWO_PI * availability;

    // // HSB palette (like your poster vibe)
    // // green -> yellow/orange -> red
    // let h, s, b;
    // if (availability > 0.7) {
    //     h = 140; s = 55; b = 95;     // green
    // } else if (availability > 0.35) {
    //     h = 45;  s = 55; b = 95;     // yellow/orange
    // } else {
    //     h = 0;   s = 55; b = 95;     // red
    // }

    // const arcA = 65 + 20 * p.sin(this.pulsePhase);       // 0..100
    // p.stroke(h, s, b, arcA);
    // p.strokeWeight(3);
    // p.noFill();
    // p.arc(0, 0, arcR * 2, arcR * 2, start, end);

    // // --- center dot ---
    // p.noStroke();
    // p.fill(0, 0, 100, 90);
    // p.ellipse(0, 0, 4, 4);

    // p.pop();
    // }

//     draw(t) {
//   const p = this.p;
//   const pulse = 1 + 0.15 * p.sin(this.pulsePhase);

//   p.push();
//   p.translate(this.pos.x, this.pos.y);

//   // halo (stronger)
//   const haloR = this.influenceRadius() * 0.28;
//   p.noStroke();
//   p.fill(0, 0, 100, 28);
//   p.ellipse(0, 0, haloR * 1.7, haloR * 1.7);

//   // ✅ white disk (V2 clarity)
//   p.noStroke();
//   p.fill(0, 0, 200, 92);
//   p.ellipse(0, 0, 20, 20);

//   // ring
//   const r = (this.baseR + this.comfort * 10) * pulse;
//   p.noFill();
//   p.stroke(0, 0, 100, 90);
//   p.strokeWeight(2);
//   p.ellipse(0, 0, r * 2, r * 2);

//   // availability arc
//   const availability = 1 - p.constrain(this.predictedOcc, 0, 1);
//   const arcR = r + 7;
//   const start = -p.HALF_PI;
//   const end = start + p.TWO_PI * availability;

//   let h, s, b;
//   if (availability > 0.7)      { h = 140; s = 55; b = 95; }
//   else if (availability > 0.35){ h = 45;  s = 55; b = 95; }
//   else                         { h = 0;   s = 55; b = 95; }

//   p.stroke(h, s, b, 95);
//   p.strokeWeight(3);
//   p.arc(0, 0, arcR * 2, arcR * 2, start, end);

//   // center dot
//   p.noStroke();
//   p.fill(0, 0, 100, 95);
//   p.ellipse(0, 0, 5, 5);

//   p.pop();
// }

draw(t) {
  const p = this.p;
  const pulse = 1 + 0.15 * p.sin(this.pulsePhase);

  p.push();
  p.translate(this.pos.x, this.pos.y);

  // --- subtle halo (keep it soft) ---
  const haloR = this.influenceRadius() * 0.28;
  p.noStroke();
  p.fill(0, 0, 100, 18);               // soft white glow
  p.ellipse(0, 0, haloR * 1.6, haloR * 1.6);

  // --- outer disk (V2 had white; keep it but slightly less bright) ---
  // If you truly want NO white disk, comment this block out.
  p.noStroke();
  p.fill(0, 0, 100, 70);               // was 95 in V2; lower so green reads
  p.ellipse(0, 0, 24, 24);

  // --- green ring (V2) ---
  const r = (this.baseR + this.comfort * 10) * pulse;
  p.noFill();
//   p.stroke(130, 80, 80, 100);          // V2 green ring
//   p.strokeWeight(3);
//   p.ellipse(0, 0, r * 2, r * 2);

  // --- station ring (neutral blue-grey) ---
p.noFill();
p.stroke(220, 30, 92, 95);   // slate blue-grey
p.strokeWeight(2.5);
p.ellipse(0, 0, r * 2, r * 2);



  // --- availability arc (keep your meaning, but make it bolder) ---
  const availability = 1 - p.constrain(this.predictedOcc, 0, 1);
  const arcR = r + 6;
  const start = -p.HALF_PI;
  const end = start + p.TWO_PI * availability;

  let h, s, b;
  if (availability > 0.7)      { h = 130; s = 70; b = 90; } // green
  else if (availability > 0.35){ h = 45;  s = 70; b = 95; } // orange
  else                         { h = 0;   s = 70; b = 95; } // red

  p.stroke(h, s, b, 95);
  p.strokeWeight(3);
  p.arc(0, 0, arcR * 2, arcR * 2, start, end);

  // --- center dot (V2 green) ---
//   p.noStroke();
//   p.fill(130, 80, 90, 100);            // V2 green center
//   p.ellipse(0, 0, 8, 8);

// --- center dot ---
p.noStroke();
p.fill(220, 30, 92, 100);
p.ellipse(0, 0, 6, 6);

  p.pop();
}

}