# THIS CODE IS USED TO RECEIVE FORM DATA FROM THE HTML 
from flask import Flask, render_template, request, g
import sqlite3
import os
from mqtt_service import MQTTService

service = MQTTService("192.168.0.192")

app = Flask(__name__)

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
        
@app.route("/", methods=["GET", "POST"])
def register_customer():
    # Note: if you got this error,
    #       "An attempt was made to access a socket in a way forbidden by its access permissions (env),"
    #       run on another port by typing this command flask run --port=5001
    if(request.method == 'POST'):
        first_name = request.form['first_name']
        last_name = request.form['last_name']
        email = request.form['email']
        phone_number = request.form['phone_number']
        rewards_points = request.form['rewards_points']

        # Establish db connection
        conn = get_db()
        cursor = conn.cursor() # to allow execute sql statement

        # Insert the new customer into the Customers table
        cursor.execute('INSERT INTO Customers (first_name, last_name, email, phone_number, rewards_points) VALUES (?, ?, ?, ?, ?) ', (first_name, last_name, email, phone_number, rewards_points))
        conn.commit()
        conn.close()
        return f'Customer added'
    else:
        # Note: by default, Flask looks for HTML files inside folder named templates
        return render_template('customer_registration_form.html')

@app.route('/customers', methods=['GET'])
def get_customers():
    try:
        # Establish db connection
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM Customers')
        customers = cursor.fetchall()
        cursor.close()
        conn.commit()
        conn.close()
        return jsonify(customers)
    except Exception as e:
        return jsonify({'error: str(e)'}), 500

if __name__ == '__main__':
    app.run(debug=True)