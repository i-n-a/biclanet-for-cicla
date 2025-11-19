# What we are actually building
### “infrastructure-as-a-service”

A modular parking OS that can adapt to the needs of multiple masters  
(Product Team A&B, Marketing A&B, CICLA, and stakeholders).

Each collaborating master’s program becomes one of our **B2B clients**.  
We build the **engine**, they build their **shell**.  
This transforms our project from a fixed object into a scalable system,  
while keeping our workload focused and manageable.

---

## What stays the same from Milestone 1

Everything from our M1 report remains the foundation:

### **User problems**
- security  
- predictability  
- weather  
- visibility  
- trust  

### **System idea**
- IoT sensors (occupancy, lock)  
- Weather API  
- AI/ML predictions  
- App + dashboard layers  

We are not discarding work. we’re reorganizing our M1 concept into a more realistic **platform**.

---

## 🟩 Product Team A & B Output  
**(THEIR JOBS, not ours)**  
They deliver:  
- Their physical concepts  
- Their geometry  
- Their materials  
- Their placement concepts  
- Their shape explorations  

We plug their 3D models into the Unity digital twin.  
Their work becomes **Podular Skins**.  
We do **NOT** rebuild tech for each. we only adapt visualizations.

---

## 🟧 Marketing Team Output  
They provide branding options:  
- Colors  
- Icons  
- Tagline  
- Logo  
- Poster  
- Messaging tone  

We apply this ON TOP of our single app design as theme variants.

**ONE app, multiple visual skins that marketing teams can "plug in".**

---

## What Milestone 2 Requires

- IoT prototype (real sensor inputs & LED outputs)  
- Early AI logic  
- Early ML model  
- Interface prototype (p5.js)  
- Unity digital twin  
- Early physical mockup with electronics  
- Clear narrative of how all modules integrate  

The **Podular Solutions** model checks **EVERY** box with **minimal repetition**.

---

## Deliverables for Milestone 2

We will deliver:

1. One IoT hardware module  
2. one AI visualization example
3. one ML model  
4. Prototype visual of app with “theme switch”  
5. At least one Unity digital twin (we can choose whose model...Andreys, other product teams models, etc)  
6. Conceptual mockup (ties into 'client' backend) showing **“Podular Configurator Website”**  
7. Documentation explaining the white-label architecture  
8. Clear role division + GitHub task board  

---
______________________________________________________________________
______________________________________________________________________

# Milestone 2 — Podular Solutions Task Checklist

A complete, organized breakdown of what we need to deliver for Milestone 2.

---

## 🚀 CORE SYSTEM (Architecture + Documentation)

- [ ] Finalize Podular Solutions white-label architecture
- [ ] Upload internal alignment README to GitHub
- [ ] Create simple architecture diagram (PNG)
- [ ] Create system overview diagram (PNG)
- [ ] Decide which Product Team model will be used for the M2 digital twin
- [ ] Create folder structure in GitHub
- [ ] Create tasks in Github
- [ ] Send Product A&B their tech list of requirements (By Thursday nov 20!)



---

## 🔧 IoT / HARDWARE (ESP32 Prototype)

- [ ] Assemble ESP32 hardware setup
- [ ] Add occupancy sensor
- [ ] Add lock sensor
- [ ] Add RGB LED feedback
- [ ] Add RFID/NFC module
- [ ] Add servo for automatic “lock/unlock”
- [ ] Write firmware to read sensor states
- [ ] Write firmware to send data to Firebase
- [ ] Test IoT → Firebase connection
- [ ] Test Firebase → App (p5.js) data flow
- [ ] Prototype physical housing (can be foam/cardboard mockup. or 3D print?)

---

## 🗄 BACKEND / DATA (Firebase)

- [ ] Initialize Firebase project
- [ ] Define database structure  
      (pods → status → timestamp → weather → prediction)
- [ ] Connect ESP32 → Firebase
- [ ] Connect p5.js app → Firebase
- [ ] Connect Unity → Firebase
- [ ] Test real-time updates from IoT → app
- [ ] Create mock data for fallback

---

## 🧠 AI LOGIC (Comfort Score)

- [ ] Set up Weather API integration
- [ ] Collect sample weather data
- [ ] Define comfort-score formula
- [ ] Display comfort score in p5.js interface
- [ ] Display comfort score in Unity dashboard

---

## 🤖 ML MODEL (ml5.js Availability Prediction)

- [ ] Create synthetic occupancy dataset
- [ ] Train ml5.js model (simple regression/classification)
- [ ] Implement model in p5.js
- [ ] Display predicted availability in app

---

## 🎨 APP / UI (Figma + p5.js)

### *Figma*
- [ ] Create Podular Core app UI
- [ ] Design map screen / pod status screen
- [ ] Design “theme variations” based on marketing outputs just as examples using figma components.
- [ ] Export assets for p5.js prototype

### *p5.js*
- [ ] Build basic interface (UI blocks)
- [ ] Show real-time availability from Firebase
- [ ] Show lock status
- [ ] Show weather & comfort score
- [ ] Show ML prediction
- [ ] Add theme-switching (optional but easy)

---

## 🧩 UNITY DIGITAL TWIN

- [ ] Import chosen Product Team 3D model
- [ ] Build Unity scene: ground, lighting, camera
- [ ] Add occupancy visualization (color change, glow, etc.)
- [ ] Add lock/unlock visualization
- [ ] Display current availability (Firebase)
- [ ] Display comfort score (optional)
- [ ] Animate simple states (bike in/out, LED feedback)
- [ ] Test Firebase → Unity data flow

---

## 🌐 CONCEPT WEBSITE (Optional but powerful)

- [ ] Create 1-page “Podular Configurator” mockup in Figma
- [ ] Add steps: choose model → choose features → choose theme
- [ ] Export as images for final presentation

---

## 🎤 PRESENTATION / NARRATIVE

- [ ] Write clear story connecting M1 → M2 → Podular Solutions
- [ ] Create slide deck (Google Slides / Figma)
- [ ] Add architecture diagrams and flowcharts
- [ ] Add demo flow: IoT → App → Unity
- [ ] Prepare demonstration script
- [ ] (Optional) Suit + briefcase gag for dramatic effect 😉

---

# ✔ END OF CHECKLIST




