#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// WiFi
//const char* ssid = "MEO-2hzF96460";
//const char* password = "FpxA9bv8";
const char* ssid = "Nothing32";
const char* password = "212855625";

// Firebase
#define FIREBASE_HOST "booking-ee47f-default-rtdb.europe-west1.firebasedatabase.app"
#define FIREBASE_AUTH "m3uCFaiui2EXuQdpZGuuIgwgarKXH5lojbhUgF5b"

// Имя устройства
const String device_id = "Pod_01_base_01";

// Пины
const int sensorPin0 = 34;
const int sensorPin1 = 35;
const int sensorPin2 = 32;
const int sensorPin3 = 33;
const int ledPin = 25;

// Максимальный размер буфера
const int max_buffer_size = 600;

// Структура для чтения + времени
struct Reading {
  int value;
  unsigned long timestamp;
};

Reading buffer0[max_buffer_size];
Reading buffer1[max_buffer_size];
Reading buffer2[max_buffer_size];
Reading buffer3[max_buffer_size];
int buffer_index = 0;

// Настройки (начальные)
int min_light = 0;
int target_light = 1000;
int light_threshold = 1300;
int send_interval = 5;
int qty_reading_sensors_in_second = 10;
int sensor_buffer_time = 5;
int manual_override = 0;
int manual_toggle = 0;

// Веса датчиков 0.0 - 1.0
float sensor0_weight = 1.0;
float sensor1_weight = 1.0;
float sensor2_weight = 1.0;
float sensor3_weight = 1.0;

// Таймеры
unsigned long last_sensor_read = 0;
unsigned long last_settings_read = 0;
unsigned long last_send = 0;
int read_delay = 100;

// Яркость
int current_brightness = 0;

// Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// === Функция: Чтение одного датчика и запись в буфер ===
void readAndStoreSensor(int pin, Reading buffer[], int index) {
  buffer[index].value = analogRead(pin);
  buffer[index].timestamp = millis();
}

// === Функция: Чтение всех датчиков ===
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

// === Функция: Расчёт среднего за последние N секунд ===
int calculateAverage(Reading buffer[], int window_seconds) {
  unsigned long now = millis();
  unsigned long window_start = now - (window_seconds * 1000);

  long sum = 0;
  int count = 0;
  int i;
  for (i = 0; i < max_buffer_size; i++) {
    if (buffer[i].timestamp >= window_start && buffer[i].timestamp > 0) {
      sum = sum + buffer[i].value;
      count = count + 1;
    }
  }
  if (count == 0) return 0;
  return sum / count;
}

// === Функция: Расчёт взвешенного среднего ===
int calculateWeightedAverage(int a0, int a1, int a2, int a3) {
  float total_weight = sensor0_weight + sensor1_weight + sensor2_weight + sensor3_weight;
  if (total_weight == 0) total_weight = 1;
  return (a0 * sensor0_weight + a1 * sensor1_weight + a2 * sensor2_weight + a3 * sensor3_weight) / total_weight;
}

// === Функция: Управление яркостью LED ===
void controlLED(int weighted_avg) {
  int brightness = 0;
  if (manual_override == 1) {
    if (manual_toggle == 1) {
      brightness = 255;
    } else {
      brightness = 0;
    }
  } else {
    if (weighted_avg < light_threshold) {
      brightness = (light_threshold - weighted_avg) * 255 / (light_threshold - min_light);
      if (brightness < 0) brightness = 0;
      if (brightness > 255) brightness = 255;

      int error = target_light - weighted_avg;
      brightness = brightness + error / 20;
      if (brightness < 0) brightness = 0;
      if (brightness > 255) brightness = 255;
    }
  }
  ledcWrite(ledPin, brightness);
  current_brightness = brightness;
}

