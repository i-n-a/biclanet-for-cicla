import { toMlInput } from "./ml/ml_data_preprocessor.js";
import { applyBookingsToRTDB } from "./data/apply_bookings_to_rtdb.js";

// script.js (DATA LAYER)
// - Loads JSON (or later Firebase + OpenMeteo)
// - Loads ML model
// - Preprocesses inputs for ML
// - Predicts occupancy
// - Computes comfort score

// -------------------- state --------------------
let nn = null;
let modelReady = false;

let cache = {
firestoreBookings: [],
realtime: null,
pods: null,
weather: null
};

// -------------------- time helpers --------------------
export const sToMs = (s) => s * 1000;
export const msToS = (ms) => Math.floor(ms / 1000);

// -------------------- utils --------------------
async function loadJson(filePath) {
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`Failed to load ${filePath}: ${res.statusText}`);
    return await res.json();
}

function coerceBookings(firestoreJson) {
    // Your firebase_firestore.json is an array already.
    if (Array.isArray(firestoreJson)) return firestoreJson;

    // If you later export as { bookings: [...] }
    if (firestoreJson && Array.isArray(firestoreJson.bookings)) return firestoreJson.bookings;

    // fallback
    return [];
}

// -------------------- weather mapping --------------------
export function mapOpenMeteoCurrent(openMeteoResponse) {
const c = openMeteoResponse.current;
return {
    provider: "open-meteo",
    location: "Lisbon",
    generated_at_unix_s: c.time,
    current: {
        time_s: c.time, // keep in seconds (clearer)
        apparent_temperature_c: c.apparent_temperature,
        precipitation_mm: c.precipitation,
        wind_speed_kmh: c.wind_speed_10m,
        relative_humidity_pct: c.relative_humidity_2m,
        is_day: c.is_day
    }
};
}

export async function fetchWeatherData(latitude, longitude) {
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=apparent_temperature,is_day,precipitation,wind_speed_10m,relative_humidity_2m` +
        `&forecast_days=1&timeformat=unixtime`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather fetch failed: ${response.statusText}`);
    return await response.json();
}

// -------------------- ML model loading --------------------
export async function loadOccupancyModel() {
    // avoid WebGPU init errors
    await ml5.tf.setBackend("webgl");
    await ml5.tf.ready();

    nn = ml5.neuralNetwork({ task: "regression" });

    return new Promise((resolve, reject) => {
        nn.load(
            {
                model: "ml/occupancy_model/model.json",
                metadata: "ml/occupancy_model/model_meta.json",
                weights: "ml/occupancy_model/model.weights.bin"
            },
            () => {
                modelReady = true;
                console.log("✅ ML model loaded");
                resolve();
            },
            (err) => reject(err)
        );
    });
}

// IMPORTANT: no nn.normalizeData() here.
// normalizeData() is for training only.

export async function predictOccupancy(mlInput) {
    if (!modelReady || !nn) throw new Error("Model not loaded yet");
    const result = await nn.predict(mlInput);
    return result[0].predicted_occupancy_60m; // 0..1
}

// -------------------- comfort mapping --------------------
export function comfortScore({ predictedOcc, humidityPct, precipitationMm, windKmh, isDay }) {
    const occPenalty = predictedOcc; // 0..1
    const rainPenalty = Math.min(1, precipitationMm / 5);
    const windPenalty = Math.min(1, windKmh / 30);
    const humidityPenalty = Math.min(1, humidityPct / 100);

    let score = 1;
    score -= occPenalty * 0.45;
    score -= rainPenalty * 0.25;
    score -= windPenalty * 0.15;
    score -= humidityPenalty * 0.10;
    if (!isDay) score -= 0.05;

    return Math.max(0, Math.min(1, score));
}

export function comfortLabel(score01) {
    if (score01 < 0.35) return "lower";
    if (score01 < 0.7) return "medium";
    return "higher";
}

// -------------------- data loading (JSON mode) --------------------
// export async function loadAllDataFromJson() {
//     const firestoreJson = await loadJson("data/firebase_firestore_bookings.json");
//     const realtimeJson = await loadJson("data/firebase_realtime.json");
//     const podsJson = await loadJson("data/pods.json");
//     const weatherJson = await loadJson("data/weather_data.json");

