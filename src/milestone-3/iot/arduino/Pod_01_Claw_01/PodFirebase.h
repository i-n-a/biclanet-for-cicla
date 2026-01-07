#ifndef POD_FIREBASE_H
#define POD_FIREBASE_H

#include <WiFi.h>
#include <Firebase_ESP_Client.h>

class PodFirebase {
  private:
    FirebaseData fbdo;
    FirebaseAuth auth;
    FirebaseConfig config;
    String basePath;

  public:
    PodFirebase(const char* host, const char* auth_token, const String& devicePath);
    bool begin(const char* wifi_ssid, const char* wifi_password);
    void reconnectWiFi(bool enable);
    
    bool ensurePathInt(const String& path, int defaultValue);
    bool setInt(const String& path, int value);
    bool getInt(const String& path, int& value);
    
    bool setTimestamp(const String& path);
    void handle();  // вызов в loop для поддержания соединения
};

#endif
