#include <WiFi.h>
#include <Firebase_ESP_Client.h>
// == Wi-Fi Networks ==
struct WiFiNetwork {
  const char* ssid;
  const char* password;
};
WiFiNetwork networks[] = {
  {"MEO-2hzF96460", "FpxA9bv8"}, // home network
  {"Nothing32", "212855625"} // phone hotspot
};
const int numNetworks = 2;
// WiFi status LED (built-in on ESP32)
const int wifiStatusLed = 2;
// == Firebase ==
#define FIREBASE_HOST "<https://booking-ee47f-default-rtdb.europe-west1.firebasedatabase.app>"
#define FIREBASE_AUTH "m3uCFaiui2EXuQdpZGuuIgwgarKXH5lojbhUgF5b"
// Device name
const String device_id = "Pod_01_base_01";
// Pins
const int sensorPin0 = 34;
const int sensorPin1 = 35;
const int sensorPin2 = 32;
const int sensorPin3 = 33;
const int ledPin = 25;
// Maximum buffer size
const int max_buffer_size = 600;
// Structure for reading + timestamp
struct Reading {
  int value;
  unsigned long timestamp;
};
Reading buffer0[max_buffer_size];
Reading buffer1[max_buffer_size];
Reading buffer2[max_buffer_size];
Reading buffer3[max_buffer_size];
int buffer_index = 0;
// Settings (initial)
int min_light = 0;
int target_light = 1000;
int light_threshold = 1300;
int send_interval = 5;
int qty_reading_sensors_in_second = 10;
int sensor_buffer_time = 5;
int manual_override = 0;
int manual_toggle = 0;
// Sensor weights 0.0 - 1.0
float sensor0_weight = 1.0;
float sensor1_weight = 1.0;
float sensor2_weight = 1.0;
float sensor3_weight = 1.0;
// Timers
unsigned long last_sensor_read = 0;
unsigned long last_settings_read = 0;
unsigned long last_send = 0;
int read_delay = 100;
// Brightness
int current_brightness = 0;
// Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
// == Robust WiFi Connection ==
void connectToWiFi() {
  pinMode(wifiStatusLed, OUTPUT);
  digitalWrite(wifiStatusLed, LOW);
  while (true) { // try forever until connected
    for (int i = 0; i < numNetworks; i++) {
      Serial.print("Trying WiFi: ");
      Serial.println(networks[i].ssid);
      WiFi.begin(networks[i].ssid, networks[i].password);
      unsigned long startTime = millis();
      while (millis() - startTime < 15000) { // 15 second timeout per network
        digitalWrite(wifiStatusLed, !digitalRead(wifiStatusLed)); // fast blink
        delay(200);
        if (WiFi.status() == WL_CONNECTED) {
          digitalWrite(wifiStatusLed, HIGH); // steady on when connected
          Serial.println("");
          Serial.println("Connected to " + String(networks[i].ssid));
          Serial.print("IP address: ");
          Serial.println(WiFi.localIP());
          return; // success – exit function
        }
      }
      WiFi.disconnect();
      Serial.println("Failed to connect to " + String(networks[i].ssid));
    }
    // All networks failed this round
    Serial.println("No WiFi found. Retrying in 5 seconds...");
    for (int i = 0; i < 25; i++) { // slow blink for 5 seconds
      digitalWrite(wifiStatusLed, !digitalRead(wifiStatusLed));
      delay(200);
    }
  }
}
// Function: Read one sensor and store in buffer
void readAndStoreSensor(int pin, Reading buffer[], int index) {
  buffer[index].value = analogRead(pin);
  buffer[index].timestamp = millis();
}
// Function: Read all sensors
void readAllSensors() {
  unsigned long now = millis();
  if (now - last_sensor_read >= read_delay) {
    readAndStoreSensor(sensorPin0, buffer0, buffer_index);
    readAndStoreSensor(sensorPin1, buffer1, buffer_index);
    readAndStoreSensor(sensorPin2, buffer2, buffer_index);
    readAndStoreSensor(sensorPin3, buffer3, buffer_index);
    buffer_index = buffer_index + 1;
    if (buffer_index >= max_buffer_size) {
      buffer_index = 0;
    }
    last_sensor_read = now;
  }
}
// Function: Calculate average over the last N seconds
int calculateAverage(Reading buffer[], int window_seconds) {
  unsigned long now = millis();
  unsigned long window_start = now - (window_seconds * 1000UL);
  long sum = 0;
  int count = 0;
  for (int i = 0; i < max_buffer_size; i++) {
    if (buffer[i].timestamp >= window_start && buffer[i].timestamp > 0) {
      sum += buffer[i].value;
      count++;
    }
  }
  if (count == 0) return 0;
  return sum / count;
}
// Function: Calculate weighted average
int calculateWeightedAverage(int a0, int a1, int a2, int a3) {
  float total_weight = sensor0_weight + sensor1_weight + sensor2_weight + sensor3_weight;
  if (total_weight == 0) total_weight = 1;
  return (a0 * sensor0_weight + a1 * sensor1_weight + a2 * sensor2_weight + a3 * sensor3_weight) / total_weight;
}
// Function: Control LED brightness
void controlLED(int weighted_avg) {
  int brightness = 0;
  if (manual_override == 1) {
    brightness = (manual_toggle == 1) ? 255 : 0;
  } else {
    if (weighted_avg < light_threshold) {
      int denominator = light_threshold - min_light;
      if (denominator <= 0) denominator = 1;
      brightness = (light_threshold - weighted_avg) * 255 / denominator;
      brightness = constrain(brightness, 0, 255);
      int error = target_light - weighted_avg;
      brightness += error / 20;
      brightness = constrain(brightness, 0, 255);
    }
  }
  ledcWrite(ledPin, brightness);
  current_brightness = brightness;
}
// Function: Read settings from Firebase
void readSettingsFromFirebase() {
  unsigned long now = millis();
  if (now - last_settings_read >= 10000) {
    String base_path = "/devices/" + device_id + "/";
    String light_path = base_path + "settings/light_mapping/";
    String conn_path = base_path + "settings/connection_package/";
    String mode_path = base_path + "settings/light_mode/";
    String weights_path = light_path + "sensor_weights/";
    if (Firebase.RTDB.getInt(&fbdo, light_path + "min_light")) min_light = fbdo.intData();
    if (Firebase.RTDB.getInt(&fbdo, light_path + "target_light")) target_light = fbdo.intData();
    if (Firebase.RTDB.getInt(&fbdo, light_path + "light_threshold")) light_threshold = fbdo.intData();
    if (Firebase.RTDB.getFloat(&fbdo, weights_path + "sensor0_weight")) sensor0_weight = fbdo.floatData();
    if (Firebase.RTDB.getFloat(&fbdo, weights_path + "sensor1_weight")) sensor1_weight = fbdo.floatData();
    if (Firebase.RTDB.getFloat(&fbdo, weights_path + "sensor2_weight")) sensor2_weight = fbdo.floatData();
    if (Firebase.RTDB.getFloat(&fbdo, weights_path + "sensor3_weight")) sensor3_weight = fbdo.floatData();
    if (Firebase.RTDB.getInt(&fbdo, conn_path + "send_interval")) send_interval = fbdo.intData();
    if (Firebase.RTDB.getInt(&fbdo, conn_path + "qty_reading_sensors_in_second")) qty_reading_sensors_in_second = fbdo.intData();
    if (Firebase.RTDB.getInt(&fbdo, conn_path + "sensor_buffer_time")) sensor_buffer_time = fbdo.intData();
    if (Firebase.RTDB.getInt(&fbdo, mode_path + "manual_override")) manual_override = fbdo.intData();
    if (Firebase.RTDB.getInt(&fbdo, mode_path + "manual_toggle")) manual_toggle = fbdo.intData();
    // Protection against invalid values
    if (qty_reading_sensors_in_second <= 0) qty_reading_sensors_in_second = 10;
    read_delay = 1000 / qty_reading_sensors_in_second;
    if (read_delay < 10) read_delay = 10;
    last_settings_read = now;
  }
}
// Function: Send data to Firebase
void sendDataToFirebase(int weighted_avg, int avg0, int avg1, int avg2, int avg3) {
  unsigned long now = millis();
  if (now - last_send >= (send_interval * 1000UL)) {
    String base_path = "/devices/" + device_id + "/";
    String sensors_data_path = base_path + "sensors/sensors_data/";
    Firebase.RTDB.setInt(&fbdo, base_path + "avg_light", weighted_avg);
    Firebase.RTDB.setInt(&fbdo, base_path + "brightness", current_brightness);
    Firebase.RTDB.setInt(&fbdo, base_path + "timestamp", now / 1000);
    Firebase.RTDB.setInt(&fbdo, sensors_data_path + "sensor0", avg0);
    Firebase.RTDB.setInt(&fbdo, sensors_data_path + "sensor1", avg1);
    Firebase.RTDB.setInt(&fbdo, sensors_data_path + "sensor2", avg2);
    Firebase.RTDB.setInt(&fbdo, sensors_data_path + "sensor3", avg3);
    last_send = now;
  }
}
// setup
void setup() {
  Serial.begin(115200);
  // Robust WiFi connection (tries both networks forever until success)
  connectToWiFi();
  // PWM setup for ESP32 Arduino core 3.x
  ledcAttach(ledPin, 5000, 8); // attach pin, 5000 Hz, 8-bit resolution
  // Buffer initialization
  memset(buffer0, 0, sizeof(buffer0));
  memset(buffer1, 0, sizeof(buffer1));
  memset(buffer2, 0, sizeof(buffer2));
  memset(buffer3, 0, sizeof(buffer3));
  // Firebase
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("Ready");
}
// loop
void loop() {
  readAllSensors();
  readSettingsFromFirebase();
  int avg0 = calculateAverage(buffer0, sensor_buffer_time);
  int avg1 = calculateAverage(buffer1, sensor_buffer_time);
  int avg2 = calculateAverage(buffer2, sensor_buffer_time);
  int avg3 = calculateAverage(buffer3, sensor_buffer_time);
  int weighted_avg = calculateWeightedAverage(avg0, avg1, avg2, avg3);
  controlLED(weighted_avg);
  sendDataToFirebase(weighted_avg, avg0, avg1, avg2, avg3);
  delayMicroseconds(1000); // ~1 ms delay
}
