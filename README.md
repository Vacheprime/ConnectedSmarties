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
  
## Nov 18, 2025 
### Danat:
#### 2.1+ Admin Reports:
- Inventory
    - Required Features
         Current number of available items for each product.
      
         Real-time updates if inventory changes due to purchases.

         Optional: Stock-level alerts (e.g., "Low stock: less than 5 units") 
- Sales (sold items)
    1. Number of sold items per product within a given time range.
    2. Most sold items and least sold items during a selected period.
    3. Total sales value for:
        o A specific day
        o A selected date range
    - Optional Enhancements
         Sales trends graph (line chart by day/week).
      
         Category-based filters.
- Customer
  Required Features
    - Number of customers who made purchases in:
        o A selected day
        o A selected date range
    - Overview of new vs. returning customers (optional) 
#### 4.2. Notification & Messaging Management
Examples:
     Low stock alerts
    
     Purchase confirmation messages
    
     System updates and error notifications 
### Ishi
#### 2.0 Report Generation Module
Your system must generate multiple types of reports for both administrators and customers.
The format, style, visualizations, and interaction flow of these reports are flexible and will
influence `your final grade—more intuitive and visually appealing designs are encouraged`.
You may use:
     Tables
    
     Bar charts / Pie charts / Line graphs
    
     Filters (date range, product category, customer ID, etc.)
#### 4.1. Finalizing the GUI Style
     Consistent fonts, colors, spacing
    
     Clear hierarchy and intuitive layout
    
     Mobile responsiveness (optional but beneficial)
#### 4.3. Theme Support
 Light and Dark mode

 Custom theme settings
### Florence
- help Ishi for `exporting options` (e.g. PDF, CSV, or screenshots—optional ) 
#### 3.2. Total Purchase Amount
The account page must display:
     Total amount spent during a selected period.
    
     Optional: Summary graph of spending over time.
#### 3.3. Search in Purchase History
Customers must be able to search for a specific item and view:
     How many times it was purchased
    
     Dates and times of purchase
    
     Price of the item for each purchase instance
##### Example Search Output
Item: Smart Plug
Purchased: 3 times
Details:
     2025-02-04 @ 09:22 – $14.99
    
     2025-02-10 @ 18:14 – $14.99
    
     2025-03-01 @ 11:03 – $12.99
#### 4.4. Any Additional Features
Examples:
     Exportable reports
    
     Dashboard widgets 


## Nov 30, 2025
     Make the Input Validations more robust (on Register)

## Nov 28, 2025

Tasks to do:

- Implement the database for EPC (Danat, COMPLETED)

- Implement proper input validation

- In the Account page, add a navigation button to go back to self-checkout

- In the self-checkout, after you pay, the rewards points won field is not being reset.

- Email configuration is disorganized. Sending an email should also run in background so it doesn't look like it freezes. (Danat)

- Adding products by EPC or by range. (Danat)

- Implement inventory report

- Fix the weird bug with reports because of Product database change.

- Fix the search in purchase history method.

- Fix the exports for the reports and for the receipts

- (Optional): Fix I18N glitching sometimes

- Check the sensor stuff

- Do multiple reading of RFID possibly.

- Send email when adding a customer through the admin customer page.

- Fix ParetoAnywhere bug where the data flickers when the backend cannot connect.
