// Pod_01_Claw_01.ino - Storage pod with servo claw and limit switches

#include <ESP32Servo.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

//  Wi-Fi Networks 
struct WiFiNetwork {
  const char* ssid;
  const char* password;
};

WiFiNetwork networks[] = {
  {"MEO-2hzF96460", "FpxA9bv8"},      // home network
  {"Nothing32", "212855625"}          // phone hotspot
};
const int numNetworks = 2;

// WiFi status LED (built-in on most ESP32 boards)
const int wifiStatusLed = 2;

//  Firebase 
#define FIREBASE_HOST "booking-ee47f-default-rtdb.europe-west1.firebasedatabase.app"
#define FIREBASE_AUTH "m3uCFaiui2EXuQdpZGuuIgwgarKXH5lojbhUgF5b"

const String device_id = "Pod_01_Claw_01";
const String basePath = "/devices/" + device_id + "/";

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

//  Pins 
const int servoPin = 13;
const int closeSwitchPin = 14;  // NC: HIGH when fully closed
const int openSwitchPin = 15;   // NC: HIGH when fully open

Servo clawServo;

//  Settings from Firebase 
int stop_adjust = 0;           // default 0, will be updated from Firebase
int direction_reverse = 0;     // 0 = normal, 1 = reversed (default 1 for your new hardware)
int opening_time_sec = 5;
int closing_time_sec = 5;

//  State 
int lock_state = 0;            // 0=closed, 1=opening, 2=open, 3=closing
bool last_close_pressed = false;
bool last_open_pressed = false;
int open_cycles = 0;
int occupancy = 0;
unsigned long process_start = 0;

//  WiFi Connection Function 
void connectToWiFi() {
  pinMode(wifiStatusLed, OUTPUT);
  
  while (true) {  // try forever
    for (int i = 0; i < numNetworks; i++) {
      Serial.print("Trying WiFi: ");
      Serial.println(networks[i].ssid);

      WiFi.begin(networks[i].ssid, networks[i].password);

      unsigned long startTime = millis();
      while (millis() - startTime < 15000) {  // try 15 seconds
        digitalWrite(wifiStatusLed, !digitalRead(wifiStatusLed));  // fast blink
        delay(200);

        if (WiFi.status()  WL_CONNECTED) {
          digitalWrite(wifiStatusLed, HIGH);  // steady on
          Serial.println("");
          Serial.println("Connected to " + String(networks[i].ssid));
          Serial.print("IP address: ");
          Serial.println(WiFi.localIP());
          return;  // success
        }
      }

      WiFi.disconnect();
      Serial.println("Failed");
    }

    // All networks failed this round
    Serial.println("No WiFi found. Retry in 5 seconds...");
    for (int i = 0; i < 25; i++) {  // 5 seconds slow blink
      digitalWrite(wifiStatusLed, !digitalRead(wifiStatusLed));
      delay(200);
    }
  }
}

//  Setup 
void setup() {
  Serial.begin(115200);

  // Servo and switches
  pinMode(closeSwitchPin, INPUT_PULLUP);
  pinMode(openSwitchPin, INPUT_PULLUP);
  clawServo.attach(servoPin);
  applyStop();
  delay(500);
  applyStop();

  // Connect to WiFi (will not return until connected)
  connectToWiFi();

  // Firebase setup
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Create paths with defaults
  ensurePath("lock_state", 0);
  ensurePath("limit_switch", 0);
  ensurePath("open_switch", 0);
  ensurePath("open_cycles", 0);
  ensurePath("occupancy", 0);
  ensurePath("stop_adjust", 6);
  ensurePath("opening_time_sec", 5);
  ensurePath("closing_time_sec", 5);
  ensurePath("direction_reverse", 1);  // default reversed for your new hardware

  // Read initial values
  int val;
  if (getFBInt("lock_state", val)) lock_state = val;
  if (getFBInt("open_cycles", val)) open_cycles = val;
  if (getFBInt("occupancy", val)) occupancy = val;
  if (getFBInt("stop_adjust", val)) stop_adjust = val;
  if (getFBInt("opening_time_sec", val)) opening_time_sec = val;
  if (getFBInt("closing_time_sec", val)) closing_time_sec = val;
  if (getFBInt("direction_reverse", val)) direction_reverse = val;

  Serial.println("Initial lock_state: " + String(lock_state));
  Serial.println("stop_adjust: " + String(stop_adjust));
  Serial.println("direction_reverse: " + String(direction_reverse));
  applyStop();
}

