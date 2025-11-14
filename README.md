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
- (fix ui for humidity) + pareto anywhere
  - In having pareto-anywhere running in the background make another card in the dashboard that shows the same dashboard for humidity but in a small card in the home.html.
  - For the UI in the home.html, add 1 envelop icon that says that the email is sent, add a threshold indicator and a small card where we can edit the threshold, it must also work with the back end too when lik when the threshold is edited it uses the new value as the threshold.
  - Have everything in the dashboard in 1 row.
  - add a "single product delete" functionality in the selfcheckout.html in order to remove a single product on the scanned list.
#### Florence 
- product management system
    - tracking product inventory
- create account
- login (to check history and accumulated points)
- receipts
