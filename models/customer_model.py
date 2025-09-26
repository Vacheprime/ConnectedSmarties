

class Customer(BaseModel):
	DB_TABLE = "Customers"
	
	def __init__(self, first_name, last_name, email, phone_number):
		super().__init__(Customer.DB_TABLE)
		self.customer_id = None
		self.first_name = first_name
		self.last_name = last_name
		self.email = email
		self.phone_number = phone_number
		self.rewards_points = 0
	
	
