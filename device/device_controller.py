import RPi.GPIO as GPIO
import time


class DeviceController:
	"""
	The DeviceController class is used to represent the IoT Connected
	object that will be used for the checkout system.
	
	Parameters:
			success_pin (int): the output pin connected to the success circuit.
			error_pin (int): the output pin connected to the error circuit.
	"""
	def __init__(self, success_pin, error_pin):
		self.success_pin = success_pin
		self.error_pin = error_pin
		self._init_GPIO()
		
	def _init_GPIO(self):
		"""
		Initialize the GPIO connection.
		"""
		# Setup Board
		GPIO.setwarnings(False)
		GPIO.setmode(GPIO.BCM)
		# Setup Pins
		GPIO.setup(self.success_pin, GPIO.OUT)
		GPIO.setup(self.error_pin, GPIO.OUT)
		
	
	def indicateSuccess(self, duration = 0.5):
		"""
		Activate the success circuit for the duration specified.
		
		Args:
			duration (float): the duration during which the success circuit will be activated.
		"""
		GPIO.output(self.success_pin, GPIO.HIGH)
		time.sleep(duration)
		GPIO.output(self.success_pin, GPIO.LOW)
	
	
	def indicateError(self, duration = 0.5):
		"""
		Activate the error circuit for the duration specified.
		
		Args:
			duration (float): the duration during which the error circuit will be activated.
		"""
		GPIO.output(self.error_pin, GPIO.HIGH)
		time.sleep(duration)
		GPIO.output(self.error_pin, GPIO.LOW)
