import paho.mqtt.client as mqtt

class MQTTService:
    
    def __init__(self, server, port = 1883):
        # Save server and port
        self.mqtt_server = server
        self.port = port
        
        # Create a new client
        self.mqtt_client = mqtt.Client()
        # Attempt to connect
        self._setup_mqtt_connection()
    

    def _setup_mqtt_connection(self):
        # Attempt to connect
        self.mqtt_client.connect(self.mqtt_server, self.port)
        # Configure reconnects
        self.mqtt_client.reconnect_delay_set(min_delay=1, max_delay=5)
        self.mqtt_client.on_connect = self._on_connect
        # Setup subscriber callbacks
        self._setup_topic_callbacks()
        # Start loop
        self.mqtt_client.loop_start()
    

    def _setup_topic_callbacks(self):
        pass
    

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"Connected to MQTT server at address/host: {self.mqtt_server} , port: {self.port}")
        else:
            print(f"Failed to connect to the MQTT server. Code: {rc}")
             
        
    def _receive_frige_1_temp():
        



