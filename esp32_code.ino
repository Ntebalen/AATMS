#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <Servo.h>

// Pin definitions
#define DHTPIN_AMBIENT 15         // Pin for ambient temperature DHT22
#define DHTPIN_TUNNEL 2           // Pin for inside tunnel DHT22
#define DHTTYPE DHT22             // Using DHT22 sensor type for both sensors
#define SOIL_MOISTURE_PIN 13      // Pin for soil moisture sensor (analog pin)
#define WATER_FLOW_PIN 4          // Pin for water flow sensor (digital pin)
#define SPRINKLER_RELAY_PIN 22    // Pin for relay to control the sprinkler
#define FAN_RELAY_PIN 18          // Pin for relay to control the fan
#define HEAT_RELAY_PIN 19         // Pin for relay to control the heat element
#define SERVO_PIN 5               // Pin for servo motor controlling the flapper
#define BUZZER_PIN 23             // Pin for buzzer to signal alarms
#define POTENTIOMETER_PIN 32      // Pin for potentiometer to select mode (Summer/Winter)
#define BUTTON_PIN_EN 0           // Pin for reset button to reset ESP32

// Create instances of sensors and actuators
DHT dhtAmbient(DHTPIN_AMBIENT, DHTTYPE);  // DHT for ambient temperature
DHT dhtTunnel(DHTPIN_TUNNEL, DHTTYPE);    // DHT for tunnel temperature and humidity
Servo flapperServo;                       // Servo motor to control airflow

// Global variables to store sensor readings
float ambientTemp = 0;       // Store ambient temperature
float tunnelTemp = 0;        // Store tunnel temperature
float tunnelHumidity = 0;    // Store tunnel humidity
int soilMoisture = 0;        // Store soil moisture level
volatile int waterFlowPulseCount = 0;  // Store pulse count for water flow sensor

// Wi-Fi credentials
const char* ssid = "your_SSID";          // Wi-Fi SSID
const char* password = "your_PASSWORD";  // Wi-Fi password
const char* serverName = "http://your_vercel_url/api/sensor"; // Server URL to post sensor data

// Interrupt function to count water flow pulses
void IRAM_ATTR countWaterFlowPulse() {
  waterFlowPulseCount++;  // Increment pulse count when water flow pulse is detected
}

void setup() {
  // Initialize serial communication
  Serial.begin(115200);

  // Initialize DHT sensors
  dhtAmbient.begin();  // Start ambient DHT sensor
  dhtTunnel.begin();   // Start tunnel DHT sensor

  // Attach servo to the servo pin
  flapperServo.attach(SERVO_PIN);

  // Configure sensor and actuator pins
  pinMode(SOIL_MOISTURE_PIN, INPUT);          // Set soil moisture sensor as input
  pinMode(WATER_FLOW_PIN, INPUT_PULLUP);      // Set water flow sensor as input with pull-up
  pinMode(SPRINKLER_RELAY_PIN, OUTPUT);       // Set sprinkler relay as output
  pinMode(FAN_RELAY_PIN, OUTPUT);             // Set fan relay as output
  pinMode(HEAT_RELAY_PIN, OUTPUT);            // Set heat element relay as output
  pinMode(BUZZER_PIN, OUTPUT);                // Set buzzer as output
  pinMode(POTENTIOMETER_PIN, INPUT);          // Set potentiometer as input

  // Attach interrupt to water flow sensor
  attachInterrupt(digitalPinToInterrupt(WATER_FLOW_PIN), countWaterFlowPulse, FALLING);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);  // Connect to Wi-Fi with credentials
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");  // Wait for connection
  }
  Serial.println("Connected to WiFi");  // Wi-Fi connected
}

