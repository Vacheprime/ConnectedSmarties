import re

def validate_customer(data):
    errors = []
    name_pattern = r"^[A-Za-z]+(?:[-' ][A-Za-z]+)*$"

    required_fields =  ["first_name","last_name","email", "phone_number", "rewards_points"]
    
    if not data.get("first_name") or not data.get("last_name") or not data.get("email"):
        errors.append("Field is missing, must require the following fields: first name, last name, and email.")
    
    if (data.get("first_name") and not re.fullmatch(name_pattern, data["first_name"])) or \
       (data.get("last_name") and not re.fullmatch(name_pattern, data["last_name"])):
        errors.append("Invalid name format: only letters, spaces, hyphens, and apostrophes are allowed.")
        
    # GeeksForGeeks
    if data.get("email") and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data["email"]):
        errors.append("Invalid Email Format")
        
   # Use the same regex as customers.js for consistency (10 or more digits)
    if data.get("phone_number") and not re.fullmatch(r"\d{10,}", str(data["phone_number"])):
        errors.append("Phone number must be at least 10 digits.")

    # Rewards must be integers
    if data.get("rewards_points") is not None:
        try:
            int(data["rewards_points"])
        except ValueError:
            errors.append("Reward points must be an integer")
    return errors

def validate_product(data):
    errors = []
    
    required_fields = ["name", "price", "epc", "upc", "category", "points_worth"]
    
    if not data.get("name") or not data.get("price") or not data.get("epc"):
        errors.append("Field is missing, must require the following fields: name, price, epc.")
        
    # Validate name (allow letters, numbers and spaces)
    if data.get("name") and not re.match(r"^[A-Za-z0-9\s]+$", data["name"]):
        errors.append("Product name must contain only letters, numbers, and spaces.")
    
    # Validate category (letters and spaces only)
    if data.get("category") and not re.match(r"^[A-Za-z\s]+$", data["category"]):
        errors.append("Category must contain only letters and spaces.")
      
    # Price Validation
    try:
        price = float(data.get("price", 0))
        if price < 0:
            errors.append("Price cannot be negative")
    except ValueError:
        errors.append("Price must be a valid number")
        
    # UPC Validation (must be exactly 12 digits)
    upc = str(data.get("upc", "")).strip()
    if not re.fullmatch(r"\d{12}", upc):
        errors.append("UPC must be exactly 12 digits.")
    
    # EPC Validation (example: alphanumeric 4–24 characters)
    epc = str(data.get("epc", "")).strip()
    if not re.fullmatch(r"[A-Za-z0-9]{4,24}", epc):
        errors.append("EPC must be 4-24 alphanumeric characters (no spaces or symbols).")
    
    # Print errors in the terminal
    if errors:
        print("Validation errors:", errors)
    return errors
