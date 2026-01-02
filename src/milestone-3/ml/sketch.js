// p5.js + ml5.js Neural Network Regression Model Training Sketch
// Occupancy prediction model (predict occupancy in 60 minutes)
//
// Assumes you uploaded: synthetic_occupancy_dataset.json
// JSON Format: [{ input: {...}, output: {...} }, ...]

let dataset = [];
let nn;
let trained = false;
let statusMsg = "Init...";

let checks = []; // {label, value}
let lastCheckTime = 0;

let saveBtn, runBtn;
let activePod = 1; // 1..15

let q1_pred = null;
let q2_avg = null;
let q2_min = null;
let q2_max = null;
let curve24 = []; // 24 values

// Layout constants
const UI_BAR_H = 100;     // top bar height
const PAD = 20;          // general padding
const CARD_PAD = 32;     // padding inside cards
const POD_SELECTOR_H = 72 + CARD_PAD; // height of the pod selector strip

// Pod selector hitboxes (computed each frame)
let podMinusRect = null;
let podPlusRect = null;

async function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("monospace");
  textSize(12);

  // TF backend init (avoids WebGPU issues)
  await ml5.tf.setBackend("webgl");
  await ml5.tf.ready();
  console.log("TF backend:", ml5.tf.getBackend());

  nn = ml5.neuralNetwork({ task: "regression", debug: true }); // learningRate is the default which is 0.2

  // --- UI buttons (top bar) ---
  saveBtn = createButton("Save model");
  saveBtn.position(PAD, PAD + 20);
  saveBtn.attribute("disabled", true);
  saveBtn.mousePressed(() => {
    if (trained) nn.save();
  });

  runBtn = createButton("Run checks");
  runBtn.position(PAD + 110, PAD + 20);
  runBtn.attribute("disabled", true);
  runBtn.mousePressed(async () => {
    statusMsg = "Running checks...";
    await runSanityChecks();
    //await recomputeAll();
    statusMsg = `Ready POD-${nf(activePod, 2, 0)}`;
  });

  // Load dataset
  statusMsg = "Loading dataset...";
  loadJSON("data/synthetic_occupancy_dataset.json", (data) => {
    dataset = data;

    statusMsg = `Loaded ${dataset.length} rows → preparing...`;
    for (let row of dataset) nn.addData(row.input, row.output);
    nn.normalizeData();

    trainModel();
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutButtons();
}

function layoutButtons() {
  saveBtn.position(PAD + 16, PAD + 45);
  runBtn.position(PAD + 126, PAD + 45);
}

function draw() {
  background(245);

  // Top bar
  drawTopBar();

  // Content area below bar
  const contentY = UI_BAR_H + PAD;
  const contentH = height - contentY - PAD;

  // Row 1: sanity checks
  const rowGap = 14;
  const row1H = min(280, contentH * 0.40 + CARD_PAD);
  const row1Y = contentY;

  // Pod selector strip sits BELOW sanity checks
  const selectorY = row1Y + row1H + rowGap;

  // Row 2: Q panels start BELOW selector strip
  const row2Y = selectorY + POD_SELECTOR_H + rowGap;
  const row2H = height - row2Y - PAD;

  drawSanitySection(PAD, row1Y, width - PAD * 2, row1H);
  drawPodSelectorSection(PAD, selectorY, width - PAD * 2, POD_SELECTOR_H);
  drawPanelsSection(PAD, row2Y, width - PAD * 2, row2H);

  // Auto refresh sanity checks every 20s after training
  // if (trained && millis() - lastCheckTime > 20000) {
  //   lastCheckTime = millis();
  //   runSanityChecks();
  // }
}

function drawTopBar() {
  noStroke();
  fill(255);
  rect(0, 0, width, UI_BAR_H);

  stroke(230);
  line(0, UI_BAR_H, width, UI_BAR_H);
  noStroke();

  fill(0);
  textSize(14);
  text("ML Lab — Occupancy Forecast (ml5 regression)", PAD + 16  , PAD + 10);

  fill(90);
  textSize(12);
  text(statusMsg, PAD + 16, PAD + 32);

  layoutButtons();
}

// -------------------- Training --------------------

async function trainModel() {
  statusMsg = `Training... (dataset = ${dataset.length} data samples)`;

  await nn.train({ epochs: 30, batchSize: 64 }, (epoch, loss) => {
    if (epoch % 5 === 0) {
      statusMsg = `Training epoch ${epoch} | loss: ${nf(loss.loss, 1, 6)}`;
    }
  });

  trained = true;
  statusMsg = "Training complete! Computing outputs...";

  // Enable buttons
  saveBtn.removeAttribute("disabled");
  runBtn.removeAttribute("disabled");

  // Run checks immediately so they appear right away
  await runSanityChecks();
  lastCheckTime = millis();

  // Compute Q panels immediately
  await recomputeAll();
  statusMsg = `Trained Model Ready`;
}

// -------------------- Helpers --------------------

function pickBaseInput() {
  const r = dataset[Math.floor(Math.random() * dataset.length)];
  return JSON.parse(JSON.stringify(r.input));
}

async function predictVal(inputObj) {
  const r = await nn.predict(inputObj);
  return r[0].predicted_occupancy_60m;
}

// -------------------- Sanity checks --------------------

async function runSanityChecks() {
  if (!trained) return;

  const base = pickBaseInput();

  const dry = { ...base, precipitation_mm: 0 };
  const wet = { ...base, precipitation_mm: 10 };

  const rush = { ...base, day_of_week: 2, is_weekend: 0, hour: 9, is_day: 1 };
  const night = { ...base, day_of_week: 2, is_weekend: 0, hour: 2, is_day: 0 };

  const calm = { ...base, wind_speed_kmh: 3 };
  const windy = { ...base, wind_speed_kmh: 28 };

  checks = [
    { label: "Dry (0mm)", value: await predictVal(dry) },
    { label: "Wet (10mm)", value: await predictVal(wet) },
    { label: "Rush (09:00)", value: await predictVal(rush) },
    { label: "Night (02:00)", value: await predictVal(night) },
    { label: "Calm (3km/h)", value: await predictVal(calm) },
    { label: "Windy (28km/h)", value: await predictVal(windy) }
  ];
}

// -------------------- Sanity section --------------------

function drawSanitySection(x, y, w, h) {
  drawCard(x, y, w, h);

  fill(0);
  textSize(13);
  text("Sanity Checks (pattern validation)", x + CARD_PAD, y + CARD_PAD);

  fill(90);
  textSize(12);
  text("Expected: Wet < Dry, Night < Rush, Windy < Calm", x + CARD_PAD, y + CARD_PAD + 20);
  if (!trained) {
    fill(120);
    text("Training in progress…", x + CARD_PAD, y + 70);
    return;
  }
  if (!checks || checks.length === 0) {
    fill(120);
    text("Computing sanity checks…", x + CARD_PAD, y + 70);
    return;
  }

  const bx = x + CARD_PAD;
  const by = y + 60;
  const bw = w - CARD_PAD * 2;
  const bh = h - 80;

  drawBars(checks, bx, by, bw, bh);
}

function drawBars(items, x, y, w, h) {
  const maxVal = 1;
  const rowH = h / items.length;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const barW = (it.value / maxVal) * (w * 0.62);

    noStroke();
    fill(230);
    rect(x, y + i * rowH + 8, w * 0.62, rowH - 14, 7);

    fill(80);
    rect(x, y + i * rowH + 8, barW, rowH - 14, 7);

    fill(0);
    textSize(12);
    text(it.label, x + w * 0.66, y + i * rowH + 18);

    fill(60);
    text(nf(it.value * 100, 2, 1) + "%", x + w * 0.66, y + i * rowH + 32);
  }
}

