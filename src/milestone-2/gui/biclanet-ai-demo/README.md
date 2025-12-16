# 🚲 BiclaNet – AI-Assisted Dashboard Demo (Milestone 2)
*IADE – Creative Computing & Artificial Intelligence (2025)*

This repo contains a **frontend-only AI dashboard demo** that shows how our group integrates:

- ✅ **ML predictions** (simulated data)
- ✅ **AI insights & recommendations**
- ✅ **Creative visualizations (p5.js)**

into the **BiclaNet** operator dashboard for **Milestone 2**.

---

## 🎯 Project Goal (Milestone 2)

Milestone 2 asks us to:

- Build a **small ML model** on simulated or collected data  
- Show how this model **interacts with our system**  
- Implement **AI logic** that generates meaningful insights  
- Use **creative coding** to visualize those insights

This demo does exactly that by:

1. Loading **predicted occupancy data** from `predictions.json`
2. Computing **Predicted Usage (24h)** and a **mini forecast**
3. Displaying **AI Optimization** suggestions from `ai_optimizations.json`
4. Driving a **p5.js “Live System Activity” visualization** from ML outputs
5. Showing a **Live AI Activity log** that simulates ongoing inference work

All of this runs **locally in the browser** with no backend.

---

## 🧩 Overview of the Demo

### What you see on the dashboard

- **Top cards**
  - Total pods
  - Active / Offline counts
  - Firebase & API status (simulated)
  - **Predicted Usage (24h)** — driven by ML predictions

- **Live System Activity (real-time)**
  - A glowing band animated with **p5.js**
  - Motion speed and amplitude are controlled by **predicted occupancy**

- **Live Pod Status table**
  - Sample pods with:
    - Last sync time
    - Location
    - Status (online / offline / maintenance)
    - Occupancy

- **AI Optimizations panel**
  - Loaded from `ai_optimizations.json`
  - Shows AI-generated recommendations and expected impact

- **Live AI Activity**
  - Text log where new “AI events” animate in every few seconds
  - Simulates ongoing inference tasks in the background

---

## 📁 Folder Structure

```bash
biclanet-ai-demo
│
├── index.html               # Main AI dashboard
├── style.css                # Dashboard styling
├── dashboard.js             # ML + AI logic and DOM rendering
├── system-activity.js       # p5.js "Live System Activity" visualization
│
├── predictions.json         # Simulated ML predictions (pod occupancy)
├── ai_optimizations.json    # Simulated AI recommendations
│
└── app.html                 # Placeholder for Rider App AI screen (future work)
```

________________________________________


---

## 🧭 Rider App – AI Comfort Forecast (Map Screen)

This second screen is a **simulated Rider App** view that shows how the same AI layer can surface as a comfort forecast for everyday cyclists.

### What the demo shows

- **Map background with AI “comfort flows”**
  - The map uses a **p5.js sketch** running inside the phone frame.
  - A *generative agent* builds a comfort map based on:
    - virtual **bike corridors**
    - **eco-pod stations**
    - a simple **weather mode** (sun / rain / heat)
  - *Reactive cyclist agents* move through the map by sampling local comfort and following the “best” direction.
  - The animated, soft blue bands in the background represent these comfort flows and make the map feel **alive**, without distracting from the UI.

- **Selected pod – “Routes Pod – IADE”**
  - Pod card shows:
    - **Travel time + distance**
    - **Availability** (16 spots total)
    - A discrete **pill bar** that visualizes live occupancy.
  - Availability pills are driven by the same **prediction JSON** used on the dashboard:
    - `occupancy_rate` → mapped to `16` total spots
    - dark pills = occupied, light pills = free.

- **AI Forecast card**
  - A dedicated **AI Forecast** card summarizes model output into a human-friendly message:
    - “High / Lower comfort” tag
    - Short text explaining expected conditions for the next hour
    - Two key metrics:
      - **Predicted occupancy (%)**
      - **Humidity trend** over the next hour
  - Under the hood, the forecast combines:
    - average `occupancy_rate` for this pod
    - current + future humidity from `weather.json`
    - a simple comfort score:  
      `comfort = (1 - occupancy) * 0.6 + (1 - humidity) * 0.4`

- **Interactive bottom sheet**
  - The pod card behaves like a **bottom sheet**:
    - Tap the handle or AI Forecast card → sheet slides **up** to show details.
    - Tap again → sheet slides **down** so the rider can see more of the map.
  - This interaction makes it easy to demo the transition between **map overview** and **AI explanation**.

### How the data is simulated

- `predictions.json`
  - Contains a small set of prediction rows per pod:
    - `pod_id`
    - `timestamp`
    - `occupancy_rate` (0–1)
  - For this demo, we filter on `POD-GCT-001A` (Routes Pod – IADE) and compute:
    - average occupancy → AI comfort score
    - latest occupancy → availability pills (`x / 16` spots)

- `weather.json`
  - Contains a few entries for the IADE area:
    - `location` (e.g. `"IADE"`)
    - `timestamp`
    - `temperature_c`
    - `humidity` (0–1)
  - The app compares **current vs next** humidity to generate the “Humidity trend” label.

> 🔧 can replace both JSON files with exported predictions:
> - keep the same field names
> - update values and timestamps  
> The UI will automatically update the availability pills, comfort label, and forecast text.

---

### Why this matters for Milestone 2

Together, the **Operator Dashboard** and **Rider App** screens demonstrate:

- how an ML model can be **exported as JSON** and plugged into a front-end,
- how the same prediction data can support **two perspectives**:
  - operators: capacity planning + optimization cards
  - riders: comfort and clarity at the point of decision,
- and how we can layer **agent-based visuals** (p5.js) to communicate AI behaviour in a way that feels intuitive and “alive”.


