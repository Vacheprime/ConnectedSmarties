from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from contextlib import closing

class Customer(BaseModel):
	"""
	The Customer class is used to represent customers in the database.
	It is also used to execute customer related database queries.

	Parameters:
		DB_TABLE (str): The name of the customers database table .
		customer_id (id): The ID of the customer. Set automatically.
		first_name (str): Customer's first name.
        last_name (str): Customer's last name.
        email (str): Customer's email address.
        phone_number (str): Customer's phone number.
        rewards_points (int): Customer's reward points balance.
	"""

	DB_TABLE = "Customers"
	
	def __init__(self, first_name, last_name, email, phone_number):
		"""
        Constructor for a new Customer.
        
        Args:
            first_name (str): The customer's first name.
            last_name (str): The customer's last name.
            email (str): The customer's email address.
            phone_number (str): The customer's phone number.
        
        Returns:
            None
        """
		super().__init__(Customer.DB_TABLE)
		self.customer_id = None
		self.first_name = first_name
		self.last_name = last_name
		self.email = email
		self.phone_number = phone_number
		self.rewards_points = 0


	@staticmethod
	def insertCustomer(customer):
		"""
        Insert a new customer into the database.
        
        Args:
            customer (Customer): The Customer to insert into the database.
        
        Raises:
            DatabaseInsertException: If an error occurs during database insertion.
        """

		# Define the insert statement and values
		sql = """INSERT INTO Customers(first_name, last_name, email, phone_number, rewards_points)
			VALUES (:first_name, :last_name, :email, :phone_number, :rewards_points);
		"""
		sql_values = {
			"first_name": customer.first_name,
			"last_name": customer.last_name,
			"email": customer.email,
			"phone_number": customer.phone_number,
			"rewards_points": customer.rewards_points
		}

		# Get the connection and cursor
		with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
			try:
				# Execute the query
				cursor.execute(sql, sql_values)

				# Set the ID returned
				customer.customer_id = cursor.lastrowid

				# Commit
				connection.commit()
			except Exception as e:
				raise DatabaseInsertException(f"An unexpected error occured while inserting the customer: {e}")