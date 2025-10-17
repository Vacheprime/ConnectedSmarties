/*********
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
const char* ssid = "iotvanier";
const char* password = "14730078";

// Add your MQTT Broker IP address, example:
const char* mqtt_server = "192.168.0.156";

// Define the topics for temperature and humidity publish
const char* tempTopic = "Frig1/temperature";
const char* humidityTopic = "Frig1/humidity";

// Define the topics for fan control
const char* controlTopic = "Frig1/fanControl";
const char* controlStatucTopic = "Frig1/fanControl/status";

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
  // default settings
  setup_wifi();
  client.setServer(mqtt_server, 1883);
}

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

void connect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP8266Client")) {
      Serial.println("connected");
      // Subscribe to topics
      client.subscribe(fanControlTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void msgReceivedCallback(const char[] topic, byte* payload, unsigned int length) {
  // Check subscribe topic
  if (strcmp(topic, fanControlTopic)) {
    // Convert payload to string
    std::string payloadStr(reinterpret_cast<const char*>(payload), length);
    
  }
}

void loop() {
  // Attempt to connect to the MQTT
  if (!client.connected()) {
    connect();
  }

  client.loop();

  // Read humidity and temperature
  float humi = dht.readHumidity();
  float temp = dht.readTemperature();
  // Format the temperature
  char tempString[8];
  dtostrf(temp, 6, 2, tempString);
  Serial.print("Temperature: ");
  Serial.println(tempString);

  // Publish the temperature
  client.publish(tempTopic, tempString);
    
  // Format the humidity
  char humString[8];
  dtostrf(humi, 6, 2, humString);
  Serial.print("Humidity: ");
  Serial.println(humString);

  // Publish the humidity
  client.publish(humidityTopic, humString);

  // Format fan status to control
  std::string fanStatusString = isFanOn ? "true" : "false";
  int arraySize = fanStatusString.length() + 1;
  char fanStatusArr[arraySize];
  strcpy(fanStatusArr, fanStatusString.c_str());

  // Publish
  client.publish(controlStatucTopic, fanStatusArr);
  Serial.print("Fan status: ");
  Serial.println(fanStatusArr);

  // Wait 2 seconds, and repeat
  delay(2000);
}