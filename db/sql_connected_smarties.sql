-- DATABASE NAME: ConnectedSmarties.db 

-- Create the customers table
CREATE TABLE IF NOT EXISTS Customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT UNIQUE,
    rewards_points INTEGER DEFAULT 0
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
    FOREIGN KEY (sensor_id) REFERENCES Sensors(sensor_id)
);

ALTER TABLE SensorDataPoints ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

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

-- For the Customers table
INSERT INTO Customers (first_name, last_name, email, phone_number, rewards_points)
VALUES ('Ishilia Gilcedes', 'Labrador', 'lalinglabrador@gmail.com', '5145010503', 8);

INSERT INTO Customers (first_name, last_name, email, phone_number, rewards_points)
VALUES ('Danat Ali', 'Muradov', 'donutrallyr@gmail.com', '123 456 789', 100);

INSERT INTO Customers (first_name, last_name, email, phone_number, rewards_points)
VALUES ('Florence Keith', 'Neflas', 'neflasflorence@gmail.com', '5142246080', 300);

-- Insert both sensors
INSERT INTO Sensors (sensor_type, `location`)
VALUES
('temperature/humidity', 'Store 1: Fridge 1'),
('temperature/humidity', 'Store 1: Fridge 2');
