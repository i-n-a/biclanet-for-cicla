function pad2(n) {
  return String(n).padStart(2, "0");
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// random int inclusive
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// probability helper
function chance(p) {
  return Math.random() < p;
}

// Create one pod with variable occupancy/reservations.
// You can tweak ranges to match "pilot realism".
function makePod(ts = Date.now(), capacity = 12, profile = "mixed") {
  // --- Decide occupancy + reserved counts (bounded + plausible) ---
  // Profiles let you simulate “busier” commuter hubs vs quieter pods
  let occMax, resMax;

  if (profile === "busy") {
    occMax = Math.floor(capacity * 0.90);  // up to 90%
    resMax = Math.floor(capacity * 0.35);  // up to 35%
  } else if (profile === "quiet") {
    occMax = Math.floor(capacity * 0.45);
    resMax = Math.floor(capacity * 0.20);
  } else {
    // mixed
    occMax = Math.floor(capacity * 0.75);
    resMax = Math.floor(capacity * 0.25);
  }

  // choose occupied first
  const occupied_count = randInt(0, occMax);

  // reserved can't exceed remaining slots
  const remainingAfterOcc = capacity - occupied_count;
  const reserved_count = randInt(0, clamp(resMax, 0, remainingAfterOcc));

  const free_count = capacity - occupied_count - reserved_count;

  // --- Build spot states that match those counts ---
  const spots = {};
  const allSpotKeys = Array.from({ length: capacity }, (_, i) => `spot_${pad2(i + 1)}`);

  // shuffle keys so distribution feels random
  for (let i = allSpotKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allSpotKeys[i], allSpotKeys[j]] = [allSpotKeys[j], allSpotKeys[i]];
  }

  const occKeys = allSpotKeys.slice(0, occupied_count);
  const resKeys = allSpotKeys.slice(occupied_count, occupied_count + reserved_count);
  const freeKeys = allSpotKeys.slice(occupied_count + reserved_count);

  // Occupied spots: clamp almost always closed
  for (const k of occKeys) {
    spots[k] = {
      clamp_closed: chance(0.95),
      occupied: true,
      reserved: false,
      updated_at: ts
    };
  }

  // Reserved spots: not occupied, clamp sometimes closed (depends on your design)
  for (const k of resKeys) {
    spots[k] = {
      clamp_closed: chance(0.35),
      occupied: false,
      reserved: true,
      updated_at: ts
    };
  }

  // Free spots: mostly open clamp, rare malfunction “closed”
  for (const k of freeKeys) {
    spots[k] = {
      clamp_closed: chance(0.05),
      occupied: false,
      reserved: false,
      updated_at: ts
    };
  }

  return {
    capacity,
    free_count,
    occupied_count,
    reserved_count,
    last_seen: ts,
    spots
  };
}

// Assign pod “profiles” so not every pod looks identical.
// You can map these to clusters later if you want.
function podProfile(podIndex1based) {
  // Example: make a few pods busier (interfaces) and a few quieter (residential edge)
  const busy = new Set([2, 4, 5, 6, 7]);      // Oriente, Sete Rios, Saldanha, Cais, Santa Apolónia
  const quiet = new Set([14, 15]);            // Olaias, Pontinha

  if (busy.has(podIndex1based)) return "busy";
  if (quiet.has(podIndex1based)) return "quiet";
  return "mixed";
}

function makeRTDB(podCount = 15, spotsPerPod = 12, ts = Date.now()) {
  const pods = {};
  for (let i = 1; i <= podCount; i++) {
    const podKey = `pod_${pad2(i)}`;
    const profile = podProfile(i);
    pods[podKey] = makePod(ts, spotsPerPod, profile);
  }

  return {
    network: {
      meta: {
        network_id: "lisbon_pilot",
        pod_count: podCount,
        spots_per_pod: spotsPerPod,
        updated_at: ts
      },
      pods
    }
  };
}

// Generate:
const rtdb = makeRTDB(15, 12, 1766951510000);
console.log(JSON.stringify(rtdb, null, 2));
