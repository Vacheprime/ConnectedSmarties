import re

def validate_customer(data):
    errors = []
    name_pattern = r"^[A-Za-z]+(?:[-' ][A-Za-z]+)*$"

    required_fields =  ["first_name","last_name","email", "phone_number", "rewards_points"]
    
    if not data.get("first_name") or not data.get("last_name") or not data.get("email"):
        errors.append("Field is missing, must require the following fields: first name, last name, and email.")
    
    if not re.fullmatch(name_pattern, data["first_name"]) and not re.fullmatch(name_pattern, data["last_name"]):
        errors.append("Invalid Name Format")
        
    # GeeksForGeeks
    if data.get("email") and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data["email"]):
        errors.append("Invalid Email Format")
        
    # https://stackabuse.com/python-regular-expressions-validate-phone-numbers
    if data.get("phone_number") and not re.match(r"(\+\d{1,3})?\s?\(?\d{1,4}\)?[\s.-]?\d{3}[\s.-]?\d{4}", str(data["phone_number"])):
        errors.append("Phone Number Format")

    # Rewards must be integers
    if data.get("rewards_points") is not None:
        try:
            int(data["rewards_points"])
        except ValueError:
            errors.append("Reward points must be an integer")
    return errors

def validate_product(data):
    errors = []
    
    required_fields = ["name", "price", "epc", "upc", "available_stock", "category", "points_worth"]
    
    if not data.get("name") or not data.get("price") or not data.get("epc") or not data.get("upc"):
        errors.append("Field is missing, must require the following fields: name, price, epc, and upc.")
            
    # Price Validation
    try:
        price = float(data.get("price", 0))
        if price < 0:
            errors.append("Price cannot be negative")
    except ValueError:
        errors.append("Price must be a valid number")
        
    # Stock Validation
    try:
        stock = int(data.get("available_stock", 0))
        if stock < 0:
            errors.append("Stock cannot be negative")
    except ValueError:
        errors.append("Stock must be a valid integer")
        
    # Print errors in the terminal
    if errors:
        print("Validation errors:", errors)
    return errors