// -------------------- Pod selector section --------------------

function drawPodSelectorSection(x, y, w, h) {
  drawCard(x, y, w, h);

  fill(0);
  textSize(13);
  text("Select active pod for Occupancy Prediction Questioning", x + CARD_PAD, y + CARD_PAD);

  const centerX = x + CARD_PAD + 120;
  const btnY = y + CARD_PAD + 18;

  const bw = 34;
  const bh = 26;

  const minusX = centerX - 120;
  const plusX = centerX + 86;

  // Disable logic
  const minusDisabled = !trained || activePod <= 1;
  const plusDisabled  = !trained || activePod >= 15;

  podMinusRect = { x: minusX, y: btnY, w: bw, h: bh, disabled: minusDisabled };
  podPlusRect  = { x: plusX,  y: btnY, w: bw, h: bh, disabled: plusDisabled };

  drawButton(minusX, btnY, bw, bh, "-", minusDisabled);
  drawButton(plusX, btnY, bw, bh, "+", plusDisabled);

  fill(trained ? 0 : 160);
  textSize(18);
  textAlign(CENTER, CENTER);
  text(`POD-${nf(activePod, 2, 0)}`, centerX, y + h / 2 + 12);
  textAlign(LEFT, BASELINE);
  textSize(12);
}

function mousePressed() {
  if (!trained) return;

  if (podMinusRect && !podMinusRect.disabled &&
      hitRect(podMinusRect.x, podMinusRect.y, podMinusRect.w, podMinusRect.h)) {
    changePod(-1);
  }

  if (podPlusRect && !podPlusRect.disabled &&
      hitRect(podPlusRect.x, podPlusRect.y, podPlusRect.w, podPlusRect.h)) {
    changePod(+1);
  }
}


