# THIS CODE IS USED TO RECEIVE FORM DATA FROM THE HTML 
from flask import Flask, render_template, request, g, jsonify
import sqlite3
import os
from .leds import success, fail # commented for now!!!!!!!!!!!!!!!!!!!
from flask_cors import CORS 

app = Flask(__name__)
CORS(app)

# Initialize db in way that db path won't break if Flask is running on a different working directory
db_path = os.path.join(os.path.dirname(__file__), "..", "db", "sql_connected_smarties.db")

# Make the math absolute
db_path = os.path.abspath(db_path)

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
        # OLD:
        # first_name = request.form['first_name']
        # last_name = request.form['last_name']
        # email = request.form['email']
        # phone_number = request.form['phone_number']
        # rewards_points = request.form['rewards_points']
        data = request.get_json()
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        email = data.get("email")
        phone_number = data.get("phone_number")
        rewards_points = data.get("rewards_points")

        # Establish db connection
        try:
            conn = get_db()
            cursor = conn.cursor() # to allow execute sql statement

            # Insert the new customer into the Customers table
            cursor.execute('INSERT INTO Customers (first_name, last_name, email, phone_number, rewards_points) VALUES (?, ?, ?, ?, ?) ', (first_name, last_name, email, phone_number, rewards_points))
            conn.commit()
            conn.close()
            return jsonify({'message': 'Customer added successfully'}), 200
        except Exception as e:
            fail() # commented for now!!!!!!!!!!!!!!!!!!! 
            return jsonify({'message': 'Failed to add Customer'}), 404
        success() # commented for now!!!!!!!!!!!!!!!!!!!
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)