//  Loop 
void loop() {
  // Read lock_state from Firebase every 2 seconds
  static unsigned long last_read = 0;
  if (millis() - last_read > 2000) {
    int fb_state;
    if (getFBInt("lock_state", fb_state)) {
      if (fb_state >= 0 && fb_state <= 3 && fb_state != lock_state) {
        lock_state = fb_state;
        if (lock_state  1 || lock_state  3) {
          process_start = millis();
          Serial.println("Start process, state = " + String(lock_state));
        }
      }
    }

    // Update settings if changed
    int new_val;
    if (getFBInt("stop_adjust", new_val) && new_val != stop_adjust) {
      stop_adjust = new_val;
      Serial.println("New stop_adjust = " + String(stop_adjust));
      applyStop();
    }
    if (getFBInt("opening_time_sec", new_val) && new_val != opening_time_sec) {
      opening_time_sec = new_val;
    }
    if (getFBInt("closing_time_sec", new_val) && new_val != closing_time_sec) {
      closing_time_sec = new_val;
    }
    if (getFBInt("direction_reverse", new_val) && new_val != direction_reverse) {
      direction_reverse = new_val;
      Serial.println("New direction_reverse = " + String(direction_reverse));
      applyStop();  // brief stop if changing mid-movement
    }

    last_read = millis();
  }

  // Read switches
  bool close_pressed = (digitalRead(closeSwitchPin)  HIGH);
  bool open_pressed = (digitalRead(openSwitchPin)  HIGH);
  setFBInt("limit_switch", close_pressed ? 1 : 0);
  setFBInt("open_switch", open_pressed ? 1 : 0);

  // Detect switch release for counters
  if (last_close_pressed && !close_pressed) {
    open_cycles++;
    setFBInt("open_cycles", open_cycles);
    Serial.println("open_cycles = " + String(open_cycles));
  }
  last_close_pressed = close_pressed;

  if (last_open_pressed && !open_pressed) {
    occupancy++;
    setFBInt("occupancy", occupancy);
    Serial.println("occupancy = " + String(occupancy));
  }
  last_open_pressed = open_pressed;

  // Servo control - stops immediately on target limit switch OR safety timeout
  if (lock_state  3) {  // closing
    rotateToClose();
    if (close_pressed) {
      localStopAndClosed();                                      // success: confirmed closed
    } else if (millis() - process_start >= closing_time_sec * 1000UL) {
      applyStop();
      lock_state = 2;
      setFBInt("lock_state", 2);
      Serial.println("CLOSING TIMEOUT (no limit hit) → failed to close, remain state 2 (open)");
    }
  }
  else if (lock_state  1) {  // opening
    rotateToOpen();
    if (open_pressed || (millis() - process_start >= opening_time_sec * 1000UL)) {
      localStopAndOpen();                                        // success: open (limit or timeout)
    }
  }
  else {
    applyStop();
  }

  // Timestamp every 10 seconds
  static unsigned long last_ts = 0;
  if (millis() - last_ts > 10000) {
    setFBTimestamp("timestamp");
    last_ts = millis();
  }

  delay(50);
}

//  Helper Functions 
void applyStop() {
  clawServo.write(90 + stop_adjust);
}

void rotateToClose() {
  clawServo.write(direction_reverse ? 180 : 0);  // closing direction
}

void rotateToOpen() {
  clawServo.write(direction_reverse ? 0 : 180);   // opening direction
}

void localStopAndClosed() {
  applyStop();
  lock_state = 0;
  open_cycles = 0;
  setFBInt("lock_state", 0);
  setFBInt("open_cycles", 0);
  Serial.println("Reached closed (limit hit) → state 0");
}

void localStopAndOpen() {
  applyStop();
  lock_state = 2;
  setFBInt("lock_state", 2);
  Serial.println("Reached open (limit or timeout) → state 2");
}

bool getFBInt(const String& path, int& value) {
  String full = basePath + path;
  if (Firebase.RTDB.getInt(&fbdo, full.c_str(), &value)) {
    return true;
  }
  return false;
}

bool setFBInt(const String& path, int value) {
  String full = basePath + path;
  if (Firebase.RTDB.setInt(&fbdo, full.c_str(), value)) {
    return true;
  } else {
    Serial.println("set FAILED: " + path + " error: " + fbdo.errorReason());
    return false;
  }
}

void ensurePath(const String& path, int defaultVal) {
  int val;
  if (!getFBInt(path, val)) {
    setFBInt(path, defaultVal);
  }
}

void setFBTimestamp(const String& path) {
  String full = basePath + path;
  unsigned long ts = millis() / 1000;
  Firebase.RTDB.setInt(&fbdo, full.c_str(), ts);
}
