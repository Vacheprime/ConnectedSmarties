# THIS CODE IS USED TO RECEIVE FORM DATA FROM THE HTML 
from flask import Flask, render_template, request, g, jsonify
from flask_cors import CORS
import sqlite3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from validators import validate_customer, validate_product
    from mqtt_service import MQTTService
    from utils.email_service import EmailService
    from models.sensor_model import Sensor
    from models.sensor_data_point_model import SensorDataPoint
except ImportError:
    from .validators import validate_customer, validate_product
    from .mqtt_service import MQTTService
    from .utils.email_service import EmailService
    from models.sensor_model import Sensor
    from models.sensor_data_point_model import SensorDataPoint

app = Flask(__name__)
CORS(app)

# Initialize db in way that db path won't break if Flask is running on a different working directory
# After pulling, run this: sqlite3 your_database_name.db < your_script.sql
db_path = os.path.join(os.path.dirname(__file__), "..", "db", "sql_connected_smarties.db")

# Make the path absolute
db_path = os.path.abspath(db_path)

mqtt_broker = os.getenv('MQTT_BROKER', 'localhost')
mqtt_port = int(os.getenv('MQTT_PORT', '1883'))
mqtt_service = MQTTService(mqtt_broker, mqtt_port)

email_service = EmailService()

# Temperature thresholds for alerts (in Celsius)
TEMP_THRESHOLD_HIGH = 25.0  # Alert if temperature exceeds this
TEMP_THRESHOLD_LOW = -5.0   # Alert if temperature drops below this

def check_temperature_threshold(sensor_id: int, temperature: float, location: str):
    """
    Check if temperature exceeds thresholds and send email alert if needed.
    
    Args:
        sensor_id (int): ID of the sensor
        temperature (float): Current temperature reading
        location (str): Location of the sensor (e.g., "Frig1")
    """
    if temperature > TEMP_THRESHOLD_HIGH:
        print(f"WARNING: Temperature threshold exceeded for {location}: {temperature}°C > {TEMP_THRESHOLD_HIGH}°C")
        email_service.send_threshold_alert(location, "temperature", temperature, TEMP_THRESHOLD_HIGH, sensor_id)
    elif temperature < TEMP_THRESHOLD_LOW:
        print(f"WARNING: Temperature threshold exceeded for {location}: {temperature}°C < {TEMP_THRESHOLD_LOW}°C")
        email_service.send_threshold_alert(location, "temperature", temperature, TEMP_THRESHOLD_LOW, sensor_id)

mqtt_service.set_threshold_callback(check_temperature_threshold)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = sqlite3.connect(db_path)
        db.row_factory = sqlite3.Row # access rows by the column names
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# ============= PAGE ROUTES =============
        
# get the HTML page        
@app.route("/", methods=["GET"])
def get_home_page():
    # Note: by default, Flask looks for HTML files inside folder named templates
    return render_template('home.html')

@app.route('/customers', methods=['GET'])
def get_customers_page():
    return render_template('customers.html')

@app.route('/products', methods=['GET'])
def get_products_page():
    return render_template('products.html')

@app.route('/reports', methods=['GET'])
def get_reports_page():
    return render_template('reports.html')

@app.route('/selfcheckout', methods=['GET'])
def get_selfcheckout_page():
    return render_template('selfcheckout.html')

# ============= CUSTOMER API ROUTES =============

@app.route('/customers/data', methods=['GET'])
def get_customers():
    try:
        # Establish db connection
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM Customers')
        rows = cursor.fetchall()                # this returns tuples by default, not dictionaries
        customers = [dict(row) for row in rows] # JSON representation without the dict() would be with brackets [[1, "John", "Doe"]] (by Flask)
        conn.close()
        return jsonify(customers)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# need a method to add customer
@app.route('/customers/add', methods=['POST'])
def register_customer():
    # Note: if you got this error,
    #       "An attempt was made to access a socket in a way forbidden by its access permissions (env),"
    #       run on another port by typing this command flask run --port=5001
    try:
        data = request.get_json()
        
        # Validate the input
        errors = validate_customer(data)
        if errors:
            print("Returning validation errors to client...") 
            return jsonify({'errors': errors}), 400
        
        # Establish db connection
        conn = get_db()
        cursor = conn.cursor() # to allow execute sql statement
        
        # Insert the new customer into the Customers table
        cursor.execute('INSERT INTO Customers (first_name, last_name, email, phone_number, rewards_points) VALUES (?, ?, ?, ?, ?) ', (data["first_name"], data["last_name"], data["email"], data["phone_number"], data["rewards_points"]))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Customer added successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/customers/delete/<int:customer_id>', methods=['DELETE'])
