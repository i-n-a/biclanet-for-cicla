console.log("Dashboard JS loaded.");

// Demo pod list for the table (you can tweak names/locations)
const pods = [
  {
    id: "POD-GCT-001A",
    lastSync: "12s ago",
    location: "IADE",
    status: "online",
    occupancy: "11 / 12"
  },
  {
    id: "POD-SHO-004C",
    lastSync: "4m ago",
    location: "Marvila",
    status: "offline",
    occupancy: "-- / 12"
  },
  {
    id: "POD-BKT-008A",
    lastSync: "55s ago",
    location: "Moscavide",
    status: "maintenance",
    occupancy: "0 / 12"
  }
];

async function initDashboard() {
  renderPods(); // fill table + static stats

  const [predictions, optimizations] = await Promise.all([
    fetch("predictions.json").then((res) => res.json()),
    fetch("ai_optimizations.json").then((res) => res.json())
  ]);

    renderPredictedUsage(predictions);
  renderAICards(optimizations);
  startAIActivity(predictions);

}

function renderPods() {
  const tbody = document.getElementById("podTableBody");
  tbody.innerHTML = "";

  pods.forEach((pod) => {
    const tr = document.createElement("tr");

    const statusClass =
      pod.status === "online"
        ? "pod-status-online"
        : pod.status === "offline"
        ? "pod-status-offline"
        : "pod-status-maintenance";

    tr.innerHTML = `
      <td>${pod.id}</td>
      <td>${pod.lastSync}</td>
      <td>${pod.location}</td>
      <td><span class="pod-status-pill ${statusClass}">
          ${capitalize(pod.status)}
      </span></td>
      <td>${pod.occupancy}</td>
      <td><a class="pod-link" href="pod.html?podId=${encodeURIComponent(pod.id)}">View Pod</a></td>
    `;

    tbody.appendChild(tr);
  });

  // Demo top stats – you can later tie these to data if you want
  document.getElementById("totalPods").textContent = "2,184";
  document.getElementById("activeOffline").textContent = "2,150 / 34";
}

function renderPredictedUsage(predictions) {
  if (!predictions.length) return;

  const avg =
    predictions.reduce((sum, p) => sum + p.occupancy_rate, 0) /
    predictions.length;
  const percent = Math.round(avg * 100);

  const label = document.getElementById("predictedUsage");
  const fill = document.getElementById("predictedUsageFill");
  label.textContent = percent;
  fill.style.width = `${percent}%`;
    // Update p5 visualization speed based on predicted usage
  if (window.setActivityLevel) {
    window.setActivityLevel(avg); // 0–1
  }


  const container = document.getElementById("usageForecastBars");
  container.innerHTML = "";

  predictions.forEach((p) => {
    const bar = document.createElement("div");
    bar.className = "usage-bar";
    const height = 10 + p.occupancy_rate * 40; // 10–50px
    bar.style.height = `${height}px`;
    container.appendChild(bar);
  });
}

function renderAICards(optimizations) {
  const container = document.getElementById("aiCards");
  container.innerHTML = "";

  optimizations.forEach((opt) => {
    const card = document.createElement("div");
    card.className = "ai-card";
    card.innerHTML = `
      <div class="ai-card-title">${opt.title}</div>
      <div class="ai-card-desc">${opt.description}</div>
      <div class="ai-card-impact">Impact: ${opt.impact}</div>
    `;
    container.appendChild(card);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function startAIActivity(predictions) {
  const list = document.getElementById("aiActivityList");
  if (!list || !predictions.length) return;

  // Build a few messages based on the prediction data
  const sample = predictions.slice(0, 3);
  const events = sample.map((p) => {
    const pct = Math.round(p.occupancy_rate * 100);
    return `Updated forecast for ${p.pod_id} · ${pct}% expected occupancy`;
  });

  events.push(
    "Recomputing comfort scores for IADE cluster…",
    "Checking anomaly risk for night-time voltage drops…"
  );

  let index = 0;

  function addNext() {
    const li = document.createElement("li");
    li.className = "ai-activity-item";
    li.textContent = events[index];

    // Newest at the top
    list.prepend(li);

    // Keep only the 4 most recent
    if (list.children.length > 4) {
      list.removeChild(list.lastChild);
    }

    index = (index + 1) % events.length;
  }

  addNext();
  setInterval(addNext, 2500); // Every 2.5 seconds
}

initDashboard().catch((err) => console.error(err));
