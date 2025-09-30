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

-- Insert sample data into the database

-- For the Customers table
INSERT INTO Customers (first_name, last_name, email, phone_number, rewards_points)
VALUES ('Ishilia Gilcedes', 'Labrador', 'lalinglabrador@gmail.com', '5145010503', 8);

INSERT INTO Customers (first_name, last_name, email, phone_number, rewards_points)
VALUES ('Danat Ali', 'Muradov', 'donutrallyr@gmail.com', '123 456 789', 100);

INSERT INTO Customers (first_name, last_name, email, phone_number, rewards_points)
VALUES ('Florence Keith', 'Neflas', 'neflasflorence@gmail.com', '5142246080', 300);