def delete_customer(customer_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM Customers WHERE customer_id = ?', (customer_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Customer deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= PRODUCT API ROUTES =============

@app.route('/api/products', methods=['GET'])
def get_products_api():
    """Alias for /products/data to match frontend API calls."""
    return get_products()

@app.route('/products/data', methods=['GET'])
def get_products():
    try:
        # Establish db connection
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM Products')
        rows = cursor.fetchall()                # this returns tuples by default, not dictionaries
        products = [dict(row) for row in rows] # JSON representation without the dict() would be with brackets [[1, "John", "Doe"]] (by Flask)
        conn.close()
        return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    """Get a single product by ID."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM Products WHERE product_id = ?', (product_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return jsonify(dict(row)), 200
        else:
            return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products', methods=['POST'])
def register_product_api():
    """Alias for /products/add to match frontend API calls."""
    return register_product()

# Method to add product (will wait on Ishi to make the Products table, but for now, relying on the ERD)
@app.route('/products/add', methods=['POST'])
def register_product():
    try:
        data = request.get_json()
        
        # Validate the input
        errors = validate_product(data)
        if errors:
            print("Returning validation errors to client...") 
            return jsonify({'errors': errors}), 400
        
        conn = get_db()
        cursor = conn.cursor() # to allow execute sql statement

        cursor.execute('INSERT INTO Products (name, price, epc, upc, available_stock, category, points_worth) VALUES (?, ?, ?, ?, ?, ? ,?) ', (data["name"], data["price"], data["epc"], data["upc"], data["available_stock"], data["category"], data["points_worth"]))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Product added successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product_api(product_id):
    """Alias for /products/update to match frontend API calls."""
    return update_product(product_id)

@app.route('/products/update/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.get_json()
        
        # Validate the input
        errors = validate_product(data)
        if errors:
            return jsonify({'errors': errors}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''UPDATE Products 
                         SET name = ?, price = ?, epc = ?, upc = ?, available_stock = ?, category = ?, points_worth = ?
                         WHERE product_id = ?''',
                      (data["name"], data["price"], data["epc"], data["upc"], 
                       data["available_stock"], data["category"], data["points_worth"], product_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Product updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product_api(product_id):
    """Alias for /products/delete to match frontend API calls."""
    return delete_product(product_id)

@app.route('/products/delete/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM Products WHERE product_id = ?', (product_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= SENSOR API ROUTES =============

@app.route('/api/sensors', methods=['GET'])
def get_sensors_data():
    """Get latest sensor data for both fridges."""
    try:
        # Fetch latest data for Sensor 1 (Frig1)
        sensor1_temp = SensorDataPoint.fetch_latest_sensor_data(1, "temperature")
        sensor1_humidity = SensorDataPoint.fetch_latest_sensor_data(1, "humidity")
        
        # Fetch latest data for Sensor 2 (Frig2)
        sensor2_temp = SensorDataPoint.fetch_latest_sensor_data(2, "temperature")
        sensor2_humidity = SensorDataPoint.fetch_latest_sensor_data(2, "humidity")
        
        response = {
            'sensor1': {
                'temperature': float(sensor1_temp.value) if sensor1_temp else 0,
                'humidity': float(sensor1_humidity.value) if sensor1_humidity else 0
            },
            'sensor2': {
                'temperature': float(sensor2_temp.value) if sensor2_temp else 0,
                'humidity': float(sensor2_humidity.value) if sensor2_humidity else 0
            }
        }
        
        return jsonify(response), 200
    except Exception as e:
        print(f"ERROR: Failed to fetch sensor data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/sensors/<int:sensor_id>/values', methods=['GET'])
def get_sensor_values(sensor_id):
    """Get all recent values for a specific sensor."""
    try:
        # Fetch sensor info
        sensor = Sensor.fetch_sensor_by_id(sensor_id)
        if not sensor:
            return jsonify({'error': 'Sensor not found'}), 404
        
        # Fetch latest temperature and humidity
        temp_data = SensorDataPoint.fetch_latest_sensor_data(sensor_id, "temperature")
        humidity_data = SensorDataPoint.fetch_latest_sensor_data(sensor_id, "humidity")
        
        response = {
            'sensor_id': sensor_id,
            'location': sensor.location,
            'temperature': {
                'value': float(temp_data.value) if temp_data else None,
                'timestamp': temp_data.created_at if temp_data else None
            },
            'humidity': {
                'value': float(humidity_data.value) if humidity_data else None,
                'timestamp': humidity_data.created_at if humidity_data else None
            }
        }
        
        return jsonify(response), 200
    except Exception as e:
        print(f"ERROR: Failed to fetch sensor values: {e}")
        return jsonify({'error': str(e)}), 500

# ============= FAN CONTROL ROUTES =============

@app.route('/fan/on', methods=['GET', 'POST'])
def turn_fan_on():
    """Turn on the fan for a specific fridge."""
    try:
        # Get sensor_id from query params or JSON body
        sensor_id = request.args.get('sensor_id', type=int) or request.get_json().get('sensor_id', 1) if request.is_json else 1
        
        # Determine which fridge based on sensor_id
        if sensor_id == 1:
            topic = "Frig1/fanControl"
            location = "Frig1"
        elif sensor_id == 2:
            topic = "Frig2/fanControl"
            location = "Frig2"
        else:
            return jsonify({'error': 'Invalid sensor_id'}), 400
        
        # Activate the fan via MQTT
        mqtt_service.ActivateFan(topic)
        
        print(f"INFO: Fan activated for {location}")
        return jsonify({'message': f'Fan turned on for {location}'}), 200
    except Exception as e:
        print(f"ERROR: Failed to turn on fan: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/fan/off', methods=['GET', 'POST'])
def turn_fan_off():
    """Turn off the fan for a specific fridge."""
    try:
        # Get sensor_id from query params or JSON body
        sensor_id = request.args.get('sensor_id', type=int) or request.get_json().get('sensor_id', 1) if request.is_json else 1
        
        # Determine which fridge based on sensor_id
        if sensor_id == 1:
            topic = "Frig1/fanControl"
            location = "Frig1"
        elif sensor_id == 2:
            topic = "Frig2/fanControl"
            location = "Frig2"
        else:
            return jsonify({'error': 'Invalid sensor_id'}), 400
        
        # Deactivate the fan via MQTT
        mqtt_service.DeactivateFan(topic)
        
        print(f"INFO: Fan deactivated for {location}")
        return jsonify({'message': f'Fan turned off for {location}'}), 200
    except Exception as e:
        print(f"ERROR: Failed to turn off fan: {e}")
        return jsonify({'error': str(e)}), 500

# ============= HELPER FUNCTIONS =============

if __name__ == '__main__':
    app.run(debug=True)
