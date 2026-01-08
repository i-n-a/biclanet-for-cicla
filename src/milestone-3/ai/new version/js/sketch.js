import {
  loadAllDataFromJson,
  loadOccupancyModel,
  forecastAllPods
} from "./script.js";

import { Pod } from "./viz/Pod.js";
import { BikeAgent } from "./viz/BikeAgent.js";
import { ComfortField } from "./viz/ComfortField.js";
import { GeoProjector } from "./viz/GeoProjector.js";

//streets

// function buildStreetBandsFromPods(p, pods, opts = {}) {
//   const {
//     seed = 1234,
//     numTrunks = 6,      // main poster-like bands
//     width = 22,         // target thickness (core)
//     extend = 2400,      // how far lines run out
//     angles = [
//       0,                 // horizontal
//       p.HALF_PI,         // vertical
//       p.PI * 0.25,       // /
//       p.PI * -0.25,      // \
//       p.PI * 0.35,
//       p.PI * -0.35,
//     ],
//   } = opts;

//   // --- deterministic randomness ---
//   p.randomSeed(seed);

//   // 1) Create a small set of "trunk" streets with fixed angles + random offsets
//   // Use anchors that are NOT tied to pods yet (so the plan feels global)
//   const trunks = [];
//   for (let i = 0; i < numTrunks; i++) {
//     const theta = angles[Math.floor(p.random(angles.length))];

//     // pick an anchor somewhere in canvas (global plan)
//     const ax = p.random(p.width * 0.15, p.width * 0.85);
//     const ay = p.random(p.height * 0.15, p.height * 0.85);

//     trunks.push({
//       theta,
//       anchor: p.createVector(ax, ay),
//       w: width,
//       extend,
//       phase: p.random(10),
//       isTrunk: true,
//     });
//   }

//   // 2) Assign each pod to its nearest trunk line and "snap" that trunk closer
//   // so the trunk actually goes through the pod (poster look: circles sit on bands)
//   for (const pod of pods) {
//     let best = null;
//     let bestD = Infinity;

//     for (const t of trunks) {
//       const d = distPointToInfiniteLine(pod.pos.x, pod.pos.y, t.anchor.x, t.anchor.y, t.theta);
//       if (d < bestD) { bestD = d; best = t; }
//     }

//     // move trunk anchor perpendicular toward the pod so the line passes through pod
//     // (small move => keeps global structure; big move => forces coverage)
//     const moved = snapLineThroughPoint(p, best.anchor, best.theta, pod.pos, 0.65);
//     best.anchor = moved;
//   }

//   // 3) Optional: add a couple of "secondary" streets that pass through outlier pods
//   // (helps if you have pods far away from trunks)
//   const secondaries = [];
//   for (const pod of pods) {
//     // if pod is still far from all trunks, add a street through it
//     let minD = Infinity;
//     for (const t of trunks) {
//       const d = distPointToInfiniteLine(pod.pos.x, pod.pos.y, t.anchor.x, t.anchor.y, t.theta);
//       if (d < minD) minD = d;
//     }
//     if (minD > 55) { // threshold tune
//       const theta = angles[Math.floor(p.random(angles.length))];
//       secondaries.push({
//         theta,
//         anchor: pod.pos.copy(), // guaranteed pass-through
//         w: width,
//         extend,
//         phase: p.random(10),
//         isTrunk: false,
//       });
//     }
//   }

//   return [...trunks, ...secondaries];
// }

// function buildStreetBandsFromPods(p, pods, opts = {}) {
//   const {
//     seed = 42,
//     k = 2,          // each pod connects to k partners
//     width = 22,
//     extend = 2400,
//   } = opts;

//   p.randomSeed(seed);

//   const bands = [];
//   const used = new Set();

//   for (let i = 0; i < pods.length; i++) {
//     const a = pods[i];

//     // nearest neighbors (or random among nearest)
//     const nn = pods
//       .map((b, j) => ({ b, j, d2: (a.pos.x - b.pos.x) ** 2 + (a.pos.y - b.pos.y) ** 2 }))
//       .filter(o => o.j !== i)
//       .sort((u, v) => u.d2 - v.d2)
//       .slice(0, 5); // candidates

//     for (let t = 0; t < k; t++) {
//       const pick = nn[Math.floor(p.random(nn.length))];
//       const j = pick.j;

//       const key = i < j ? `${i}-${j}` : `${j}-${i}`;
//       if (used.has(key)) continue;
//       used.add(key);