void loop() {
  // Read sensor data
  ambientTemp = dhtAmbient.readTemperature();     // Read ambient temperature
  tunnelTemp = dhtTunnel.readTemperature();       // Read tunnel temperature
  tunnelHumidity = dhtTunnel.readHumidity();      // Read tunnel humidity
  soilMoisture = analogRead(SOIL_MOISTURE_PIN);   // Read soil moisture level

  // Handle potential sensor read errors
  if (isnan(ambientTemp) || isnan(tunnelTemp) || isnan(tunnelHumidity)) {
    Serial.println("Failed to read from DHT sensor!");  // Error handling for sensor
    return;  // Skip the rest of the loop if any sensor fails
  }

  // Handle water flow sensor reading
  noInterrupts();  // Disable interrupts temporarily while reading pulse count
  int pulseCount = waterFlowPulseCount;  // Store pulse count
  waterFlowPulseCount = 0;  // Reset pulse count
  interrupts();  // Re-enable interrupts

  // Calculate flow rate from water flow pulse count (example assumes 7.5 pulses per second per liter/minute)
  float flowRate = (pulseCount / 7.5);  

  // Read mode selection from potentiometer (Summer/Winter)
  int modeReading = analogRead(POTENTIOMETER_PIN);  // Read potentiometer value
  String mode = (modeReading > 2048) ? "Summer" : "Winter";  // Use threshold to determine mode

  // Define temperature thresholds based on the selected mode
  float tempThresholdHigh = (mode == "Summer") ? 30.0 : 24.0;  // High temperature threshold
  float tempThresholdLow = (mode == "Summer") ? 25.0 : 18.0;   // Low temperature threshold

  // Control fan based on tunnel temperature
  if (tunnelTemp > tempThresholdHigh) {
    digitalWrite(FAN_RELAY_PIN, HIGH);  // Turn fan ON if tunnel is too hot
  } else {
    digitalWrite(FAN_RELAY_PIN, LOW);   // Turn fan OFF if temperature is fine
  }

  // Control heat element based on tunnel temperature
  if (tunnelTemp < tempThresholdLow) {
    digitalWrite(HEAT_RELAY_PIN, HIGH);  // Turn heat ON if tunnel is too cold
  } else {
    digitalWrite(HEAT_RELAY_PIN, LOW);   // Turn heat OFF if temperature is fine
  }

  // Control flapper based on tunnel humidity
  if (tunnelHumidity > 70.0) {
    flapperServo.write(90);  // Open flapper to allow ventilation if humidity is too high
  } else {
    flapperServo.write(0);   // Close flapper if humidity is fine
  }

  // Control sprinkler valve based on soil moisture
  if (soilMoisture < 500) {  // Turn sprinkler ON if soil is dry (adjust threshold based on calibration)
    digitalWrite(SPRINKLER_RELAY_PIN, HIGH);  
  } else {
    digitalWrite(SPRINKLER_RELAY_PIN, LOW);   // Turn sprinkler OFF if soil is moist enough
  }

  // Prepare JSON payload for sending sensor data to the server
  StaticJsonDocument<200> doc;  // Create JSON document
  doc["sensorName"] = "Ambient Temperature";  // Add sensor name
  doc["value"] = ambientTemp;  // Add temperature value
  doc["mode"] = mode;  // Add current mode
  String jsonData;  // String to hold the serialized JSON data
  serializeJson(doc, jsonData);  // Serialize the JSON document into jsonData string

  // Send data to the server if Wi-Fi is connected
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;  // Create HTTP client
    http.begin(serverName);  // Specify the server URL
    http.addHeader("Content-Type", "application/json");  // Set content type as JSON

    int httpResponseCode = http.POST(jsonData);  // Send HTTP POST request with JSON payload
    if (httpResponseCode > 0) {
      String response = http.getString();  // Get the response from the server
      Serial.println(httpResponseCode);  // Print the response code
      Serial.println(response);  // Print the response from the server
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);  // Print error code if POST fails
    }
    http.end();  // End HTTP connection
  } else {
    Serial.println("WiFi Disconnected");  // Handle Wi-Fi disconnection
  }

  delay(2000);  // Wait 2 seconds before next loop iteration
}
