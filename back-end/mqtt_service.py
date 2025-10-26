import paho.mqtt.client as mqtt
from .utils.validation_utils import ValidationUtils
from models.sensor_data_point_model import SensorDataPoint

class MQTTService:
    
    def __init__(self, server, port = 1883):
        # Save server and port
        self.mqtt_server = server
        self.port = port
        
        # Callback for threshold checking (will be set by app.py)
        self.threshold_callback = None
        
        self.is_connected = False
        
        # Create a new client
        self.mqtt_client = mqtt.Client(client_id="MQTTService")
        # Attempt to connect
        self._setup_mqtt_connection()
    
    def set_threshold_callback(self, callback):
        """Set the callback function for threshold checking."""
        self.threshold_callback = callback

    def _setup_mqtt_connection(self):
        try:
            # Set on event handlers
            self.mqtt_client.on_connect = self._on_connect
            # Configure reconnects
            self.mqtt_client.reconnect_delay_set(min_delay=1, max_delay=5)
            # Attempt to connect
            self.mqtt_client.connect(self.mqtt_server, self.port)
            # Setup subscriber callbacks
            self._setup_topic_callbacks()
            # Start loop
            self.mqtt_client.loop_start()
            self.is_connected = True
            print(f"INFO: MQTT connection initiated to {self.mqtt_server}:{self.port}")
        except Exception as e:
            print(f"WARNING: Could not connect to MQTT broker at {self.mqtt_server}:{self.port}")
            print(f"WARNING: MQTT features will be disabled. Error: {e}")
            print(f"INFO: Flask app will continue running without MQTT functionality")
            self.is_connected = False
    
    def _setup_topic_callbacks(self):
        self.mqtt_client.subscribe("Frig1/#")
        self.mqtt_client.message_callback_add("Frig1/#", self._receive_frige1_sensor_data)
        self.mqtt_client.subscribe("Frig2/#")
        self.mqtt_client.message_callback_add("Frig2/#", self._receive_fridge2_sensor_data)
    

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"Connected to MQTT server at address/host: {self.mqtt_server} , port: {self.port}")
        else:
            print(f"Failed to connect to the MQTT server. Code: {rc}")
             
        
    def _receive_frige1_sensor_data(self, client, userdata, message):
        # Map the sensor type
        sensor_type = None
        topic = message.topic

        if topic == "Frig1/temperature":
            sensor_type = "temperature"
        elif topic == "Frig1/humidity":
            sensor_type = "humidity"
        elif topic == "Frig1/fanControl/status":
            sensor_type = "fan_status"
        elif topic == "Frig1/fanControl":
            return # Ignore fanControl commands
        else:
            print(f"Unrecognized topic: {topic}")
            return
        
        # Decode the data as string
        sensor_value = message.payload.decode()

        # Check for sensor type and validate sensor value
        if sensor_type == "temperature":
            if not ValidationUtils.is_string_numeric(sensor_value, 0):
                print(f"WARNING: Invalid sensor data received: {sensor_value}")
                return # Do not insert in DB
        elif sensor_type == "humidity":
            if not ValidationUtils.is_string_numeric(sensor_value, 0) or float(sensor_value) > 100:
                print(f"WARNING: Invalid sensor data received: {sensor_value}")
                return # Do not insert in DB
        elif sensor_type == "fan_status":
            if not ValidationUtils.is_boolean(sensor_value):
                print(f"WARNING: Invalid sensor data received: {sensor_value}")
                return # Do not insert in DB
            sensor_value = sensor_value.lower()
        
        print(f"INFO: Received sensor value from Fridge 1 '{sensor_value}' on topic '{topic}'")
        
        try:
            sensor_data_point = SensorDataPoint(sensor_id=1, data_type=sensor_type, value=sensor_value)
            SensorDataPoint.insert_sensor_data_point(sensor_data_point)
            print(f"INFO: Saved Frig1 {sensor_type} data to database: {sensor_value}")
            
            if sensor_type == "temperature" and self.threshold_callback:
                self.threshold_callback(1, float(sensor_value), "Frig1")
                
        except Exception as e:
            print(f"ERROR: Failed to save sensor data to database: {e}")
    

    def _receive_fridge2_sensor_data(self, client, userdata, message):
        # Map the sensor type
        sensor_type = None
        topic = message.topic

        if topic == "Frig2/temperature":
            sensor_type = "temperature"
        elif topic == "Frig2/humidity":
            sensor_type = "humidity"
        elif topic == "Frig2/fanControl/status":
            sensor_type = "fan_status"
        elif topic == "Frig2/fanControl":
            return # Ignore fanControl commands
        else:
            print(f"Unrecognized topic: {topic}")
            return
        
        # Decode the data as string
        sensor_value = message.payload.decode()

        # Check for sensor type and validate sensor value
        if sensor_type == "temperature":
            if not ValidationUtils.is_string_numeric(sensor_value, 0):
                print(f"WARNING: Invalid sensor data received: {sensor_value}")
                return # Do not insert in DB
        elif sensor_type == "humidity":
            if not ValidationUtils.is_string_numeric(sensor_value, 0) or float(sensor_value) > 100:
                print(f"WARNING: Invalid sensor data received: {sensor_value}")
                return # Do not insert in DB
        elif sensor_type == "fan_status":
            if not ValidationUtils.is_boolean(sensor_value):
                print(f"WARNING: Invalid sensor data received: {sensor_value}")
                return # Do not insert in DB
            sensor_value = sensor_value.lower()
        else:
            return # Unrecognised sensor type, do not insert
        
        print(f"INFO: Received sensor value from fridge 2 '{sensor_value}' on topic '{topic}'")
        
        try:
            sensor_data_point = SensorDataPoint(sensor_id=2, data_type=sensor_type, value=sensor_value)
            SensorDataPoint.insert_sensor_data_point(sensor_data_point)
            print(f"INFO: Saved Frig2 {sensor_type} data to database: {sensor_value}")
            
            if sensor_type == "temperature" and self.threshold_callback:
                self.threshold_callback(2, float(sensor_value), "Frig2")
                
        except Exception as e:
            print(f"ERROR: Failed to save sensor data to database: {e}")
    

    def ActivateFan(self, topic: str) -> None:
        """
        Activate the fan of a fridge.

        Args:
            topic (str): The control topic that the device controlling the fan is subscribed to.
        """
        if not self.is_connected:
            print("WARNING: Cannot activate fan - MQTT broker not connected")
            return
            
        # Define qos = 1 -> device will receive the message at least once
        qos = 1

        # Publish activation
        self.mqtt_client.publish(topic, "START", qos=qos)
    

    def DeactivateFan(self, topic: str) -> None:
        """
        Deactivate the fan of a fridge.

        Args:
            topic (str): The control topic that the device controlling the fan is subscribed to.
        """
        if not self.is_connected:
            print("WARNING: Cannot deactivate fan - MQTT broker not connected")
            return
            
        # Define qos = 1 -> device will receive the message at least once
        qos = 1

        # Publish deactivation
        self.mqtt_client.publish(topic, "STOP", qos=qos)
