#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <math.h>
// kotori pishet vse
// -------------------------- Wi-Fi List --------------------------
struct WiFiNetwork {
  const char* ssid;
  const char* password;
};

WiFiNetwork wifiList[] = {
  {"MEO-2hzF96460", "FpxA9bv8"},
  {"Nothing32",     "212855625"}
};

int wifiCount = sizeof(wifiList) / sizeof(wifiList[0]);

// -------------------------- Firebase --------------------------
#define FIREBASE_HOST "booking-ee47f-default-rtdb.europe-west1.firebasedatabase.app"
#define FIREBASE_AUTH "m3uCFaiui2EXuQdpZGuuIgwgarKXH5lojbhUgF5b"

const String device_id = "Pod_01_Claw_01";

// -------------------------- Variables --------------------------
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

int send_interval = 10;
int sensor_buffer_time = 5;
float temp_coefficient = 1.0;
float sin_amplitude = 8.0;
float sin_period_minutes = 60.0;
float noise_amount = 1.5;

float base_temp = 22.0;
unsigned long start_time = 0;

float temp_sum = 0.0;
int reading_count = 0;

unsigned long last_fake_read = 0;
unsigned long last_send = 0;
unsigned long last_settings_read = 0;

void setup() {
  Serial.begin(115200);  // only for Wi-Fi messages

  connectToWiFi();

  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  start_time = millis();
  read_settings();
}

void loop() {
  unsigned long now = millis();

  // Generate fake data every 1 second
  if (now - last_fake_read >= 1000) {
    float current_temp = generate_fake_temperature();
    temp_sum += current_temp;
    reading_count++;
    last_fake_read = now;
  }

  // Send average to Firebase when buffer full
  if (reading_count > 0 && now - last_fake_read >= (sensor_buffer_time * 1000UL - 1000)) {
    if (Firebase.ready()) {
      float avg_temp = temp_sum / reading_count;

      String base_path = "devices/" + device_id + "/";

      // Send temperature (as before)
      Firebase.RTDB.setFloat(&fbdo, (base_path + "temperature").c_str(), avg_temp);
      Firebase.RTDB.setInt(&fbdo, (base_path + "raw_value").c_str(), (int)(avg_temp * 100));

      // NEW: Save the same averaged temperature to rtc
      Firebase.RTDB.setFloat(&fbdo, (base_path + "rtc").c_str(), avg_temp);

      send_ping();
    }

    temp_sum = 0.0;
    reading_count = 0;
  }

  // Send ping on interval
  if (now - last_send >= (send_interval * 1000UL)) {
    send_ping();
    last_send = now;
  }

  // Update settings every 10 seconds
  if (now - last_settings_read >= 10000) {
    read_settings();
    last_settings_read = now;
  }
}

// -------------------------- Functions --------------------------

float generate_fake_temperature() {
  unsigned long seconds_running = (millis() - start_time) / 1000;
  float period_seconds = sin_period_minutes * 60.0;

  float wave = sin_amplitude * sin(2.0 * PI * seconds_running / period_seconds);
  float noise = noise_amount * ((float)random(-1000, 1000) / 1000.0);

  float temp = base_temp + wave + noise;
  return temp * temp_coefficient;
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  bool connected = false;
  for (int i = 0; i < wifiCount; i++) {
    Serial.print("Trying Wi-Fi: ");
    Serial.println(wifiList[i].ssid);
    WiFi.begin(wifiList[i].ssid, wifiList[i].password);

    unsigned long start = millis();
    while (millis() - start < 10000) {
      if (WiFi.status() == WL_CONNECTED) {
        connected = true;
        break;
      }
      delay(500);
      Serial.print(".");
    }
    if (connected) break;
    Serial.println(" Failed");
    WiFi.disconnect();
    delay(1000);
  }

  if (connected) {
    Serial.println("");
    Serial.println("Wi-Fi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("No Wi-Fi connected!");
  }
}

void send_ping() {
  if (Firebase.ready()) {
    String base_path = "devices/" + device_id + "/";
    unsigned long now = millis();
    Firebase.RTDB.setInt(&fbdo, (base_path + "timestamp").c_str(), now / 1000);
  }
}

void read_settings() {
  String settings_path = "devices/" + device_id + "/settings/connection_package/";
  String rtc_path = "devices/" + device_id + "/rtc";

  // Handle rtc (only create if missing - we will overwrite it with temperature later)
  if (!Firebase.RTDB.pathExisted(&fbdo, rtc_path.c_str())) {
    Firebase.RTDB.setFloat(&fbdo, rtc_path.c_str(), 10.0);
  }

  // Handle connection_package settings
  if (!Firebase.RTDB.pathExisted(&fbdo, settings_path.c_str())) {
    Firebase.RTDB.setInt(&fbdo, (settings_path + "send_interval").c_str(), 10);
    Firebase.RTDB.setInt(&fbdo, (settings_path + "sensor_buffer_time").c_str(), 5);
    Firebase.RTDB.setFloat(&fbdo, (settings_path + "temp_coefficient").c_str(), 1.0);
    Firebase.RTDB.setFloat(&fbdo, (settings_path + "sin_amplitude").c_str(), 8.0);
    Firebase.RTDB.setFloat(&fbdo, (settings_path + "sin_period_minutes").c_str(), 60.0);
    Firebase.RTDB.setFloat(&fbdo, (settings_path + "noise_amount").c_str(), 1.5);

    send_interval = 10;
    sensor_buffer_time = 5;
    temp_coefficient = 1.0;
    sin_amplitude = 8.0;
    sin_period_minutes = 60.0;
    noise_amount = 1.5;
  } else {
    int val_int;
    float val_float;

    if (Firebase.RTDB.getInt(&fbdo, (settings_path + "send_interval").c_str(), &val_int)) {
      if (val_int > 0) send_interval = val_int;
    }
    if (Firebase.RTDB.getInt(&fbdo, (settings_path + "sensor_buffer_time").c_str(), &val_int)) {
      if (val_int > 0) sensor_buffer_time = val_int;
    }
    if (Firebase.RTDB.getFloat(&fbdo, (settings_path + "temp_coefficient").c_str(), &val_float)) {
      if (val_float > 0.5 && val_float < 1.5) temp_coefficient = val_float;
    }
    if (Firebase.RTDB.getFloat(&fbdo, (settings_path + "sin_amplitude").c_str(), &val_float)) {
      if (val_float > 0) sin_amplitude = val_float;
    }
    if (Firebase.RTDB.getFloat(&fbdo, (settings_path + "sin_period_minutes").c_str(), &val_float)) {
      if (val_float > 5) sin_period_minutes = val_float;
    }
    if (Firebase.RTDB.getFloat(&fbdo, (settings_path + "noise_amount").c_str(), &val_float)) {
      if (val_float >= 0) noise_amount = val_float;
    }
  }
}