//     cache.firestoreBookings = coerceBookings(firestoreJson);

//     cache.realtime = realtimeJson;
//     cache.pods = podsJson;

//     // Your weather_data.json is an array in your example
//     // Keep as-is, but store a convenient "current"
//     cache.weather = Array.isArray(weatherJson) ? weatherJson[0] : weatherJson;

//     return structuredClone(cache);
// }

export async function loadAllDataFromJson() {
  const firestoreJson = await loadJson("data/firebase_firestore_bookings.json");
  const realtimeJson  = await loadJson("data/firebase_realtime.json");
  const podsJson      = await loadJson("data/pods.json");
  const weatherJson   = await loadJson("data/weather_data.json");

  cache.firestoreBookings = coerceBookings(firestoreJson);

  // ✅ apply bookings into realtime (Option B)
  const nowMs = Date.now();
  cache.realtime = applyBookingsToRTDB({
    rtdb: realtimeJson,
    bookings: cache.firestoreBookings,
    nowMs,
    windowMinutes: 60,
    clampClosedForReserved: true
  });

  cache.pods = podsJson;
  cache.podsById = Object.fromEntries(
    (podsJson.pods || []).map(p => [p.pod_id, p])
 );

  cache.weather = Array.isArray(weatherJson) ? weatherJson[0] : weatherJson;

    // --- DEBUG: show RTDB after applying bookings ---
    //   console.log(
    //     "🔄 RTDB after applying bookings:",
    //     structuredClone(cache.realtime) 
    //     );

    // --- DEBUG: show pod_01 before/after booking merge ---
    //   console.log(
    //     "🅿️ pod_01 after booking merge:",
    //     cache.realtime.network.pods.pod_01
    //  );

    // --- DEBUG: show before/after bookings next 60m for a pod ---
    // const realtimeRaw = await loadJson("data/firebase_realtime.json");

    // const updated = applyBookingsToRTDB({
    // rtdb: realtimeRaw,
    // bookings: cache.firestoreBookings,
    // nowMs: Date.now(),
    // windowMinutes: 60
    // });

    // console.log("BEFORE:", realtimeRaw.network.pods.pod_09);
    // console.log("AFTER:", updated.network.pods.pod_09);


  return structuredClone(cache);
}


// -------------------- building inputs + running the pipeline --------------------
export function buildMlInputForPod(podKey, nowMs = Date.now()) {
    if (!cache.realtime) throw new Error("Realtime data not loaded");
    if (!cache.weather) throw new Error("Weather data not loaded");

    const podState = cache.realtime.network?.pods?.[podKey];
    if (!podState) throw new Error(`Pod state missing for ${podKey}`);

    const weatherCurrent = cache.weather.current;

    // NOTE: toMlInput expects bookings with fields: pod_id, start_ts, end_ts (ms)
    return toMlInput({
        podKey,
        podState,
        bookings: cache.firestoreBookings,
        weatherCurrent,
        nowMs,
        occupancy60mAgo: null
    });
}

export async function forecastPod(podKey, nowMs = Date.now()) {
    const mlInput = buildMlInputForPod(podKey, nowMs);
    const predicted = await predictOccupancy(mlInput);

    const w = cache.weather.current;
    const score = comfortScore({
        predictedOcc: predicted,
        humidityPct: w.relative_humidity_pct ?? 50,
        precipitationMm: w.precipitation_mm ?? 0,
        windKmh: w.wind_speed_kmh ?? 0,
        isDay: w.is_day ?? 1
    });

    const podInfo = cache.podsById?.[podKey] || {}; // ✅ lookup by id

    return {
        id: podKey,
        lat: podInfo.lat ?? null,
        lon: podInfo.lon ?? null,
        //mlInput,
        predicted_occupancy_60m: predicted,
        comfort_score: score,
        comfort_label: comfortLabel(score)
    };
}

export async function forecastAllPods(podKeys, nowMs = Date.now()) {
    const results = [];
    for (const key of podKeys) {
        results.push(await forecastPod(key, nowMs));
    }
    console.log("All pod forecasts computed.");
    //console.log(results);
    return results;
}