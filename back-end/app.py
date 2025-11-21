# THIS CODE IS USED TO RECEIVE FORM DATA FROM THE HTML 
from flask import Flask, render_template, request, g, jsonify, session, redirect, url_for
import sqlite3, sys, os
from datetime import datetime, date
from functools import wraps
from flask_cors import CORS

from models.payment_model import Payment
from models.customer_model import Customer
from models.product_model import Product
from models.exceptions.database_insert_exception import DatabaseInsertException
from models.exceptions.database_delete_exception import DatabaseDeleteException
from models.exceptions.database_read_exception import DatabaseReadException

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from validators import validate_customer, validate_product
    from mqtt_service import MQTTService
    from utils.email_service import EmailService
    from utils.password_reset import password_reset_bp
    from models.sensor_model import Sensor
    from models.sensor_data_point_model import SensorDataPoint
    from models.customer_model import Customer
    from models.product_model import Product
    from models.exceptions.database_insert_exception import DatabaseInsertException
    from models.exceptions.database_delete_exception import DatabaseDeleteException
    from models.exceptions.database_read_exception import DatabaseReadException
except ImportError:
    from .validators import validate_customer, validate_product
    from .mqtt_service import MQTTService
    from .utils.email_service import EmailService
    from .utils.password_reset import password_reset_bp
    from models.sensor_model import Sensor
    from models.sensor_data_point_model import SensorDataPoint
    from models.customer_model import Customer
    from models.product_model import Product
    from models.exceptions.database_insert_exception import DatabaseInsertException
    from models.exceptions.database_delete_exception import DatabaseDeleteException
    from models.exceptions.database_read_exception import DatabaseReadException

app = Flask(__name__)
CORS(app)
app.secret_key = "super-secret-key"
app.register_blueprint(password_reset_bp)

# Initialize db in way that db path won't break if Flask is running on a different working directory
# After pulling, run this: sqlite3 sql_connected_smarties.db < sql_connected_smarties.sql
db_path = os.path.join(os.path.dirname(__file__), "..", "db", "sql_connected_smarties.db")

# # Make the path absolute
# db_path = os.path.abspath(db_path)

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
    global TEMP_THRESHOLD_HIGH, TEMP_THRESHOLD_LOW
    
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

def query_db(query, args=(), one=False):
    db = get_db()
    cur = db.execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

from functools import wraps