// === Функция: Чтение настроек из Firebase ===
void readSettingsFromFirebase() {
  unsigned long now = millis();
  if (now - last_settings_read >= 10000) {
    String light_path = "devices/" + device_id + "/settings/light_mapping/";
    String conn_path = "devices/" + device_id + "/settings/connection_package/";
    String mode_path = "devices/" + device_id + "/settings/light_mode/";
    String weights_path = light_path + "sensor_weights/";

    Firebase.RTDB.getInt(&fbdo, light_path + "min_light", &min_light);
    Firebase.RTDB.getInt(&fbdo, light_path + "target_light", &target_light);
    Firebase.RTDB.getInt(&fbdo, light_path + "light_threshold", &light_threshold);

    Firebase.RTDB.getFloat(&fbdo, weights_path + "sensor0_weight", &sensor0_weight);
    Firebase.RTDB.getFloat(&fbdo, weights_path + "sensor1_weight", &sensor1_weight);
    Firebase.RTDB.getFloat(&fbdo, weights_path + "sensor2_weight", &sensor2_weight);
    Firebase.RTDB.getFloat(&fbdo, weights_path + "sensor3_weight", &sensor3_weight);

    Firebase.RTDB.getInt(&fbdo, conn_path + "send_interval", &send_interval);
    Firebase.RTDB.getInt(&fbdo, conn_path + "qty_reading_sensors_in_second", &qty_reading_sensors_in_second);
    Firebase.RTDB.getInt(&fbdo, conn_path + "sensor_buffer_time", &sensor_buffer_time);

    Firebase.RTDB.getInt(&fbdo, mode_path + "manual_override", &manual_override);
    Firebase.RTDB.getInt(&fbdo, mode_path + "manual_toggle", &manual_toggle);

    read_delay = 1000 / qty_reading_sensors_in_second;
    if (read_delay < 10) read_delay = 10;

    last_settings_read = now;
  }
}

// === Функция: Отправка данных в Firebase ===
void sendDataToFirebase(int weighted_avg, int avg0, int avg1, int avg2, int avg3) {
  unsigned long now = millis();
  if (now - last_send >= (send_interval * 1000)) {
    String base_path = "devices/" + device_id + "/";

    Firebase.RTDB.setInt(&fbdo, base_path + "avg_light", weighted_avg);
    Firebase.RTDB.setInt(&fbdo, base_path + "brightness", current_brightness);
    Firebase.RTDB.setInt(&fbdo, base_path + "timestamp", now / 1000);

    String sensors_data_path = base_path + "sensors/sensors_data/";
    Firebase.RTDB.setInt(&fbdo, sensors_data_path + "sensor0", avg0);
    Firebase.RTDB.setInt(&fbdo, sensors_data_path + "sensor1", avg1);
    Firebase.RTDB.setInt(&fbdo, sensors_data_path + "sensor2", avg2);
    Firebase.RTDB.setInt(&fbdo, sensors_data_path + "sensor3", avg3);

    last_send = now;
  }
}

// === setup ===
void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");

  ledcAttach(ledPin, 5000, 8);

  // Буфер нулями
  int i;
  for (i = 0; i < max_buffer_size; i++) {
    buffer0[i].value = 0;
    buffer0[i].timestamp = 0;
    buffer1[i].value = 0;
    buffer1[i].timestamp = 0;
    buffer2[i].value = 0;
    buffer2[i].timestamp = 0;
    buffer3[i].value = 0;
    buffer3[i].timestamp = 0;
  }

  // Firebase
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Ready");
}

// === loop ===
void loop() {
  unsigned long now = millis();

  readAllSensors();

  readSettingsFromFirebase();

  // Расчёт средних за окно
  int avg0 = calculateAverage(buffer0, sensor_buffer_time);
  int avg1 = calculateAverage(buffer1, sensor_buffer_time);
  int avg2 = calculateAverage(buffer2, sensor_buffer_time);
  int avg3 = calculateAverage(buffer3, sensor_buffer_time);

  int weighted_avg = calculateWeightedAverage(avg0, avg1, avg2, avg3);

  controlLED(weighted_avg);

  sendDataToFirebase(weighted_avg, avg0, avg1, avg2, avg3);

  delayMicroseconds(1000);  // 1 мс
}