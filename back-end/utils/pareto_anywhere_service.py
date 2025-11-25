import requests
import os
from typing import Dict, Any, Optional
from datetime import datetime

class ParetoAnywhereService:
    """Service for fetching ambient context data from Pareto Anywhere API."""
    
    def __init__(self, pareto_url: str = None):
        """
        Initialize the Pareto Anywhere service.
        
        Args:
            pareto_url (str): Base URL of Pareto Anywhere instance (e.g., http://raspberry-pi-ip:3001)
        """
        self.pareto_url = pareto_url or os.getenv('PARETO_ANYWHERE_URL', 'http://localhost:3001')
        self.timeout = 5  # Request timeout in seconds
    
    def get_devices(self) -> Dict[str, Any]:
        """
        Fetch all devices from Pareto Anywhere.
        
        Returns:
            dict: Response containing devices data
        """
        try:
            url = f"{self.pareto_url}/devices"
            response = requests.get(url, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to fetch devices from Pareto Anywhere: {e}")
            return {}
    
    def get_ambient_context(self, device_id: str = None) -> Dict[str, Any]:
        """
        Fetch ambient context data (temperature, humidity, lux, battery) from Pareto Anywhere.
        If no device_id is provided, attempts to get the first available device.
        
        Args:
            device_id (str): Optional device ID. If not provided, uses the first device.
            
        Returns:
            dict: Ambient context data with temperature, humidity, lux, and battery information
        """
        try:
            # Get all devices if no specific device is provided
            if not device_id:
                devices_data = self.get_devices()
                devices = devices_data.get('devices', {})
                
                if not devices:
                    print("WARNING: No devices found in Pareto Anywhere")
                    return self._get_empty_context()
                
                # Use the first device found
                device_id = list(devices.keys())[0]
                print(f"Using device: {device_id}")
            
            url = f"{self.pareto_url}/devices/{device_id}"
            response = requests.get(url, timeout=self.timeout)
            response.raise_for_status()
            device_data = response.json()
            
            # Parse the ambient context data
            return self._parse_ambient_context(device_data)
            
        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to fetch ambient context from Pareto Anywhere: {e}")
            return self._get_empty_context()
        except Exception as e:
            print(f"ERROR: Failed to parse ambient context: {e}")
            return self._get_empty_context()
    
    def _parse_ambient_context(self, device_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse device data from Pareto Anywhere and extract ambient context.
        
        Args:
            device_data (dict): Device data from Pareto Anywhere API
            
        Returns:
            dict: Formatted ambient context data
        """
        properties = device_data.get('properties', {})
        
        # Extract temperature (in Celsius)
        temperature = properties.get('temperature', None)
        if temperature is not None:
            temperature = float(temperature) / 100 if isinstance(temperature, (int, float)) and temperature > 100 else float(temperature)
        else:
            temperature = None
        
        # Extract humidity (as percentage)
        humidity = properties.get('humidity', None)
        if humidity is not None:
            humidity = float(humidity) / 100 if isinstance(humidity, (int, float)) and humidity > 100 else float(humidity)
        else:
            humidity = None
        
        # Extract illuminance/lux
        lux = properties.get('illuminance', None)
        if lux is not None:
            lux = float(lux)
        else:
            lux = None
        
        # Extract battery percentage
        battery = properties.get('battery', None)
        if battery is not None:
            battery = float(battery)
        else:
            battery = None
        
        # Get current time
        current_time = datetime.now().strftime("%H:%M:%S")
        
        return {
            "success": True,
            "timestamp": current_time,
            "temperature": temperature,
            "humidity": humidity,
            "lux": lux,
            "battery": battery,
            "device_id": device_data.get('id', 'unknown')
        }
    
    def _get_empty_context(self) -> Dict[str, Any]:
        """
        Return an empty context structure when data is unavailable.
        
        Returns:
            dict: Empty ambient context data
        """
        return {
            "success": False,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "temperature": None,
            "humidity": None,
            "lux": None,
            "battery": None,
            "device_id": None
        }
