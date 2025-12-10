/*********
  DHT11 and MQTT Code from:
  https://www.electronicshub.org/esp32-dht11-tutorial/
  Rui Santos
  Complete project details at https://randomnerdtutorials.com  
*********/

#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <string>
#define DHT11PIN 25
DHT dht(DHT11PIN, DHT11);

// Replace the next variables with your SSID/Password combination
const char* ssid = "Pixel_7321";
const char* password = "Caillou99";

// Add your MQTT Broker IP address, example:
const char* mqtt_server = "172.27.145.245";

// Define the topics for temperature and humidity publish
const char* tempTopic = "Frig1/temperature";
const char* humidityTopic = "Frig1/humidity";

// Define the topics for fan control
const char* fanControlTopic = "Frig1/fanControl";
const char* fanStatusTopic = "Frig1/fanControl/status";

// Define the ID of the sensor
const int sensorId = 1;

// Define the pins for motor control
const int enablePin = 32;
const int input1 = 33;
const int input2 = 14;

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];
int value = 0;
bool isFanOn = false;

// LED Pin
const int ledPin = 26;

void setup() {
  // Setup serial bus
  Serial.begin(115200);
  dht.begin();

  // Setup motor pins
  pinMode(enablePin, OUTPUT);
  pinMode(input1, OUTPUT);
  pinMode(input2, OUTPUT);
  // Set Motor OFF by default
  digitalWrite(enablePin, LOW);

  // default settings
  setup_wifi();
  client.setServer(mqtt_server, 1883);

  // Run client loop in a separate task
  xTaskCreate(
    listenToControl,
    "listenToControl",
    10000,
    NULL,
    1,
    NULL
  );
}

// Connect to WiFi.
void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// Connect to the MQTT server.
void connect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP8266Client")) {
      Serial.println("connected");
      // Subscribe to topics
      client.subscribe(fanControlTopic);
      client.setCallback(msgReceivedCallback);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

// Callback function used to handle data received from the subscribed topics.
void msgReceivedCallback(const char* topic, byte* payload, unsigned int length) {
  // Check subscribe topic
  if (strcmp(topic, fanControlTopic) == 0) {
    // Convert payload to string
    std::string payloadStr(reinterpret_cast<const char*>(payload), length);

    if (payloadStr == "START") {
      // Enable motor
      digitalWrite(enablePin, HIGH);
      // Set direction
      digitalWrite(input1, HIGH);
      digitalWrite(input2, LOW);
      // Set motor enabled/disabled
      isFanOn = true;
    } else if (payloadStr == "STOP") {
      // Disable motor
      digitalWrite(enablePin, LOW);
      // Set direction
      digitalWrite(input1, LOW);
      digitalWrite(input2, LOW);
      // Set motor enabled/disabled
      isFanOn = false;
    }

    int arraySize = payloadStr.length() + 1;
    char payloadArr[arraySize];
    strcpy(payloadArr, payloadStr.c_str());

    Serial.println(payloadArr); // Print for test
    
  }
  Serial.println(topic);
}

// Separate task used to listen to fan controls.
void listenToControl(void *pvParameters) {
  while (true) {
    // Execute client loop if connected
    if (!client.connected()) {
      continue;
    }
    client.loop();
  }
}

// Run the main loop for reading the measurements and sending status
// updates.
void loop() {
  // Attempt to connect to the MQTT
  if (!client.connected()) {
    connect();
  }

  // Read humidity and temperature
  float humi = dht.readHumidity();
  float temp = dht.readTemperature();
  // Format the temperature
  char tempString[8];
  dtostrf(temp, 5, 2, tempString);

  // Format message
  snprintf(msg, sizeof(msg), "%d:%s", sensorId, tempString);

  Serial.print("Temperature: ");
  Serial.println(msg);

  // Publish the temperature
  client.publish(tempTopic, msg);
    
  // Format the humidity
  char humString[8];
  dtostrf(humi, 5, 2, humString);
  Serial.print("Humidity: ");
  Serial.println(humString);

  // Format message
  snprintf(msg, sizeof(msg), "%d:%s", sensorId, humString);

  // Publish the humidity
  client.publish(humidityTopic, msg);

  // Format fan status to control
  std::string fanStatusString = isFanOn ? "true" : "false";
  int arraySize = fanStatusString.length() + 1;
  char fanStatusArr[arraySize];
  strcpy(fanStatusArr, fanStatusString.c_str());

  // Format message
  snprintf(msg, sizeof(msg), "%d:%s", sensorId, fanStatusArr);

  // Publish
  client.publish(fanStatusTopic, msg);
  Serial.print("Fan status: ");
  Serial.println(fanStatusArr);

  // Wait 2 seconds, and repeat
  delay(2000);
}