function changePod(delta) {
  activePod = constrain(activePod + delta, 1, 15);
  statusMsg = `Updating predictions for POD-${nf(activePod, 2, 0)}...`;

  // Clear old values so UI shows "Computing..."
  q1_pred = null;
  q2_avg = null;
  q2_min = null;
  q2_max = null;
  curve24 = [];

  recomputeAll().then(() => {
    statusMsg = `Ready POD-${nf(activePod, 2, 0)} for Questioning`;
  });
}

// -------------------- Panels section --------------------

function drawPanelsSection(x, y, w, h) {
  const gap = 14;
  const cardW = (w - gap * 2) / 3;
  const cardH = h;

  drawPanelQ1(x, y, cardW, cardH);
  drawPanelQ2(x + cardW + gap, y, cardW, cardH);
  drawPanelQ3(x + (cardW + gap) * 2, y, cardW, cardH);
}

async function recomputeAll() {
  await computeQ1();
  await computeQ2();
  await computeQ3();
}

function pickBaseInputForPod(podId) {
  const r = dataset[Math.floor(Math.random() * dataset.length)];
  const base = JSON.parse(JSON.stringify(r.input));
  base.pod_id = podId;
  return base;
}

async function predictOne(inputObj) {
  const r = await nn.predict(inputObj);
  return r[0].predicted_occupancy_60m;
}

// ---------- Q1 ----------
async function computeQ1() {
  const base = pickBaseInputForPod(activePod);
  q1_pred = await predictOne(base);
}

function drawPanelQ1(x, y, w, h) {
  drawCard(x, y, w, h);

  fill(0);
  textSize(13);
  text("Q1", x + CARD_PAD, y + CARD_PAD);

  fill(70);
  textSize(12);
  drawWrappedText(
    "What % occupied will this pod be in the next hour?",
    x + CARD_PAD,
    y + CARD_PAD + 22,
    w - CARD_PAD * 2,
    14
  );

  if (!trained || q1_pred === null) {
    fill(120);
    text("Computing...", x + CARD_PAD, y + 100);
    return;
  }

  fill(0);
  textSize(30);
  text(nf(q1_pred * 100, 2, 1) + "%", x + CARD_PAD, y + 130);

  fill(70);
  textSize(12);
  text(`Pod: POD-${nf(activePod, 2, 0)}`, x + CARD_PAD, y + 160);
  text(`Prediction horizon: +60m`, x + CARD_PAD, y + 178);
}

// ---------- Q2 ----------
async function computeQ2() {
  const samples = 24;
  const preds = [];

  for (let i = 0; i < samples; i++) {
    const inp = pickBaseInputForPod(activePod);

    inp.day_of_week = 4; // Thu
    inp.is_weekend = 0;
    inp.hour = 8;
    inp.is_day = 1;

    inp.precipitation_mm = random([0, 0, 0.5, 1.0, 2.0]);
    inp.wind_speed_kmh = random([2, 6, 10, 15, 20]);
    inp.apparent_temperature_c = random([14, 18, 22, 26, 30]);

    preds.push(await predictOne(inp));
  }

  q2_avg = preds.reduce((a, b) => a + b, 0) / preds.length;
  q2_min = Math.min(...preds);
  q2_max = Math.max(...preds);
}

