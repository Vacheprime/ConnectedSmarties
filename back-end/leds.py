import RPi.GPIO as GPIO
import time

## GPIO PIN Config ##
SUCCESS_CIRCUIT = 21
ERROR_CIRCUIT = 20

GPIO.setmode(GPIO.BCM)
GPIO.setup(SUCCESS_CIRCUIT, GPIO.OUT)
GPIO.setup(ERROR_CIRCUIT, GPIO.OUT)


def success():
    GPIO.output(SUCCESS_CIRCUIT, GPIO.HIGH)
    time.sleep(0.5)
    GPIO.output(SUCCESS_CIRCUIT, GPIO.LOW)


def fail():
    GPIO.output(ERROR_CIRCUIT, GPIO.HIGH)
    time.sleep(0.5)
    GPIO.output(ERROR_CIRCUIT, GPIO.LOW)