def login_required(role=None):
    """Decorator to protect routes based on session role."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if "user_id" not in session:
                return redirect(url_for('get_login'))
            if role and session.get("role") != role:
                return jsonify({"error": "Unauthorized access"}), 403
            return f(*args, **kwargs)
        return wrapped
    return decorator

# ============= PAGE ROUTES =============

@app.route("/checkout", methods=["GET"])
def get_checkout_page():
    return render_template("selfcheckout.html", user_role=session.get("role"))

# get the HTML page        
@app.route("/", methods=["GET"])
def get_login():
    # If user is already logged in
    if "user_id" in session:
        if session.get("role") == "admin":
            return redirect(url_for("get_admin_home"))
        elif session.get("role") == "customer":
            return redirect(url_for("account"))
    
    return render_template("login.html")

@app.route("/go_to_reset", methods=["GET"])
def get_reset_password():
    return render_template('reset_password.html')

@app.route("/register", methods=["GET"])
def get_register_page():
    return render_template('register.html')

@app.route("/home", methods=["GET"])
@login_required(role="admin")
def get_admin_home():
    return render_template("home.html", user_role=session.get("role"))

@app.route('/customers', methods=['GET'])
@login_required(role="admin")
def get_customers_page():
    return render_template('customers.html', user_role=session.get("role"))

@app.route('/products', methods=['GET'])
@login_required(role="admin")
def get_products_page():
    return render_template('products.html', user_role=session.get("role"))

@app.route('/reports', methods=['GET'])
@login_required(role="admin")
def get_reports_page():
    return render_template('reports.html', user_role=session.get("role"))

@app.route('/selfcheckout', methods=['GET'])
def get_selfcheckout_page():
    return render_template('selfcheckout.html', user_role=session.get("role"))

# ============= LOGIN ROUTES =============
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    # Check Admin
    admin = query_db("SELECT * FROM Admins WHERE email = ? AND password = ?", (email, password), one=True)
    if admin:
        session["role"] = "admin"
        session["user_id"] = admin["admin_id"]
        return jsonify({"redirect": "/home"})

    # Check Customer
    customer = query_db("SELECT * FROM Customers WHERE email = ? AND password = ?", (email, password), one=True)
    if customer:
        session["role"] = "customer"
        session["user_id"] = customer["customer_id"]
        return jsonify({"redirect": "/account"})

    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('get_login'))

# ============= CUSTOMER API ROUTES =============

@app.route('/customers/data', methods=['GET'])
def get_customers():
    try:
        customers = Customer.fetch_all_customers()
        customers_list = [customer.to_dict() for customer in customers]
        return jsonify(customers_list), 200
    except DatabaseReadException as e:
        return jsonify({'error': str(e)}), 500

# need a method to add customer
@app.route('/customers/add', methods=['POST'])
def register_customer():
    data = request.get_json()
    
    # Validate the input
    errors = validate_customer(data)
    if errors:
        print("Returning validation errors to client...") 
        return jsonify({"success": False, "errors": errors}), 400
    
    # Create the customer object
    customer = Customer(data.get("first_name"), data.get("last_name"), data.get("email"), data.get("password"), data.get("phone_number"), rewards_points=data.get("rewards_points", 0))

    # Insert the customer
    try:                
        Customer.insertCustomer(customer)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    # Send an email confirmation with the member QR Code
    try:
        email_service.send_qr_code(customer.qr_identification, customer.email, f"{customer.first_name} {customer.last_name}", "Membership Registration Confirmation")
    except Exception as e:
        return jsonify({'success': True, "message": "Registration successful, but failed to send confirmation email."}), 200

    return jsonify({"success": True, "message": "Customer registered successfully."}), 200

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


# Route for verifying that a membership number exists
@app.route('/api/customers/verify_membership/<string:membership_number>', methods=['GET'])
def get_customer_by_membership(membership_number):
    try:
        customer = Customer.fetch_customer_by_membership(membership_number)
        if customer:
            return jsonify({'exists': True}), 200
        else:
            return jsonify({'exists': False}), 404
    except DatabaseReadException as e:
        return jsonify({'error': str(e)}), 500

# ============= CUSTOMER ACCOUNT ROUTES =============

@app.route("/account")
def account():
    if "user_id" not in session:
        return redirect("/")
    
    try:
        # Fetch customer
        customer = Customer.fetch_customer_by_id(int(session["user_id"]))

        if not customer:
            redirect("/logout")

        # Fetch customer payments
        payments = Payment.fetch_payment_by_customer_id(customer.customer_id)
    except DatabaseReadException as e:
        return jsonify({'error': str(e)}), 500
    
    return render_template("customer_account.html", customer=customer, payments=payments)

@app.route("/join-membership", methods=["POST"])
def join_membership():
    if "user_id" not in session:
        return jsonify({"error": "You must be logged in first."}), 403

    db = get_db()
    cursor = db.cursor()

    user_id = session["user_id"]

    # Check if already has membership
    cursor.execute("SELECT membership_number FROM memberships WHERE customer_id = ?", (user_id,))
    existing = cursor.fetchone()
    if existing:
        return jsonify({"error": "Already a member."}), 400

    # Create new membership
    cursor.execute("INSERT INTO memberships (customer_id) VALUES (?)", (user_id,))
    db.commit()

    cursor.execute("UPDATE Customers SET has_membership = TRUE WHERE customer_id = ?", (user_id,))
    db.commit()

    cursor.execute("SELECT membership_number FROM memberships WHERE customer_id = ?", (user_id,))
    row = cursor.fetchone()

    return jsonify({"success": True, "membership_number": row["membership_number"]})

# ============= PAYMENT API ROUTES =============

@app.route('/api/payments', methods=['POST'])
def process_payment():
    
    data = request.get_json()
    
    # Validate the data
    membership_number = data.get("membership_number")
    products = data.get("products")  # List of dicts with product_id and quantity
    
    # Validate the membership
    customer = None
    if membership_number != "NONE":
        try:
            customer = Customer.fetch_customer_by_membership(membership_number)
            if not customer:
                return jsonify({"success": False, "error": "Invalid membership number."}), 400
        except DatabaseReadException as e:
            return jsonify({"success": False, "error": str(e)}), 500

    # Check if products is not valid data
    if not products or not isinstance(products, list):
        return jsonify({"success": False, "error": "Invalid products data."}), 400
    
    # Create Payment object
    payment = Payment(customer.customer_id if customer else 0)
    # Loop and add products
    for item in products:
        try:
            product = Product.fetch_product_by_id(int(item.get("product_id")))
            if not product:
                return jsonify({"success": False, "error": f"Product ID {item.get('product_id')} not found."}), 400
            quantity = int(item.get("quantity", 1))
            payment.add_product(product, quantity)
        except DatabaseReadException as e:
            return jsonify({"success": False, "error": str(e)}), 500
        except ValueError:
            return jsonify({"success": False, "error": "Invalid quantity value."}), 400

    # Insert the payment
    try:
        Payment.insert_payment(payment)
    except DatabaseInsertException as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 500
    
    # Send a receipt confirmation email if customer exists
    if customer:
        print(customer.to_dict())
        try: 
            email_service.send_payment_receipt(customer.email, payment)
        except Exception as e:
            return jsonify({"success": False, "error": f"Payment processed but failed to send email: {str(e)}"}), 500

    return jsonify({"success": True, "message": "Payment processed successfully."}), 200

# ============= PRODUCT API ROUTES =============

@app.route('/api/products', methods=['GET'])
def get_products_api():
    """Alias for /products/data to match frontend API calls."""
    return get_products()


@app.route('/products/data', methods=['GET'])
def get_products():
    try:
        products = Product.fetch_all_products()
        products_list = [product.to_dict() for product in products]
        return jsonify(products_list), 200
    except DatabaseReadException as e:
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
    data = request.get_json()
    # Validate the input
    errors = validate_product(data)
    if errors:
        print("Returning validation errors to client...") 
        return jsonify({'errors': errors}), 400
    
    # Create the product object
    product = Product(data.get("name"), data.get("price"), data.get("epc"), data.get("upc"), data.get("category"), data.get("points_worth"), data.get("producer_company"))
    try:
        # Insert the product
        Product.insert_product(product)
        return jsonify({'message': 'Product added successfully'}), 200
    except DatabaseInsertException as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product_api(product_id):
    """Alias for /products/update to match frontend API calls."""
    return update_product(product_id)

@app.route('/products/update/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.get_json()

    # Validate the input
    errors = validate_product(data)
    if errors:
        return jsonify({'errors': errors}), 400
    
    try:
        # Get the product
        product = Product.fetch_product_by_id(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Update product fields
        product.name = data.get("name")
        product.price = float(data.get("price"))
        product.epc = data.get("epc")
        product.upc = int(data.get("upc"))
        product.category = data.get("category")
        product.points_worth = data.get("points_worth")
        product.producer_company = data.get("producer_company")

        # Save the updated product
        Product.update_product(product)

        # Return success response
        return jsonify({'message': 'Product updated successfully'}), 200
    except DatabaseReadException as e:
        return jsonify({'error': str(e)}), 500
    except DatabaseInsertException as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        print(f"ERROR: Failed to update product: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product_api(product_id):
    """Alias for /products/delete to match frontend API calls."""
    return delete_product(product_id)

@app.route('/products/delete/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        # Check if product exists
        product = Product.fetch_product_by_id(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Delete the product
        Product.delete_product(product_id)
        
        return jsonify({'message': 'Product deleted successfully'}), 200
    except DatabaseDeleteException as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        print(f"ERROR: Failed to delete product: {e}")
        return jsonify({'error': str(e)}), 500

# ============= RECEIPT DETAILS =============
@app.get("/receipt-details/<int:payment_id>")
def receipt_details(payment_id):

    customer_id = session.get("user_id")
    all_payments = Payment.fetch_payment_by_customer_id(customer_id)
    
    print("---- DEBUG ----")
    print("Payment ID requested:", payment_id)
    print("Payments available:", [p.payment_id for p in all_payments])
    
    # Find the exact payment
    payment = Payment.get_payment_from_list(all_payments, payment_id)

    if not payment:
        return jsonify(success=False, error="Payment not found")

    payment_date = payment.date
    if isinstance(payment_date, (datetime, date)):
        payment_date = payment_date.isoformat()

    # Format product list
    product_list = [
        {
            "name": product.name,
            "quantity": int(quantity),
            "price": float(product.price)
        }
        for product, quantity in payment.products
    ]

    return jsonify({
        "success": True,
        "date": payment.date,
        "total": float(payment.total_paid),
        "points": int(payment.get_reward_points_won()),
        "products": product_list
    })

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

# ============= THRESHOLD API ROUTES =============

@app.route('/api/threshold', methods=['GET'])
def get_threshold():
    """Get current temperature thresholds."""
    try:
        return jsonify({
            'high_threshold': TEMP_THRESHOLD_HIGH,
            'low_threshold': TEMP_THRESHOLD_LOW
        }), 200
    except Exception as e:
        print(f"ERROR: Failed to get thresholds: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/threshold', methods=['POST'])
def update_threshold():
    """Update temperature thresholds."""
    global TEMP_THRESHOLD_HIGH, TEMP_THRESHOLD_LOW
    try:
        data = request.get_json()
        
        if 'high_threshold' in data:
            TEMP_THRESHOLD_HIGH = float(data['high_threshold'])
        if 'low_threshold' in data:
            TEMP_THRESHOLD_LOW = float(data['low_threshold'])
        
        # Update the threshold callback with new values
        mqtt_service.set_threshold_callback(check_temperature_threshold)
        
        print(f"INFO: Thresholds updated - High: {TEMP_THRESHOLD_HIGH}°C, Low: {TEMP_THRESHOLD_LOW}°C")
        return jsonify({
            'message': 'Thresholds updated successfully',
            'high_threshold': TEMP_THRESHOLD_HIGH,
            'low_threshold': TEMP_THRESHOLD_LOW
        }), 200
    except Exception as e:
        print(f"ERROR: Failed to update thresholds: {e}")
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

# ============= PASSWORD RESET API ROUTES =============

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """Send password reset email."""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Check if email exists in database (Admin or Customer)
        admin = query_db("SELECT * FROM Admins WHERE email = ?", (email,), one=True)
        customer = query_db("SELECT * FROM Customers WHERE email = ?", (email,), one=True)
        
        if not admin and not customer:
            # For security, don't reveal if email exists or not
            return jsonify({'message': 'If an account exists with this email, a reset link has been sent.'}), 200
        
        sent = send_password_reset_email(email)

        if sent:
            return jsonify({'message': 'Password reset email sent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send email'}), 500
            # For now, just return success message
            print(f"INFO: Password reset requested for {email}")
        
    except Exception as e:
        print(f"ERROR: Failed to send reset email: {e}")
        return jsonify({'error': str(e)}), 500

# ============= HELPER FUNCTIONS =============

# ============= INVENTORY API ROUTES =============

@app.route('/api/inventory/add-batch', methods=['POST'])
@login_required(role="admin")
def add_inventory_batch():
    """Add a new inventory batch for a product."""
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity')
        received_date = data.get('received_date')
        
        # Validate inputs
        if not product_id or not quantity:
            return jsonify({'error': 'Product ID and quantity are required'}), 400
        
        if int(quantity) <= 0:
            return jsonify({'error': 'Quantity must be positive'}), 400
        
        # Add inventory batch
        Product.add_inventory_batch(int(product_id), int(quantity), received_date)
        
        return jsonify({'message': 'Inventory batch added successfully'}), 200
    except DatabaseInsertException as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        print(f"ERROR: Failed to add inventory batch: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