function drawPanelQ2(x, y, w, h) {
  drawCard(x, y, w, h);

  fill(0);
  textSize(13);
  text("Q2", x + CARD_PAD, y + CARD_PAD);

  fill(70);
  textSize(12);
  drawWrappedText(
    "How busy is this pod usually on Thursdays at 8:00?",
    x + CARD_PAD,
    y + + CARD_PAD + 22,
    w - CARD_PAD * 2,
    14
  );

  if (!trained || q2_avg === null) {
    fill(120);
    text("Computing...", x + CARD_PAD, y + 100);
    return;
  }

  fill(0);
  textSize(26);
  text(nf(q2_avg * 100, 2, 1) + "%", x + CARD_PAD, y + 130);

  fill(70);
  textSize(12);
  text(`Min: ${nf(q2_min * 100, 2, 1)}%`, x + CARD_PAD, y + 160);
  text(`Max: ${nf(q2_max * 100, 2, 1)}%`, x + CARD_PAD, y + 178);
}

// ---------- Q3 ----------
async function computeQ3() {
  const base = pickBaseInputForPod(activePod);

  const preds = [];
  let occNow = base.occupancy_now;
  let occPrev = base.occupancy_60m_ago;

  for (let i = 0; i < 24; i++) {
    const hourFuture = (base.hour + i) % 24;

    const step = {
      ...base,
      hour: hourFuture,
      is_day: hourFuture >= 7 && hourFuture <= 19 ? 1 : 0,
      occupancy_now: occNow,
      occupancy_60m_ago: occPrev
    };

    const p = await predictOne(step);
    preds.push(p);

    occPrev = occNow;
    occNow = p;
  }

  curve24 = preds;
}

function drawPanelQ3(x, y, w, h) {
  drawCard(x, y, w, h);

  fill(0);
  textSize(13);
  text("Q3", x + CARD_PAD, y + CARD_PAD);

  fill(70);
  textSize(12);
  drawWrappedText(
    "What is the expected occupancy curve for the next 24h of the active pod?",
    x + CARD_PAD,
    y + CARD_PAD + 22,
    w - CARD_PAD * 2,
    14
  );

  if (!trained || curve24.length !== 24) {
    fill(120);
    text("Computing...", x + CARD_PAD, y + 100);
    return;
  }

  const cx = x + CARD_PAD;
  const cy = y + 90;
  const cw = w - CARD_PAD * 2;
  const ch = h - 120;

  stroke(210);
  line(cx, cy + ch, cx + cw, cy + ch);
  line(cx, cy, cx, cy + ch);

  noFill();
  stroke(60);
  beginShape();
  for (let i = 0; i < 24; i++) {
    const px = cx + (i / 23) * cw;
    const py = cy + (1 - curve24[i]) * ch;
    vertex(px, py);
  }
  endShape();

  noStroke();
  fill(80);
  textSize(11);
  text("now", cx, cy + ch + 16);
  text("+24h", cx + cw - 28, cy + ch + 16);
}

// -------------------- UI utils --------------------

function drawCard(x, y, w, h) {
  noStroke();
  fill(255);
  rect(x, y, w, h, 14);

  stroke(230);
  noFill();
  rect(x, y, w, h, 14);
  noStroke();
}

function drawButton(x, y, w, h, label, disabled = false) {
  noStroke();
  fill(disabled ? 245 : 230);
  rect(x, y, w, h, 6);
  fill(disabled ? 170 : 0);
  textSize(14);
  text(label, x + w / 2 - 4, y + 16);
  textSize(12);
}

function hitRect(x, y, w, h) {
  return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

function drawWrappedText(str, x, y, maxW, lineH) {
  const words = str.split(" ");
  let line = "";
  let yy = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    if (textWidth(testLine) > maxW && i > 0) {
      text(line, x, yy);
      line = words[i] + " ";
      yy += lineH;
    } else {
      line = testLine;
    }
  }
  text(line, x, yy);
}