//       const dx = pick.b.pos.x - a.pos.x;
//       const dy = pick.b.pos.y - a.pos.y;
//       const theta = Math.atan2(dy, dx);

//       bands.push({
//         theta,
//         a: a.pos.copy(),
//         b: pick.b.pos.copy(),
//         w: width,
//         extend,
//         phase: p.random(10),
//       });
//     }
//   }

//   return bands;
// }

function buildStreetBandsFromPods(p, pods, opts = {}) {
  const {
    seed = 42,
    numLines = 5,          // poster-like amount
    width = 22,
    //angles = [
    //   0,
    //   p.HALF_PI,
    //   p.PI * 0.25,
    //   p.PI * -0.25,
    //   p.PI * 0.35,
    //   p.PI * -0.35,
    // ],
    angles = [0, p.HALF_PI, p.PI*0.25, -p.PI*0.25],
    stationDist = 28,      // how close a pod must be to be "on" a line
    minStations = 3,       // reject lines with too few pods
    maxStations = 6,       // keeps composition clean
    extend = 2800,
    intersectionSnap = 30, // intersections must land near a pod
  } = opts;

  p.randomSeed(seed);

  const podPts = pods.map(pd => pd.pos.copy());

  // Build candidate lines by picking 2 pods and using their direction snapped to one of the angles
  const candidates = [];
  const tries = 1200;

  for (let t = 0; t < tries; t++) {
    const a = podPts[Math.floor(p.random(podPts.length))];
    const b = podPts[Math.floor(p.random(podPts.length))];
    if (a === b) continue;

    const rawTheta = Math.atan2(b.y - a.y, b.x - a.x);
    const theta = nearestAngle(rawTheta, angles);

    // Put the line through a (anchor = a)
    const anchor = a.copy();

    // Collect stations close to this infinite line
    let stations = pods
      .map(pd => ({
        pos: pd.pos.copy(),
        s: scalarProjection(pd.pos, anchor, theta),
        d: distPointToInfiniteLine(pd.pos, anchor, theta),
      }))
      .filter(o => o.d < stationDist)
      .sort((u, v) => u.s - v.s);

    // keep it clean
    if (stations.length < minStations) continue;
    if (stations.length > maxStations) {
      // pick an evenly spread subset
      const step = (stations.length - 1) / (maxStations - 1);
      stations = Array.from({ length: maxStations }, (_, i) => stations[Math.round(i * step)]);
    }

    candidates.push({
      theta,
      anchor,
      stations: stations.map(s => s.pos),
      w: width,
      extend,
      baseHue: p.random([330, 210, 190, 45, 120]), // poster-ish set
      // for your draw: we store endpoints later
    });
  }

  // Now select a small set with good coverage + controlled intersections
  const chosen = [];
  const covered = new Set(); // pod indices covered

  // helper: score by "new coverage"
  function coverageScore(line) {
    let score = 0;
    for (const sp of line.stations) {
      const idx = nearestPodIndex(sp, podPts);
      if (!covered.has(idx)) score++;
    }
    return score;
  }

  // greedily pick best lines
    // greedily pick best lines
  let relax = 0; // 0 = strict, 1 = looser, 2 = fallback
  while (chosen.length < numLines && candidates.length) {
    candidates.sort((a, b) => coverageScore(b) - coverageScore(a));
    const best = candidates.shift();
    if (!best) break;

    const snap = intersectionSnap + relax * 18;       // allow slightly less perfect transfer snaps
    const ok = intersectionsOk(p, best, chosen, podPts, snap);

    if (!ok) {
      // if we keep failing, relax rules gradually
      relax = Math.min(2, relax + 0.15);
      continue;
    }

    chosen.push(finalizeLine(p, best));
    for (const sp of best.stations) covered.add(nearestPodIndex(sp, podPts));
  }

  // If still short, allow lines with fewer stations as a last resort
  if (chosen.length < numLines) {
    const need = numLines - chosen.length;
    const leftovers = candidates
      .slice(0, 200)
      .filter(l => (l.stations?.length ?? 0) >= 2) // fallback: allow 2 stations
      .slice(0, need)
      .map(l => finalizeLine(p, l));
    chosen.push(...leftovers);
  }

  return chosen;

}

// ----- helpers -----

