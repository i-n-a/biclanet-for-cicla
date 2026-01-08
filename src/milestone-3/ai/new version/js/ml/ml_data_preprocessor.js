// export function toMlInput({
//   podKey,               // "pod_01" from RTDB
//   podState,             // RTDB pod object
//   bookings,             // array of booking docs
//   weatherCurrent,       // open-meteo current OR your weather JSON selected row
//   nowMs = Date.now(),
//   occupancy60mAgo = null // optional (if you store history)
// }) {
//   // ---- time features ----
//   const d = new Date(nowMs);
//   const hour = d.getHours();                    // 0..23
//   const day_of_week = d.getDay();               // 0..6 (Sun=0)
//   const is_weekend = (day_of_week === 0 || day_of_week === 6) ? 1 : 0;

//   // ---- pod id mapping ----
//   // "pod_01" -> 1, "pod_15" -> 15
//   const pod_id = parseInt(podKey.split("_")[1], 10);

//   // ---- occupancy now ----
//   const capacity = podState.capacity ?? 12;
//   const occupiedCount = podState.occupied_count ?? 0;
//   const occupancy_now = clamp01(occupiedCount / capacity);

//   // ---- occupancy 60m ago ----
//   // If you don’t have history yet, approximate
//   const occupancy_60m_ago = (occupancy60mAgo !== null)
//     ? clamp01(occupancy60mAgo)
//     : clamp01(occupancy_now + (Math.random() * 0.12 - 0.06)); // ±6%

//   // ---- bookings next 60m (normalized) ----
//   const windowStart = nowMs;
//   const windowEnd = nowMs + 60 * 60 * 1000;

//   const upcomingCount = bookings.filter(b => {
//     // booking overlaps the next 60 minutes
//     const start = b.start_ts;
//     const end = b.end_ts;
//     return b.pod_id === podKey && start < windowEnd && end > windowStart;
//   }).length;

//   const bookings_next_60m = clamp01(upcomingCount / capacity);

//   // ---- weather ----
//   // Open-Meteo current fields naming: precipitation, wind_speed_10m, apparent_temperature, is_day
//   const precipitation_mm = weatherCurrent.precipitation_mm ?? weatherCurrent.precipitation ?? 0;
//   const wind_speed_kmh = weatherCurrent.wind_speed_kmh ?? weatherCurrent.wind_speed_10m ?? 0;
//   const apparent_temperature_c = weatherCurrent.apparent_temperature_c ?? weatherCurrent.apparent_temperature ?? 0;
//   const is_day = weatherCurrent.is_day ?? 1;

//   return {
//     pod_id,
//     hour,
//     day_of_week,
//     is_weekend,
//     occupancy_now,
//     occupancy_60m_ago,
//     bookings_next_60m,
//     precipitation_mm,
//     apparent_temperature_c,
//     wind_speed_kmh,
//     is_day
//   };
// }

// function clamp01(x) {
//   return Math.max(0, Math.min(1, x));
// }

export function toMlInput({
  podKey,               // "pod_01"
  podState,             // realtime.network.pods[podKey]
  bookings,             // array of bookings [{...}]
  weatherCurrent,       // weather.current (open-meteo mapped)
  nowMs = Date.now(),
  occupancy60mAgo = 0
}) {
  // ---- time features ----
  const d = new Date(nowMs);
  const hour = d.getHours();              // 0..23
  const day_of_week = d.getDay();         // 0..6 (Sun=0)
  const is_weekend = (day_of_week === 0 || day_of_week === 6) ? 1 : 0;

  // ---- pod id mapping ----
  // "pod_01" -> 1
  const pod_id = parseInt(podKey.split("_")[1], 10); // 1..15

  // ---- occupancy now ----
  const capacity = podState.capacity ?? 12;
  const occupiedCount = podState.occupied_count ?? 0;
  const occupancy_now = clamp01(occupiedCount / capacity);

  // ---- occupancy 60m ago ----
  const occupancy_60m_ago = (occupancy60mAgo !== null)
    ? clamp01(occupancy60mAgo)
    : clamp01(occupancy_now + (Math.random() * 0.12 - 0.06)); // ±6%

  // ---- bookings next 60m (normalized) ----
  const windowStart = nowMs;
  const windowEnd = nowMs + 60 * 60 * 1000;

  // const upcomingCount = bookings.filter(b => {
  //   if (b.pod_id !== podKey) return false;

  //   // booking overlaps the next 60 minutes window
  //   const start = b.start_ts; // ms
  //   const end = b.end_ts;     // ms
  //   return start < windowEnd && end > windowStart;
  // }).length;

  const upcomingCount = bookings.filter(b => {
    const start = b.start_ts;
    const end = b.end_ts;
    return b.pod_id === podKey && start < windowEnd && end > windowStart;
  }).length;

  const bookings_next_60m = clamp01(upcomingCount / capacity);

  // ---- weather (accept either naming) ----
  const precipitation_mm =
    weatherCurrent.precipitation_mm ?? weatherCurrent.precipitation ?? 0;

  const wind_speed_kmh =
    weatherCurrent.wind_speed_kmh ?? weatherCurrent.wind_speed_10m ?? 0;

  const apparent_temperature_c =
    weatherCurrent.apparent_temperature_c ?? weatherCurrent.apparent_temperature ?? 0;

  const is_day = weatherCurrent.is_day ?? 1;

  return {
    pod_id,
    hour,
    day_of_week,
    is_weekend,
    occupancy_now,
    occupancy_60m_ago,
    bookings_next_60m,
    precipitation_mm,
    apparent_temperature_c,
    wind_speed_kmh,
    is_day
  };
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
