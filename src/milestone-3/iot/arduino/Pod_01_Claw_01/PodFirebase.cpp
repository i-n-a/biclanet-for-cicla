#include "PodFirebase.h"

PodFirebase::PodFirebase(const char* host, const char* auth_token, const String& devicePath) {
  config.database_url = host;
  config.signer.tokens.legacy_token = auth_token;
  basePath = devicePath;
}

bool PodFirebase::begin(const char* wifi_ssid, const char* wifi_password) {
  WiFi.begin(wifi_ssid, wifi_password);
  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - start > 15000) return false;
  }
  Serial.println("\nWiFi connected");

  Firebase.begin(&config, &auth);
  return true;
}

void PodFirebase::reconnectWiFi(bool enable) {
  Firebase.reconnectWiFi(enable);
}

bool PodFirebase::ensurePathInt(const String& path, int defaultValue) {
  String fullPath = basePath + path;
  int val;
  if (!getInt(path, val)) {
    return setInt(path, defaultValue);
  }
  return true;
}

bool PodFirebase::setInt(const String& path, int value) {
  String fullPath = basePath + path;
  return Firebase.RTDB.setInt(&fbdo, fullPath.c_str(), value);
}

bool PodFirebase::getInt(const String& path, int& value) {
  String fullPath = basePath + path;
  if (Firebase.RTDB.getInt(&fbdo, fullPath.c_str(), &value)) {
    return true;
  }
  return false;
}

bool PodFirebase::setTimestamp(const String& path) {
  String fullPath = basePath + path;
  return Firebase.RTDB.setInt(&fbdo, fullPath.c_str(), millis() / 1000);
}

void PodFirebase::handle() {
  // Пока пусто, но можно добавить stream позже
}
