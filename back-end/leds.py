from flask import Flask
import RPi.GPIO as GPIO
import time

# Tutorial: https://youtu.be/6jDyr0ydBgU?list=PLLSegLrePWgLzBgQqDJvgZ4ewbpCnuare 

app = Flask(__name__) 

## Create route (right niow we have the route for the "main page" -> "/")
# @app.route("/")

## Testing:
# def index():
#     return "<p>Hola, testing!</p>"

## To run the app (the port parameter is optional and is set to 5000 by default):
# app.run(host="0.0.0.0, port=8500")

### Flask server listens for signals from PHP and controls the GPIO pins ###
LED_BLUE = 16
LED_RED = 27
BUZZER = 22

GPIO.setmode(GPIO.BCM)
GPIO.setup(LED_BLUE, GPIO.OUT)
GPIO.setup(LED_RED, GPIO.OUT)
GPIO.setup(BUZZER, GPIO.OUT)

@app.route("/success")
def success():
    GPIO.output(LED_RED, GPIO.LOW)
    GPIO.output(BUZZER, GPIO.LOW)
    GPIO.output(LED_BLUE, GPIO.HIGH)
    return "Successfully added new customer!"

@app.route("/fail")
def fail():
    GPIO.output(LED_BLUE, GPIO.LOW)
    GPIO.output(LED_RED, GPIO.HIGH)
    GPIO.output(BUZZER, GPIO.HIGH)
    time.sleep(2)
    return "Failed to add new customer..."

if __name__ == '__main__':
    # Start Flask web server 
    app.run(host='0.0.0.0')