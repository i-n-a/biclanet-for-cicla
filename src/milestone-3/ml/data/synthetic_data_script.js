// Synthetic dataset generator for occupancy prediction (ml5.js NeuralNetwork regression)
//
// Inputs:
//  - pod_id (1–15)
//  - hour (0–23)
//  - day_of_week (0–6)   // 0=Sunday ... 6=Saturday
//  - is_weekend (0/1)
//  - occupancy_now (0–1)
//  - occupancy_60m_ago (0–1)
//  - bookings_next_60m (0–1)
//  - precipitation_mm (0–10)   // skew low
//  - apparent_temperature_c (10–35) // comfort curve
//  - wind_speed_kmh (0–30)     // skew low
//  - is_day (0/1)
//
// Output:
//  - predicted_occupancy_60m (0–1)

// Patterns in the data to simulate:
//     - Rush hours (weekday 8–10 and 17–19) increase demand
//     - Weekend demand shifts toward midday leisure usage
//     - Short-term momentum: if occupancy is rising, next hour tends to be higher
//     - Bookings pressure pushes occupancy upward
//     - Bad weather (precipitation + strong wind) reduces demand
//     - Night reduces demand
//     - Pod-specific baselines create stable location differences
//     - Apparent temperature follows a comfort curve (extremes reduce demand)
//     - Nighttime conditions reduce overall usage
//     - Controlled noise (randomisation) introduces realistic variability 

// What is apparant temperature?
// Apparent temperature is the perceived feels-like temperature combining wind chill factor, relative humidity and solar radiation
// reference: https://open-meteo.com/en/docs?

const clamp01 = (x) => Math.max(0, Math.min(1, x));

function tempComfortFromC(tempC) {
  // Peak comfort ~22°C, tolerance ~6°C
  const peak = 22;
  const spread = 6;
  const x = (tempC - peak) / spread;
  return Math.exp(-(x * x)); // 0..1
}

/**
 * Time demand curve (0..1)
 */
function timeDemand(hour, dayOfWeek) {
  const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
  let d = 0;

  if (!isWeekend) {
    d += Math.exp(-Math.pow((hour - 9) / 1.6, 2)) * 0.9;   // morning peak
    d += Math.exp(-Math.pow((hour - 18) / 1.8, 2)) * 0.8;  // evening peak
    d += Math.exp(-Math.pow((hour - 13) / 2.2, 2)) * 0.25; // lunch bump
  } else {
    d += Math.exp(-Math.pow((hour - 14) / 2.6, 2)) * 0.5;  // weekend midday
  }

  return clamp01(d);
}

/**
 * Generate ONE example
 */
function generateExample(numPods = 15) {
  // pod_id: 1..15 (human-friendly)
  const pod_id = Math.floor(Math.random() * numPods) + 1;
  const pod_id_index = (pod_id - 1) / (numPods - 1); // 0..1 for smooth baseline math

  const day_of_week = Math.floor(Math.random() * 7); // 0..6
  const is_weekend = (day_of_week === 0 || day_of_week === 6) ? 1 : 0;

  const hour = Math.floor(Math.random() * 24);
  const is_day = (hour >= 7 && hour <= 19) ? 1 : 0;

  // Weather (real-ish units, bounded)
  // Precip: 0..10 mm/h (skew low)
  const precipitation_mm = Math.min((Math.random() ** 1.8) * 10, 10);

  // Wind: 0..30 km/h (skew low)
  const wind_speed_kmh = Math.min((Math.random() ** 1.4) * 30, 30);
  // reference: https://www.theweathernetwork.com/en/news/weather/forecasts/wind-speed-cheat-sheet-how-to-gauge-wind-speed-damaging-gusts-hurricane-force

  // Apparent temperature: 10..35 °C
  const apparent_temperature_c = 10 + Math.random() * 25;

  const baseDemand = timeDemand(hour, day_of_week);

  // Weather penalty for bookings (people avoid booking in bad conditions)
  const weatherPenalty = clamp01(
    (precipitation_mm / 10) * 0.7 +
    (wind_speed_kmh / 30) * 0.3
  );

  // Bookings pressure rises with demand, reduced by bad weather
  const bookings_next_60m = clamp01(
    baseDemand * 0.65 * (1 - 0.55 * weatherPenalty) + (Math.random() * 0.18)
  );

  // Pod baseline differences (simulate location attractiveness)
  // Smooth bump so some pods are naturally busier
  const podBaseline =
    0.18 + 0.22 * Math.sin(pod_id_index * Math.PI); // ~0.18..0.40

  // Temperature comfort
  const tempComfort = tempComfortFromC(apparent_temperature_c);
  const tempFriction = (1 - tempComfort);

  // Weather friction on usage
  const weatherFriction = clamp01(
    (precipitation_mm / 10) * 0.45 +
    (wind_speed_kmh / 30) * 0.25 +
    tempFriction * 0.20 +
    ((1 - is_day) * 0.10)
  );

  // Occupancy 60m ago (driven by baseline + demand - friction + small noise)
  const occupancy_60m_ago = clamp01(
    podBaseline + baseDemand * 0.60 - weatherFriction + (Math.random() * 0.14 - 0.05)
  );

  // Occupancy now: add bookings + small momentum
  const momentum = (Math.random() * 0.16 - 0.05);
  const occupancy_now = clamp01(
    occupancy_60m_ago + baseDemand * 0.08 + bookings_next_60m * 0.18 + momentum
  );

  // Target prediction: occupancy in 60 minutes
  const trend = occupancy_now - occupancy_60m_ago;
  const futureDemand = timeDemand((hour + 1) % 24, day_of_week);

  let predicted = occupancy_now;
  predicted += futureDemand * 0.16;
  predicted += bookings_next_60m * 0.26;
  predicted += trend * 0.34;
  predicted -= weatherFriction * 0.25;

  // Controlled noise (±3%)
  predicted += (Math.random() * 0.06 - 0.03);

  const predicted_occupancy_60m = clamp01(predicted);

  return {
    input: {
      pod_id,                 // 1..15
      hour,                   // 0..23
      day_of_week,            // 0..6
      is_weekend,             // 0/1
      occupancy_now,          // 0..1
      occupancy_60m_ago,      // 0..1
      bookings_next_60m,      // 0..1
      precipitation_mm,       // 0..10
      apparent_temperature_c, // 10..35
      wind_speed_kmh,         // 0..30
      is_day                  // 0/1
    },
    output: {
      predicted_occupancy_60m // 0..1
    }
  };
}

function generateDataset(n = 1500, numPods = 15) {
  const data = [];
  for (let i = 0; i < n; i++) data.push(generateExample(numPods));
  return data;
}

// ---- UI helpers: download dataset ----
function downloadJSON(data, filename = "synthetic_occupancy_dataset.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

// ---- Demo + buttons ----
const DATASET_SIZE = 2000;

function init() {

  // Show example row in console
  const example = generateExample();
  console.log("Example row:\n" + JSON.stringify(example, null, 2));

  const btn = document.createElement("button");
  btn.textContent = `Download JSON (${DATASET_SIZE} rows)`;
  btn.style.padding = "10px 14px";
  btn.style.marginTop = "12px";
  btn.onclick = () => {
    const ds = generateDataset(DATASET_SIZE, 15);
    downloadJSON(ds);
    console.log(`\nGenerated + downloaded dataset: ${DATASET_SIZE} rows`);
  };

  document.body.appendChild(btn);
}

init();
