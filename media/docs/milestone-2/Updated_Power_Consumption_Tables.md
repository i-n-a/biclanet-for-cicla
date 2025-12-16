

### Updated Power Consumption Tables (12 V nominal system)

#### Per bike stand components × 12

| Component                               | Qty | Stand-by (mA) | Active (mA) | Duty cycle                  | Daily consumption per stand | Total ×12 stands |
|-----------------------------------------|-----|---------------|-------------|-----------------------------|-----------------------------|------------------|
| ESP32 (deep sleep + 60 s wake/hour)    | 12  | 0.015 mA      | 180 mA      | 59 min sleep + 1 min active | 3.3 mAh/day                 | 40 mAh/day       |
| LED strip 2 m total (white + RGB, CRI>90, 120 LED/m) | 12  | 0             | 1 000 mA    | 2 h/night at 50 % PWM dimming | 1 000 mAh/day               | 12 000 mAh/day   |
| 2 × solenoid lock (12 V, 6 W)           | 24  | 0             | 500 mA      | 10 s × 20 uses/day          | 278 mAh/day per stand       | 3 333 mAh/day   |
| 2 × servo (height + clamp)              | 24  | 80 mA         | 450 mA      | 10 s × 20 uses/day          | 233 mAh/day per stand       | 2 800 mAh/day    |
| 
| Hall + limit switches + button          | 12  | 6 mA total per stand | –           | 100 %                       | 144 mAh/day                 | 1 728 mAh/day    |
| Pressure/tension sensors                | 24  | 0.5 mA        | –           | 100 %                       | 24 mAh/day per stand        | 288 mAh/day      |
| RFID module MFRC522                     | 12  | 1.5 mA idle   | 25 mA read  | 99.9 % idle + 5 s × 20 reads | 40 mAh/day per stand        | 480 mAh/day      |
| **Subtotal per 12 stands**              |     |               |             |                             |                             | **20 669 mAh/day** |

#### Pod-wide components

| Component                                      | Qty | Stand-by (mA)  | Duty cycle               | Daily energy (mAh/day) |
|------------------------------------------------|-----|---------|--------------------------|------------------------|
| Central ESP32 (ESP-NOW coordinator + soft AP)  | 1   | 100 mA average           | 100 %                    | 2 400                 |
| Weather station (DHT22 + rain + anemometer)    | 1   | 35 mA average            | 100 %                    | 840                    |
| Ventilation fans (2 × Noctua 12 V, low speed)  | 2   | 250 mA total when running| 4 h/day                  | 1 000                  |
| OLED 0.96" + driver + backlight                | 1   | 25 mA                    | 100 %                    | 600                    |
| Motorised door lock + exterior motion sensors  | 1   | 5 mA standby, 200 mA × 5 s × 20/day | mixed          | 150                    |
| Emergency lighting + intercom backup circuit   | –   | <5 mA continuous         | 100 %                    | 120                    |
| **Subtotal pod-wide**                          |     |                          |                          | **5 110 mAh/day**      |

**Realistic total daily consumption @ 12 V**  
≈ 25.8 Ah/day → ≈ 310 Wh/day (average year)  
Winter peak (longer LED use, more ventilation) ≈ 30 Ah/day  
Summer peak ≈ 22–25 Ah/day

### Corrected & Realistic Solar Power System (Off-Grid, Lisbon)

| Item                               | New Specification                          | Expected daily yield (Lisbon) | Notes                                      |
|------------------------------------|--------------------------------------------|------------------------------|--------------------------------------------|
| Solar panels                       | 400 W total (4 × 100 W monocrystalline 12-24 V panels) | 1 400–1 700 Wh/day (year average)<br>Winter ≈ 950 Wh/day | Roof + south façade possible, 30° tilt     |
| Charge controller                  | MPPT 40 A (e.g., Victron SmartSolar 100/50 or EPEVER 4210AN) | 95–98 % efficiency           | Bluetooth monitoring, temp compensation    |
| Battery bank                       | LiFePO4 12.8 V 120 Ah (1.5 kWh nominal, ≈ 1.4 kWh usable) | 4–6 days autonomy            | Built-in BMS, heated option for winter     |
| System efficiency (panel → load)   | ≈ 82–85 %                                  | –                            | Includes wiring, converter, quiescent losses |
| Winter worst-case (Dec/Jan)        | 2.7 kWh/m²/day → ≈ 950–1 000 Wh generated | >3× margin over 300 Wh consumption | 4–5 days full autonomy even with 50 % panel snow/soiling |

**Energy balance (winter worst-case)**  
Generated ≈ 950–1 000 Wh/day  
Consumed ≈ 310 Wh/day → **>3× daily surplus**, battery never drops below 70 % SoC in normal operation.

### Quick Summary of Changes You Should Make in the Text

- Replace the old tables with the ones above
- Change the “Grand total: 4.0 Ah/day” → “Average 26 Ah/day (310 Wh/day)”
- Delete the per-ESP32 supercapacitors (replace with one 5.5 V 25 F on the main 5 V rail if you really want brown-out protection)
- Delete or heavily justify the separate NiMH emergency pack
- Update Section 3 with the new 400 W / 120 Ah system
- Keep all the nice optimisations (ESP-NOW, PWM dimming, predictive ventilation shut-off, etc.) — they are excellent

With these tables your report becomes bullet-proof and actually matches reality.  
Let me know if you want the full rewritten Markdown file or a clean LaTeX/Word version!
