function pad2(n) {
  return String(n).padStart(2, "0");
}

function overlapsWindow(start, end, windowStart, windowEnd) {
  return start < windowEnd && end > windowStart;
}

function deepClone(obj) {
  return structuredClone ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

/**
 * Option B:
 * Apply Firestore bookings into RTDB as "reserved" for the next 60 minutes.
 *
 * Assumptions:
 * - rtdb.network.pods[podKey].spots[spotKey] exists
 * - bookings contain: pod_id, parking_spot_id, start_ts, end_ts, booking_status
 *
 * Adds (if missing):
 * - spots[spotKey].reserved (boolean)
 *
 * Updates:
 * - pod.reserved_count
 * - pod.free_count
 * - (optional) pod.occupied_count stays as-is (or you can recompute)
 */
export function applyBookingsToRTDB({
  rtdb,
  bookings,
  nowMs = Date.now(),
  windowMinutes = 60,
  clampClosedForReserved = true,
  ignoreCancelled = true
}) {
  const out = deepClone(rtdb);

  const windowStart = nowMs;
  const windowEnd = nowMs + windowMinutes * 60 * 1000;

  const pods = out?.network?.pods;
  if (!pods) throw new Error("RTDB missing path: network.pods");

  // 1) Clear old reserved flags (keep occupied as-is)
  for (const podKey of Object.keys(pods)) {
    const pod = pods[podKey];
    if (!pod?.spots) continue;

    for (const spotKey of Object.keys(pod.spots)) {
      if (pod.spots[spotKey].reserved === undefined) pod.spots[spotKey].reserved = false;
      pod.spots[spotKey].reserved = false;

      // don't force clamp open if you want to keep other logic;
      // but for clean demo, you can reset clamp unless occupied
      if (clampClosedForReserved && pod.spots[spotKey].occupied !== true) {
        pod.spots[spotKey].clamp_closed = false;
      }
    }

    pod.reserved_count = 0; // will recalc
    // free_count will be recalc after we apply
  }

  // 2) Filter bookings that overlap the next window
  const activeBookings = bookings.filter((b) => {
    if (ignoreCancelled && b.booking_status && b.booking_status !== "confirmed") return false;
    return overlapsWindow(b.start_ts, b.end_ts, windowStart, windowEnd);
  });

  // 3) Apply reservations pod by pod
  for (const b of activeBookings) {
    const podKey = b.pod_id; // e.g. "pod_01"
    const pod = pods[podKey];
    if (!pod || !pod.spots) continue;

    const capacity = pod.capacity ?? 12;

    // booking spot is preferred, otherwise pick first free spot
    let spotKey = b.parking_spot_id;

    if (!spotKey || !pod.spots[spotKey]) {
      // find first spot that is not occupied and not already reserved
      spotKey = Object.keys(pod.spots).find((k) => {
        const s = pod.spots[k];
        return s.occupied !== true && s.reserved !== true;
      });
      if (!spotKey) continue; // pod is full in demo terms
    }

    const spot = pod.spots[spotKey];
    // Don't reserve an occupied spot (unless you want weird overlaps)
    if (spot.occupied === true) continue;

    // Set reservation
    spot.reserved = true;
    spot.updated_at = nowMs;

    if (clampClosedForReserved) {
      spot.clamp_closed = true;
    }

    // (We will recalc reserved_count after loop, but incrementing is fine too)
    // pod.reserved_count = (pod.reserved_count ?? 0) + 1;
  }

  // 4) Recompute reserved_count and free_count per pod (ensures consistency)
  for (const podKey of Object.keys(pods)) {
    const pod = pods[podKey];
    const capacity = pod.capacity ?? 12;

    let occupied = 0;
    let reserved = 0;

    for (const spotKey of Object.keys(pod.spots || {})) {
      const s = pod.spots[spotKey];
      if (s.occupied === true) occupied++;
      else if (s.reserved === true) reserved++;
    }

    pod.occupied_count = occupied;
    pod.reserved_count = reserved;
    pod.free_count = Math.max(0, capacity - occupied - reserved);
    pod.last_seen = nowMs;
  }

  return out;
}