function nearestAngle(theta, angles) {
  let best = angles[0], bestD = Infinity;
  for (const a of angles) {
    const d = Math.abs(angleDiff(theta, a));
    if (d < bestD) { bestD = d; best = a; }
  }
  return best;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function distPointToInfiniteLine(p, anchor, theta) {
  const dx = Math.cos(theta), dy = Math.sin(theta);
  return Math.abs((p.x - anchor.x) * dy - (p.y - anchor.y) * dx);
}

function scalarProjection(p, anchor, theta) {
  const dx = Math.cos(theta), dy = Math.sin(theta);
  return (p.x - anchor.x) * dx + (p.y - anchor.y) * dy;
}

function nearestPodIndex(pt, podPts) {
  let best = 0, bestD2 = Infinity;
  for (let i = 0; i < podPts.length; i++) {
    const d2 = (pt.x - podPts[i].x) ** 2 + (pt.y - podPts[i].y) ** 2;
    if (d2 < bestD2) { bestD2 = d2; best = i; }
  }
  return best;
}

// function intersectionsOk(p, candidate, chosen, podPts, snapR) {
//   // check intersection with each already-chosen line:
//   // if they intersect inside canvas, it must be near a pod.
//   for (const L of chosen) {
//     const ip = intersectInfiniteLines(candidate.anchor, candidate.theta, L.anchor, L.theta);
//     if (!ip) continue;

//     if (ip.x >= 0 && ip.x <= p.width && ip.y >= 0 && ip.y <= p.height) {
//       let near = false;
//       for (const pd of podPts) {
//         const d2 = (ip.x - pd.x) ** 2 + (ip.y - pd.y) ** 2;
//         if (d2 < snapR * snapR) { near = true; break; }
//       }
//       if (!near) return false;
//     }
//   }
//   return true;
// }

function intersectionsOk(p, candidate, chosen, podPts, snapR) {
  for (const L of chosen) {
    const ip = intersectInfiniteLines(candidate.anchor, candidate.theta, L.anchor, L.theta);
    if (!ip) continue;

    if (ip.x >= 0 && ip.x <= p.width && ip.y >= 0 && ip.y <= p.height) {
      // find closest pod to intersection
      let bestIdx = -1, bestD2 = Infinity;
      for (let i = 0; i < podPts.length; i++) {
        const d2 = (ip.x - podPts[i].x) ** 2 + (ip.y - podPts[i].y) ** 2;
        if (d2 < bestD2) { bestD2 = d2; bestIdx = i; }
      }

      if (bestD2 > snapR * snapR) return false;

      // ✅ force a shared "transfer station"
      const station = podPts[bestIdx].copy();
      candidate.stations = addStationUnique(candidate.stations, station);

      // also inject into existing line so both share it
      L.stations = addStationUnique(L.stations, station);
    }
  }
  return true;
}

function addStationUnique(list, pt, eps = 6) {
  const out = list ? [...list] : [];
  for (const q of out) {
    if ((q.x - pt.x) ** 2 + (q.y - pt.y) ** 2 < eps * eps) return out;
  }
  out.push(pt);
  return out;
}


function intersectInfiniteLines(a0, th0, a1, th1) {
  // line0: a0 + t*v0, line1: a1 + u*v1
  const v0 = { x: Math.cos(th0), y: Math.sin(th0) };
  const v1 = { x: Math.cos(th1), y: Math.sin(th1) };

  const det = v0.x * v1.y - v0.y * v1.x;
  if (Math.abs(det) < 1e-6) return null; // parallel

  const dx = a1.x - a0.x;
  const dy = a1.y - a0.y;
  const t = (dx * v1.y - dy * v1.x) / det;

  return { x: a0.x + t * v0.x, y: a0.y + t * v0.y };
}

function finalizeLine(p, line) {
  // compute edge-to-edge endpoints (like the poster)
  const dx = Math.cos(line.theta), dy = Math.sin(line.theta);

  const big = line.extend ?? 2800;
  return {
    ...line,
    x1: line.anchor.x - dx * big,
    y1: line.anchor.y - dy * big,
    x2: line.anchor.x + dx * big,
    y2: line.anchor.y + dy * big,
  };
}


// distance from point to an infinite line defined by (x0,y0) + angle theta
// function distPointToInfiniteLine(px, py, x0, y0, theta) {
//   const dx = Math.cos(theta), dy = Math.sin(theta);
//   // perpendicular distance via cross product magnitude
//   return Math.abs((px - x0) * dy - (py - y0) * dx);
// }

// move line anchor toward a point along the perpendicular so the line passes closer
function snapLineThroughPoint(p, anchor, theta, point, strength = 0.6) {
  const dx = Math.cos(theta), dy = Math.sin(theta);

  // signed perpendicular distance (positive/negative sides)
  const signed = ((point.x - anchor.x) * dy - (point.y - anchor.y) * dx);

  // perpendicular unit vector (rotated direction)
  const px = -dy, py = dx;

  // shift anchor perpendicular
  const shiftX = px * signed * strength;
  const shiftY = py * signed * strength;

  return anchor.copy().add(p.createVector(shiftX, shiftY));
}

// corridors
function buildCorridorsFromPods(pods, k = 2) {
  const segments = [];
  const seen = new Set();

  for (let i = 0; i < pods.length; i++) {
    const a = pods[i];

    // sort other pods by distance
    const others = pods
      .map((b, j) => ({ b, j, d2: (a.pos.x - b.pos.x) ** 2 + (a.pos.y - b.pos.y) ** 2 }))
      .filter(o => o.j !== i)
      .sort((u, v) => u.d2 - v.d2)
      .slice(0, k);

    for (const o of others) {
      const j = o.j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);

      segments.push({
        a: a.pos.copy(),
        b: o.b.pos.copy(),
        // corridor “identity” (for subtle animation)
        phase: Math.random() * 10,
      });
    }
  }

  return segments;
}

