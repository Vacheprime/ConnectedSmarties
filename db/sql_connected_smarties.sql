DROP TABLE IF EXISTS Admins;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Memberships;
DROP TABLE IF EXISTS Sensors;
DROP TABLE IF EXISTS SensorDataPoints;

-- Create the admin table 
CREATE TABLE IF NOT EXISTS Admins (
  admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Create the customers table
CREATE TABLE IF NOT EXISTS Customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    qr_identification VARCHAR(255) DEFAULT NULL,
    has_membership BOOLEAN DEFAULT FALSE,
    rewards_points INTEGER DEFAULT 0
);

-- Memberships table
CREATE TABLE IF NOT EXISTS Memberships (
    membership_number INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER UNIQUE,
    join_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Create the products table
CREATE TABLE IF NOT EXISTS Products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price DECIMAL(5,2) NOT NULL,
    epc VARCHAR(64) NOT NULL CHECK(LENGTH(epc) > 0) UNIQUE,
    upc INTEGER NOT NULL,
    category TEXT,
    points_worth INTEGER DEFAULT 0
);

-- Create the Payments table
CREATE TABLE IF NOT EXISTS Payments ( 
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL, 
    `date` TEXT DEFAULT CURRENT_TIMESTAMP, 
    total_paid REAL DEFAULT 0,
    reward_points_won INTEGER DEFAULT 0,
    FOREIGN KEY(customer_id) REFERENCES Customers(customer_id) 
);

-- Create the PaymentProduct table
CREATE TABLE IF NOT EXISTS PaymentProducts (
    payment_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_amount INTEGER NOT NULL,
    PRIMARY KEY (payment_id, product_id),
    FOREIGN KEY (payment_id) REFERENCES Payments(payment_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- Create the Sensors table
CREATE TABLE IF NOT EXISTS Sensors (
    sensor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_type TEXT NOT NULL,
    `location` TEXT NOT NULL
);

-- Create the SensorDataPoints table
CREATE TABLE IF NOT EXISTS SensorDataPoints (
    sensor_data_point_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER NOT NULL,
    data_type TEXT NOT NULL,
    `value` TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES Sensors(sensor_id)
);

-- Create the Inventory batch table
CREATE TABLE IF NOT EXISTS InventoryBatches (
    inventory_batch_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    received_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- Create the ProductInventory table
CREATE TABLE IF NOT EXISTS ProductInventory (
    product_id INTEGER PRIMARY KEY,
    total_stock INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- For the Customers table
INSERT INTO Customers (first_name, last_name, email, password, phone_number, rewards_points)
VALUES ('Ishilia Gilcedes', 'Labrador', 'lalinglabrador@gmail.com', 'Password123!' ,'5145010503', 8);

INSERT INTO Customers (first_name, last_name, email, password, phone_number, rewards_points)
VALUES ('Danat Ali', 'Muradov', 'donutrallyr@gmail.com', 'Password123!', '123 456 789', 100);

INSERT INTO Customers (first_name, last_name, email, password, phone_number, rewards_points)
VALUES ('Florence Keith', 'Neflas', 'neflasflorence@gmail.com', 'Password123!' ,'5142246080', 5);

-- For memberships table
INSERT INTO Memberships (customer_id) VALUES (1);

-- For the Admins table
INSERT INTO Admins (email, password) VALUES 
('lalinglabrador@gmail.com', 'Password123!'),
('donutrallyr@gmail.com', 'Password123!'),
('nneflasflorencee@gmail.com', 'Password123!');

-- Insert both sensors
INSERT INTO Sensors (sensor_type, `location`)
VALUES
('temperature/humidity', 'Store 1: Fridge 1'),
('temperature/humidity', 'Store 1: Fridge 2');

-- Insert sample data into the database
INSERT INTO SensorDataPoints (sensor_id, data_type, value, created_at) VALUES
-- Fridge 1 (sensor_id = 1)
(1, 'temperature', '5.2', '2025-10-24 18:00:00'),
(1, 'humidity', '72.5', '2025-10-24 18:00:00'),
(1, 'temperature', '5.1', '2025-10-24 18:05:00'),
(1, 'humidity', '73.0', '2025-10-24 18:05:00'),
(1, 'temperature', '5.3', '2025-10-24 18:10:00'),
(1, 'humidity', '72.8', '2025-10-24 18:10:00'),
(1, 'temperature', '5.4', '2025-10-24 18:15:00'),
(1, 'humidity', '72.9', '2025-10-24 18:15:00'),

-- Fridge 2 (sensor_id = 2)
(2, 'temperature', '4.9', '2025-10-24 18:00:00'),
(2, 'humidity', '69.8', '2025-10-24 18:00:00'),
(2, 'temperature', '5.0', '2025-10-24 18:05:00'),
(2, 'humidity', '70.1', '2025-10-24 18:05:00'),
(2, 'temperature', '4.8', '2025-10-24 18:10:00'),
(2, 'humidity', '70.4', '2025-10-24 18:10:00'),
(2, 'temperature', '4.9', '2025-10-24 18:15:00'),
(2, 'humidity', '70.0', '2025-10-24 18:15:00');

-- Insert for Products table
INSERT INTO Products (name, price, epc, upc, category, points_worth) VALUES
('Organic Apple Juice 1L', 4.99, 'EPC001', 123456789012, 'Beverages', 10),
('Tropical Mango Smoothie 500ml', 6.99, 'EPC002', 123456789013, 'Beverages', 15),
('Dark Roast Coffee Beans 1kg', 14.99, 'EPC003', 123456789014, 'Groceries', 30),
('Whole Grain Bread', 3.99, 'EPC004', 123456789015, 'Bakery', 8),
('Fresh Pineapple', 5.99, 'EPC005', 123456789016, 'Fruits', 12),
('Avocado Toast Pack', 9.99, 'EPC006', 123456789017, 'Snacks', 20),
('Coconut Water 1L', 4.99, 'EPC007', 123456789018, 'Beverages', 10),
('Chocolate Chip Cookies', 7.99, 'EPC008', 123456789019, 'Snacks', 16),
('Vanilla Yogurt 4-pack', 5.99, 'EPC009', 123456789020, 'Dairy', 12),
('Green Tea Bags 25ct', 4.99, 'EPC010', 123456789021, 'Beverages', 10);


-- Insert for ProductInventory table
INSERT INTO ProductInventory (product_id, total_stock) VALUES
(1, 119),
(2, 78),
(3, 59),
(4, 198),
(5, 149),
(6, 89),
(7, 179),
(8, 129),
(9, 109),
(10, 169);

-- Insert for payments and payment products
INSERT INTO Payments (payment_id, customer_id, total_paid, reward_points_won) VALUES
(1, 1, 16.98, 42),
(2, 1, 9.98, 30),
(3, 2, 14.98, 30),
(4, 3, 17.97, 36),
(5, 3, 12.98, 28);

INSERT INTO PaymentProducts (payment_id, product_id, product_amount) VALUES
-- payment_id 1 
(1, 2, 2),
(1, 5, 1),
-- payment_id 2 (customer 1)
(2, 3, 1),
-- payment_id 3 (customer 2)
(3, 6, 1),
(3, 7, 1),
-- payment_id 4 (customer 3)
(4, 1, 1),
(4, 4, 2),
(4, 10, 1),
-- payment_id 5 (customer 3)
(5, 8, 1),
(5, 9, 1);
