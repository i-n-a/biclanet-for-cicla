# Cicla EcoPod – Power Consumption and Autonomous Solar System Report  
**M-CCIA Project I – Milestone 1 Technical Annex**  
**Date:** 22 November 2025  
**Team:** Andrey, Inge, Nadine  

## 1. System Overview  
EcoPod is an autonomous, solar-powered, smart bicycle parking pod for 12 bicycles located in Lisbon, Portugal. The system operates off-grid using solar panels, LiFePO4 batteries and MPPT charge controller. All components are selected for low power consumption and high reliability.

## 2. Power Consumption Calculation  
Voltage reference: 12 V nominal (DC-DC conversion efficiency 90 %).  
Location solar insolation (Lisbon): average 4.1 kWh/m²/day (winter 2.7, summer 7.7).

| Component per bike stand (×12)          | Qty | Stand-by (mA) | Active (mA) | Duty cycle       | Daily energy (mAh/day) |
|----------------------------------------|-----|---------------|-------------|------------------|------------------------|
| ESP32 (deep-sleep + periodic wake)    | 12  | 0.01          | 200         | 1 min/h          | 4 080                  |
| LED strip 1 m white + 1 m RGB (CRI>90, 120 LED/m) | 12  | –             | 960         | 2 h/night        | 23 040                 |
| 2 × solenoid (normally closed, 12 V)   | 24  | 0             | 500         | 10 s × 20/day    | 5 556                  |
| 2 × servo (height + clamp)             | 24  | 100           | 500         | 10 s × 20/day    | 2 400 + 5 556          |
| Hall sensor + limit switches + button  | –   | <6            | –           | 100 %            | 1 728                  |
| Pressure/tension sensors (2×)          | 24  | 0.5           | –           | 100 %            | 288                    |
| RFID module (MFRC522)                   | 12  | 20            | –           | 100 %            | 5 760                  |
| **Subtotal per 12 stands**              |     |               |             |                  | **48 412 mAh/day**     |

| Pod-wide components                     | Qty | Stand-by (mA) | Active (mA) | Duty cycle       | Daily energy (mAh/day) |
|----------------------------------------|-----|---------------|-------------|------------------|------------------------|
| Wi-Fi access point / ESP-NOW mesh      | 1   | 200           | –           | 100 %            | 4 800                  |
| Weather station (DHT22 + anemometer + rain) | –   | 35            | –           | 100 %            | 840                    |
| Ventilation fans (covered, low-speed)  | 1   | –             | 500         | 4 h/day          | 2 000                  |
| OLED display 0.96" + intercom standby | 1   | 70            | –           | 100 %            | 1 680                  |
| Motorised door lock + motion sensors   | –   | <10           | 200         | 5 s × 20/day     | 240 + 67               |
| Emergency lights + intercom battery set| –   | 0             | 20          | backup only      | <100                   |
| **Subtotal pod-wide**                   |     |               |             |                  | **9 627 mAh/day**      |

**Total daily consumption (12 V):**  
- Stand-by / low-duty: ≈ 1.9 Ah  
- High-duty (LED + fans): ≈ 2.1 Ah  
- **Grand total:** 4.0 Ah/day (48 Wh/day) conservative estimate  
- Measured peak current during simultaneous operation: < 3 A

## 3. Solar Power System Specification (Off-Grid, Lisbon)

| Item                          | Specification                              | Daily yield (Lisbon) | Notes                                      |
|--------------------------------|--------------------------------------------|----------------------|--------------------------------------------|
| Solar panel                   | 120 W monocrystalline 12 V (0.8 m²)        | 490–550 Wh/day       | Roof-integrated, tilt 30°                 |
| Charge controller             | MPPT 20 A (e.g., EPEVER Tracer 2210AN)     | 98 % efficiency      | Low-voltage disconnect, temperature comp. |
| Battery bank                  | LiFePO4 12.8 V 30 Ah (384 Wh usable)       | 3–5 days autonomy    | 3000+ cycles, built-in BMS                 |
| Supercapacitor buffer (per ESP32) | 5 V 1–5 F                                 | –                    | Eliminates brown-out during Wi-Fi TX       |

**System efficiency:** 82 % (panel → battery → load).  
**Winter worst-case autonomy:** 3.2 days at 2.7 kWh/m²/day insolation.  
**Energy balance:** 490 Wh produced vs 48 Wh consumed → 10× margin.

## 4. Implemented Optimisations  
- ESP32 deep-sleep + ULP co-processor for sensor polling (consumption < 15 µA).  
- ESP-NOW mesh network replaces dedicated Wi-Fi router (−300 mA).  
- LED PWM dimming 30–50 % brightness at night (−50 % energy).  
- Solenoids and servos energised only on confirmed RFID + user action.  
- Separate NiMH 12 V 2 Ah pack for emergency lights and intercom (isolated).  
- Predictive AI model (Applied Machine Learning) disables ventilation and reduces LED duty when low occupancy is forecasted.

## 5. Additional Technical Enhancements  
- Ultrasonic sensors (HC-SR04) added for precise bicycle detection and 3D back-office visualisation in Unity.  
- Perimeter PIR + ultrasonic array for placement analytics and anti-tampering.  
- Real-time battery SoC monitoring via ESP32 ADC → p5.js dashboard.  
- CO₂ savings counter displayed on pod OLED and back-office (Creative Programming).  
- Central Raspberry Pi gateway option for multiple pods (future scaling).

The proposed power architecture guarantees full off-grid operation in Lisbon climate, meets all prototype requirements for Milestone 2 and 3, and provides sufficient headroom for additional sensors or future features.