new p5((p) => {
  let podForecasts = [];
  let pods = [];
  let agents = [];
  let projector = null;
  let field = null;

  const NUM_PODS = 15;
  const NUM_AGENTS = 4;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    init(); // async init (no await in setup)
  };

  p.draw = () => {
    const t = p.millis() / 1000;
    p.background(210, 8, 97);

    if (!field) {
      p.fill(255);
      p.noStroke();
      p.textSize(16);
      p.text("Loading model + forecasts…", 20, 30);
      return;
    }

    field.drawBackground(p, t, 14);
    field.drawStreetBands(p, t);  
    field.drawCorridors(p, t);   

    for (const pod of pods) {
      pod.update(p.deltaTime / 1000, t);
      pod.draw(t);
    }

    for (const a of agents) {
      a.update(p, field, p.deltaTime / 1000, t);
      a.draw(p);
    }
  };

  function buildVizFromForecasts(forecasts) {
    const bounds = computeBounds(forecasts);
    projector = new GeoProjector(bounds, 70);

    pods = forecasts
    .filter(f => typeof f.lat === "number" && typeof f.lon === "number")
    .map((f) => {
      const pos = projector.project(p, f.lat, f.lon, p.width, p.height);
      return new Pod({
        p,
        id: f.id,
        pos,
        comfort: f.comfort_score,
        predictedOcc: f.predicted_occupancy_60m,
        label: f.comfort_label
      });
    });
    //const streetBands = buildStreetBandsFromPods(p, pods, { seed: 42, numTrunks: 4, width: 22 });
    const streetBands = buildStreetBandsFromPods(p, pods, {
      seed: 42,
      numLines: 6,
      width: 22,
      minStations: 3,   // IMPORTANT
      maxStations: 6,   // IMPORTANT
      stationDist: 32,  // a bit more forgiving
    });
   
    const corridors = buildCorridorsFromPods(pods, 2);
    field = new ComfortField(pods, corridors, streetBands);

    agents = [];
    for (let i = 0; i < NUM_AGENTS; i++) {
      agents.push(new BikeAgent(p.createVector(p.random(p.width), p.random(p.height))));
    }
  }

  function computeBounds(forecasts) {
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;

    for (const f of forecasts) {
      if (typeof f.lat !== "number" || typeof f.lon !== "number") continue;
      minLat = Math.min(minLat, f.lat);
      maxLat = Math.max(maxLat, f.lat);
      minLon = Math.min(minLon, f.lon);
      maxLon = Math.max(maxLon, f.lon);
    }

    const padLat = (maxLat - minLat) * 0.08 || 0.01;
    const padLon = (maxLon - minLon) * 0.08 || 0.01;

    return {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLon: minLon - padLon,
      maxLon: maxLon + padLon
    };
  }

  async function init() {
    await loadAllDataFromJson();
    await loadOccupancyModel();

    const podKeys = Array.from({ length: NUM_PODS }, (_, i) => `pod_${String(i + 1).padStart(2, "0")}`);
    podForecasts = await forecastAllPods(podKeys);

    buildVizFromForecasts(podForecasts);
  }
});