// ComfortField (the generative “map”)

// Responsibility: provide a smooth comfort value at any point (x,y), based on pods + noise + corridors.

export class ComfortField {
  constructor(pods, corridors = [], streetBands = []) {
    this.pods = pods;
    this.corridors = corridors;
    this.streetBands = streetBands;

    this.noiseScale = 0.003;

    // weights (tune like V2 modes)
    this.wPods = 0.60;
    this.wCorr = 0.30;
    this.wNoise = 0.10;
  }

  sample(p, x, y, t) {
    // ---- pod influence (your gaussian) ----
    let v = 0;
    let wsum = 0;

    for (const pod of this.pods) {
      const dx = x - pod.pos.x;
      const dy = y - pod.pos.y;
      const d2 = dx * dx + dy * dy;

      const R = pod.influenceRadius();
      const w = Math.exp(-d2 / (2 * R * R));

      v += w * pod.strength();
      wsum += w;
    }
    const podComfort = wsum > 0 ? v / wsum : 0;

    // ---- corridor influence (V2 idea) ----
    let minD = Infinity;
    for (const s of this.corridors) {
      const d = pointToSegmentDist(x, y, s.a.x, s.a.y, s.b.x, s.b.y);
      if (d < minD) minD = d;
    }
    // map distance to 0..1
    const corridorComfort = p.constrain(p.map(minD, 0, 140, 1, 0), 0, 1);

    // ---- texture ----
    const n = p.noise(x * this.noiseScale, y * this.noiseScale, t * 0.05);

    // blend
    const comfort =
      this.wPods * podComfort +
      this.wCorr * corridorComfort +
      this.wNoise * n;

    return p.constrain(comfort, 0, 1);
  }

//   drawBackground(p, t, step = 14) {
//     p.noStroke();

//     for (let y = 0; y < p.height; y += step) {
//       for (let x = 0; x < p.width; x += step) {
//         const c = this.sample(p, x, y, t);
//         const h = p.map(c, 0, 1, 220, 140);   // blue -> green
//         const s = 18;
//         const b = p.map(c, 0, 1, 92, 98);
//         p.fill(h, s, b, 55);
//         p.rect(x, y, step, step);
//       }
//     }
//   }

drawBackground(p, t, step = 14) {
  p.noStroke();

  for (let y = 0; y < p.height; y += step) {
    for (let x = 0; x < p.width; x += step) {
      const c = this.sample(p, x, y, t); // 0..1

      // V2-ish paper: mostly constant hue, comfort affects brightness slightly
      const h = 210;                          // blue-grey
      const s = 8 + 6 * c;                    // 8..14 (subtle)
      const b = 96 - 6 * (1 - c);             // 90..96-ish
      const a = 35;                           // opacity like V2 "soft paper"

      p.fill(h, s, b, a);
      p.rect(x, y, step, step);
    }
  }
}


//   drawCorridors(p, t) {  
//     // V2 band look — keep simple for now, style later
//     p.push();
//     p.noFill();
//     p.strokeWeight(1);

//     for (let i = 0; i < this.corridors.length; i++) {
//       const s = this.corridors[i];
//       const wobble = 0.5 + 0.5 * p.sin(t * 0.8 + s.phase);

//       // grayscale placeholder (you can re-add HSB)
//       const alpha = p.map(wobble, 0, 1, 20, 70);
//       //p.stroke(255, alpha);
//       p.stroke(0, 0, 100, alpha);


//       p.line(s.a.x, s.a.y, s.b.x, s.b.y);
//     }
//     p.pop();
//   }

// drawCorridors(p, t) {
//   p.push();
//   p.noFill();
//   //p.strokeWeight(1.6);
//   p.strokeWeight(18);

//   for (let i = 0; i < this.corridors.length; i++) {
//     const s = this.corridors[i];
//     const wobble = 0.5 + 0.5 * p.sin(t * 0.8 + s.phase);

//     // V2 trail-line color
//     const alpha = p.map(wobble, 0, 1, 18, 38);
//     p.stroke(210, 15, 60, alpha);

//     p.line(s.a.x, s.a.y, s.b.x, s.b.y);
//   }
//   p.pop();
// }

drawCorridors(p, t) {
  p.push();
  p.noFill();
  p.strokeCap(p.ROUND);

  for (let i = 0; i < this.corridors.length; i++) {
    const s = this.corridors[i];
    const wobble = 0.5 + 0.5 * p.sin(t * 0.8 + s.phase);

    // pick hue that "belongs" to the nearest street band
    const baseHue = this.nearestBandHue(p, s) ?? 210;

    // V2-like subtle animated tint
    const h = (baseHue + 6 * p.sin(t * 0.7 + i * 0.3)) % 360;
    const alpha = p.map(wobble, 0, 1, 12, 26); // much softer than before

    p.stroke(h, 18, 78, alpha);  // low sat, mid bright
    p.strokeWeight(11);         // << keep corridors as "thin graph"
    p.line(s.a.x, s.a.y, s.b.x, s.b.y);
  }

  p.pop();
}


drawStreetBands(p, t) {
  p.push();
  p.noFill();
  p.strokeCap(p.ROUND);     // poster-ish ends
  p.strokeJoin(p.MITER);

  for (const line of this.streetBands) {
    const stations = line.stations || [];
    if (stations.length < 2) continue;

    // faint extension beyond end stations (so it "runs out of the map")
    const ext = extendEnds(stations[0], stations[stations.length - 1], line.extend ?? 2800);

    p.stroke(255, 12);
    p.strokeWeight(line.w * 2); // 22 => 44

    const base = line.baseHue ?? 210;
    for (let i = 0; i < stations.length - 1; i++) {
    const phase = t * 0.8 + i * 0.6;
    const h = (base + 8 * p.sin(phase)) % 360;
    p.stroke(h, 30, 92, 55);
    p.strokeWeight(line.w * 2);
    p.line(stations[i].x, stations[i].y, stations[i+1].x, stations[i+1].y);
    }

    // extend past the first/last station (metro line continues)
    p.line(ext.x0, ext.y0, stations[0].x, stations[0].y);
    p.line(stations[stations.length - 1].x, stations[stations.length - 1].y, ext.x1, ext.y1);
  }

  p.pop();
}

nearestBandHue(p, corridor) {
  if (!this.streetBands || this.streetBands.length === 0) return null;

  // sample corridor midpoint
  const mx = (corridor.a.x + corridor.b.x) * 0.5;
  const my = (corridor.a.y + corridor.b.y) * 0.5;

  let bestHue = null;
  let bestD = Infinity;

  for (const band of this.streetBands) {
    const stations = band.stations || [];
    if (stations.length < 2) continue;

    // approximate distance: min dist to each station-to-station segment
    for (let i = 0; i < stations.length - 1; i++) {
      const a = stations[i];
      const b = stations[i + 1];
      const d = pointToSegmentDist(mx, my, a.x, a.y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        bestHue = band.baseHue ?? 210;
      }
    }
  }

  return bestHue;
}


}


// --- helpers  ---

function extendEnds(a, b, extend = 2800) {
  const theta = Math.atan2(b.y - a.y, b.x - a.x);
  const dx = Math.cos(theta), dy = Math.sin(theta);
  return {
    x0: a.x - dx * extend,
    y0: a.y - dy * extend,
    x1: b.x + dx * extend,
    y1: b.y + dy * extend,
  };
}

// point-to-segment distance (V2 logic)
function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;

  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(px - ax, py - ay);

  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(px - bx, py - by);

  const t = c1 / c2;
  const cx = ax + t * vx;
  const cy = ay + t * vy;
  return Math.hypot(px - cx, py - cy);
}