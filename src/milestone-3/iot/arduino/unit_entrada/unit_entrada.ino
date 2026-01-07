// Pod_01_entrada_01 - Door control with button and 4 states

#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// WiFi
const char* ssid = "Nothing32";
const char* password = "212855625";

// Firebase
#define FIREBASE_HOST "booking-ee47f-default-rtdb.europe-west1.firebasedatabase.app"
#define FIREBASE_AUTH "m3uCFaiui2EXuQdpZGuuIgwgarKXH5lojbhUgF5b"

// Device name
const String device_id = "Pod_01_entrada_01";

// Pins
const int buttonPin = 12; // push button (pull-up)
const int greenLed = 18; // closed
const int blueLed = 4; // opening
const int redLed = 5; // open
const int yellowLed = 21; // closing (blink)

// Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Variables
int door_state = 0; // 0: closed, 1: opening, 2: open, 3: closing
unsigned long process_start = 0;
unsigned long blink_time = 0;
bool blinking = false;
int lastButtonState = HIGH;
unsigned long last_sync = 0;
unsigned long last_ping = 0;
unsigned long last_settings_read = 0;
int send_interval = 10; // default 10 seconds

void setup() {
  // Start serial
  Serial.begin(115200);
  
  // Set pins
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(greenLed, OUTPUT);
  pinMode(blueLed, OUTPUT);
  pinMode(redLed, OUTPUT);
  pinMode(yellowLed, OUTPUT);
  
  // Turn off all LEDs
  digitalWrite(greenLed, LOW);
  digitalWrite(blueLed, LOW);
  digitalWrite(redLed, LOW);
  digitalWrite(yellowLed, LOW);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  
  // Set up Firebase
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  
  // Get initial door state from Firebase
  int fb_state;
  String path = "/devices/" + device_id + "/door_state";
  if (Firebase.RTDB.getInt(&fbdo, path.c_str(), &fb_state)) {
    if (fb_state >= 0 && fb_state <= 3) {
      door_state = fb_state;
      if (door_state == 1 || door_state == 3) {
        process_start = millis();
      }
    }
  }
  
  // Get initial send_interval
  read_settings();
}

void loop() {
  // Read button
  int buttonState = digitalRead(buttonPin);
  
  // Check for button press
  if (buttonState == LOW && lastButtonState == HIGH) {
    // Button pressed
    if (door_state == 0) {
      door_state = 1;
      process_start = millis();
    } else if (door_state == 2) {
      door_state = 3;
      process_start = millis();
    } else if (door_state == 1) {
      // Abort opening, reverse to closing
      door_state = 3;
      process_start = millis();
    } else if (door_state == 3) {
      // Abort closing, reverse to opening
      door_state = 1;
      process_start = millis();
    }
    update_firebase();
  }
  lastButtonState = buttonState;
  
  // Check process time for opening or closing
  if (door_state == 1 || door_state == 3) {
    if (millis() - process_start >= 5000) {
      if (door_state == 1) {
        door_state = 2;
      } else {
        door_state = 0;
      }
      update_firebase();
    }
  }
  
  // Sync with Firebase every 5 seconds
  if (millis() - last_sync > 5000) {
    int fb_state;
    String path = "/devices/" + device_id + "/door_state";
    if (Firebase.RTDB.getInt(&fbdo, path.c_str(), &fb_state)) {
      if (fb_state != door_state && fb_state >= 0 && fb_state <= 3) {
        door_state = fb_state;
        if (door_state == 1 || door_state == 3) {
          process_start = millis();
        }
      }
    }
    last_sync = millis();
  }
  
  // Read settings every 10 seconds
  if (millis() - last_settings_read >= 10000) {
    read_settings();
    last_settings_read = millis();
  }
  
  // Send ping every send_interval seconds
  if (millis() - last_ping >= send_interval * 1000) {
    send_ping();
    last_ping = millis();
  }
  
  // Update LEDs
  update_leds();
}

void update_leds() {
  // Turn off all LEDs
  digitalWrite(greenLed, LOW);
  digitalWrite(blueLed, LOW);
  digitalWrite(redLed, LOW);
  digitalWrite(yellowLed, LOW);
  
  // Set LED based on state
  if (door_state == 0) {
    digitalWrite(greenLed, HIGH);
  } else if (door_state == 1) {
    digitalWrite(blueLed, HIGH);
  } else if (door_state == 2) {
    digitalWrite(redLed, HIGH);
  } else if (door_state == 3) {
    // Blink yellow
    if (millis() - blink_time >= 500) {
      blinking = !blinking;
      blink_time = millis();
    }
    if (blinking) {
      digitalWrite(yellowLed, HIGH);
    } else {
      digitalWrite(yellowLed, LOW);
    }
  }
}

void update_firebase() {
  String base_path = "/devices/" + device_id + "/";
  unsigned long now = millis();
  Firebase.RTDB.setInt(&fbdo, (base_path + "door_state").c_str(), door_state);
  Firebase.RTDB.setInt(&fbdo, (base_path + "timestamp").c_str(), now / 1000);
}

void send_ping() {
  String base_path = "/devices/" + device_id + "/";
  unsigned long now = millis();
  Firebase.RTDB.setInt(&fbdo, (base_path + "timestamp").c_str(), now / 1000);
}

void read_settings() {
  String conn_path = "/devices/" + device_id + "/settings/connection_package/";
  Firebase.RTDB.getInt(&fbdo, (conn_path + "send_interval").c_str(), &send_interval);
}
