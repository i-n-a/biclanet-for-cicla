console.log("App JS loaded.");

function setupBottomSheet() {
  const card = document.querySelector(".app-bottom-card");
  if (!card) {
    console.warn("Bottom sheet card not found.");
    return;
  }

  const handle = card.querySelector(".app-handle");
  const aiCard = card.querySelector(".app-ai-forecast-card");

  const toggle = () => {
    card.classList.toggle("app-expanded");
  };

  if (handle) handle.addEventListener("click", toggle);
  if (aiCard) aiCard.addEventListener("click", toggle);
}

async function initApp() {
  setupBottomSheet();

  try {
    const [predictions, weather] = await Promise.all([
      fetch("predictions.json").then((res) => res.json()),
      fetch("weather.json").then((res) => res.json()),
    ]);

    const podId = "POD-GCT-001A";

    const podPreds = (predictions || []).filter(
      (p) => p.pod_id === podId
    );
    const iaWeather = (weather || []).filter(
      (w) => w.location === "IADE"
    );

    updateAvailability(podPreds);
    updateAIForecast(podPreds, iaWeather);
  } catch (err) {
    console.error("Error loading app data:", err);
  }
}

function updateAvailability(podPreds) {
  const pillsContainer = document.getElementById("availabilityPills");
  const text = document.getElementById("availabilitySpots");

  if (!pillsContainer || !text) {
    console.warn("Availability elements not found.");
    return;
  }

  if (!podPreds || !podPreds.length) {
    console.warn("No predictions for this pod.");
    return;
  }

  const latest = podPreds[podPreds.length - 1];
  const occupancyRate = latest.occupancy_rate; // 0–1

  const totalSpots = 16;
  const occupied = Math.round(occupancyRate * totalSpots);
  const free = totalSpots - occupied;

  // Build pill row
  pillsContainer.innerHTML = "";
  for (let i = 0; i < totalSpots; i++) {
    const pill = document.createElement("div");
    pill.className = "app-availability-pill";
    if (i < occupied) {
      pill.classList.add("occupied");
    }
    pillsContainer.appendChild(pill);
  }

  text.textContent = `${free} / ${totalSpots}`;
}

function updateAIForecast(podPreds, weather) {
  if (!podPreds || !podPreds.length || !weather || !weather.length) {
    console.warn("No data to compute AI forecast.");
    return;
  }

  // Average occupancy from predictions
  const avgOcc =
    podPreds.reduce((sum, p) => sum + p.occupancy_rate, 0) /
    podPreds.length;

  // Use earliest + latest weather entries
  const currentW = weather[0];
  const nextW = weather[weather.length - 1];

  const humidityNow = currentW.humidity;
  const humidityLater = nextW.humidity;
  const humidityDelta = Math.round((humidityNow - humidityLater) * 100);

  // Comfort score: lower occupancy + lower humidity = more comfort
  const comfortScore =
    (1 - avgOcc) * 0.6 + (1 - humidityNow) * 0.4;

  let comfortLabel;
  let message;

  if (comfortScore >= 0.7) {
    comfortLabel = "Very high comfort";
    message = `Very high comfort expected for the next hour. Plenty of free spots and pleasant conditions around ${currentW.temperature_c}ºC.`;
  } else if (comfortScore >= 0.5) {
    comfortLabel = "High comfort";
    if (humidityDelta > 0) {
      message = `High comfort expected for the next hour. Humidity is dropping by about ${humidityDelta}% and availability should remain good.`;
    } else {
      message = `High comfort expected for the next hour. Stable conditions and good chance to find a spot without stress.`;
    }
  } else {
    comfortLabel = "Lower comfort";
    message = `Lower comfort expected: pod may be busier and humidity a bit higher. Consider reserving in advance or checking another pod nearby.`;
  }

  const comfortTag = document.getElementById("comfortTag");
  const forecastText = document.getElementById("aiForecastText");
  const occValue = document.getElementById("aiOccupancyValue");
  const humTrend = document.getElementById("aiHumidityTrend");

  if (!comfortTag || !forecastText || !occValue || !humTrend) {
    console.warn("AI forecast UI elements missing.");
    return;
  }

  comfortTag.textContent = comfortLabel;

  if (comfortScore >= 0.7) {
    comfortTag.style.backgroundColor = "#dcfce7";
    comfortTag.style.color = "#166534";
  } else if (comfortScore >= 0.5) {
    comfortTag.style.backgroundColor = "#fef9c3";
    comfortTag.style.color = "#854d0e";
  } else {
    comfortTag.style.backgroundColor = "#fee2e2";
    comfortTag.style.color = "#b91c1c";
  }

  forecastText.textContent = message;
  occValue.textContent = `${Math.round(avgOcc * 100)}%`;

  humTrend.textContent =
    humidityDelta > 0
      ? `−${humidityDelta}% next hour`
      : humidityDelta < 0
      ? `+${Math.abs(humidityDelta)}% next hour`
      : "Stable";
}

initApp();
