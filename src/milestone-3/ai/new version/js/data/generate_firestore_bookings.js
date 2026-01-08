function pad2(n) {
  return String(n).padStart(2, "0");
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(p) {
  return Math.random() < p;
}

function randomUuidLike() {
  // good enough for mock data
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function makeBooking({ nowMs, podId, spotId, startTs, endTs, status }) {
  const createdAt = nowMs - randInt(1 * 60_000, 24 * 60 * 60_000); // created within last 24h
  const dateTag = new Date(nowMs).toISOString().slice(0, 10).replaceAll("-", "");
  const seq = randInt(1, 999999);

  return {
    booking_id: `BKG_${dateTag}_${String(seq).padStart(6, "0")}`,
    created_at: createdAt,
    pod_id: podId,
    parking_spot_id: spotId,
    user_id: `USR_${Math.random().toString(16).slice(2, 6)}`,
    start_ts: startTs,
    end_ts: endTs,
    booking_status: status,
    qr_token: randomUuidLike()
  };
}

function generateBookings({
  nowMs = Date.now(),
  podCount = 15,
  spotsPerPod = 12,
  totalBookings = 120
}) {
  const bookings = [];

  for (let i = 0; i < totalBookings; i++) {
    const podNum = randInt(1, podCount);
    const podId = `pod_${pad2(podNum)}`;

    const spotNum = randInt(1, spotsPerPod);
    const spotId = `spot_${pad2(spotNum)}`;

    // --- Make start times ---
    // 60% of bookings start within the next 2 hours (to drive bookings_next_60m)
    // 40% are in the past/future for realism
    let startTs;
    if (chance(0.6)) {
      startTs = nowMs + randInt(-30, 120) * 60_000; // -30min .. +120min
    } else {
      startTs = nowMs + randInt(-24 * 60, 24 * 60) * 60_000; // +/- 24h
    }

    // Duration: 20..120 minutes
    const durationMin = randInt(20, 120);
    const endTs = startTs + durationMin * 60_000;

    // Status distribution
    const status = chance(0.9) ? "confirmed" : "cancelled";

    bookings.push(
      makeBooking({
        nowMs,
        podId,
        spotId,
        startTs,
        endTs,
        status
      })
    );
  }

  return bookings;
}

// Example usage:
const bookings = generateBookings({ nowMs: Date.now(), totalBookings: 150 });
console.log(JSON.stringify(bookings, null, 2));