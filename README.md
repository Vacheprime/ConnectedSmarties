# ConnectedSmarties - Installation and Usage Instructions

## Step 1: Set up the Server Environment

### 1. Clone the Repository

```bash
git clone https://github.com/Vacheprime/ConnectedSmarties.git
cd ConnectedSmarties
```

### 2. Install the Python Dependencies

```bash
pip install -r requirements.txt
```

(Note: Ensure requirements.txt includes: flask, flask-cors, paho-mqtt, qrcode, pillow, requests, etc.)

### 3. Set up MQTT Broker

- Install and start the Mosquitto MQTT Instance on your server

### 4. Database Initialization

- Run the necessary script to create the initial SQLite3 database schema (Customers, Products, Payments, Inventory, etc.)

- Run this command in the Command Prompt Terminal:

``` cmd
sqlite3 sql_connected_smarties.db < sql_connected_smarties.sql
```

### 5. Start the Python Flask Web Server

```bash
python app.py
```

or

``` bash
flask run --port=5001 
```

## Step 2: Hardware and Firmware Setup (ESP32)

### 1. Install Arduino IDE v2

- Ensure you have the IDE and the required board drivers (e.g., CH340 driver) installed

### 2. Inatall the Arduino Libraries:

- Install the following lobraries required for the ESP32 firmware:
  - ESP32 boards
  - Adafruit Unified Sensor
  - DHT sensor library
  - PubSubClient

### 3. Wiring

- Connect the DHT11 Sensor and the DC Motor/Fan (with L293D motor IC) to the ESP32 board

### 4. Upload the Firmware

- Open the C++ code for the microcontroller, update the Wi-fi and MQTT connection credentials, and upload it to the ESP32 board. This will enable it to publish sensor data and receive control signals.

## Step 3: Access the Application

1. Open your Web Browser and navigate to the server address (e.g., <http://127.0.0.1:5001>).

2. Log in as an Admin to access the Mission Control Dashboard for monitoring and management.

3. New customers can register and use the Self-Checkout Station
