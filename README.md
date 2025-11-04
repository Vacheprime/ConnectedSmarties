# ConnectedSmarties Meeting Notes

## Oct 24 2025

Florence:

- routes for getting the pages dashboard, customers, products, reports
creating customer, and product (input validation)

- notifications when invalid input (conditional HTML in the Templates)

+ route for fetching sensor data /sensors/1/values

+ sending emails when temperature exceeds the threshold

Ishi:
    + possibly adjust UI javascript to refresh the values of the sensors in real time
    products database implementation (wait for  route for fetching sensor data /sensors/1/values
    )
    - client-side validation
    sending email when threshold exceeded (MUST BE CONNECTED TO MQTT!!!!!!!!!!!!!!!!!!!!)
        - python code for sending an email and with activated button but no code for threshold yet
    + code for activating the sensor (button in the email)

    + route for turning fan on /fan/on and /fan/off

Danat:
    * microcontroller code with mosquitto
    * microcontoller -> mosquitto -> mqtt_connector -> database -> webapp


Order:
1) 

## Nov 4, 2025 
#### Danat: 
- SDK
- email (receipt and QR for customer)
- payment simulation
#### Ishi: 
- I18LN (bilingual) -> THIS IS A BONUS FEATURE
- UI
- design for the self-checkout
- (fix ui for humidity)
#### Florence 
- product management system
    - tracking product inventory
- create account
- login (to check history and accumulated points)
