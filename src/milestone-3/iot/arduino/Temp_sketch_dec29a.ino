#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "DHT.h"
#include "time.h"

// --------- Wi-Fi ----------
#define WIFI_SSID     "ZTE_AE41F4"
#define WIFI_PASSWORD "3jTnq9Ttjm743345"

// --------- Firebase ----------
#define API_KEY       "AIzaSyDsbBYPMQn_lyCV8p6B3J5nT7R57V2JAN4"
#define DATABASE_URL  "https://comfort-mapping-default-rtdb.europe-west1.firebasedatabase.app/"

// Device user (Authentication -> Email/Password)
#define USER_EMAIL    "esp32@biclanet.demo"
#define USER_PASSWORD "testing"

// --------- Sensor ----------
#define DHTPIN 4          // you said you're using D4
#define DHTTYPE DHT11    
DHT dht(DHTPIN, DHTTYPE);

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastSend = 0;
const unsigned long SEND_EVERY_MS = 2000;

void setup() {
  Serial.begin(115200);
  delay(200);

  dht.begin();

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected!");

  // Optional: real timestamps (nice for "readings over time")
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  // Firebase config
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.reconnectWiFi(true);
  Firebase.begin(&config, &auth);

  Serial.println("Firebase begin.");
}

void loop() {
  if (millis() - lastSend < SEND_EVERY_MS) return;
  lastSend = millis();

  float h = dht.readHumidity();
  float t = dht.readTemperature(); // Celsius

  if (isnan(h) || isnan(t)) {
    Serial.println("DHT read failed (NaN). Check wiring/type.");
    return;
  }

  // timestamp (seconds since epoch). If NTP hasn't synced yet, it'll be 0-ish.
  time_t now = time(nullptr);

  FirebaseJson json;
  json.set("tempC", t);
  json.set("humidity", h);
  json.set("ts", (long)now);
  json.set("ms", (long)millis());

  // push() creates a unique key each time -> perfect for "store readings over time"
  String path = "/pods/pod1/readings";
  // push() creates a unique key each time -> perfect for "store readings over time"
if (Firebase.RTDB.pushJSON(&fbdo, "/pods/POD-A1/readings", &json)) {
  Serial.print("OK push: ");
  Serial.println(fbdo.pushName()); // the autoId key
} else {
  Serial.print("Firebase error: ");
  Serial.println(fbdo.errorReason());
}
}
