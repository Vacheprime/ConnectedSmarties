from __future__ import annotations
from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from .exceptions.database_read_exception import DatabaseReadException
from .exceptions.database_delete_exception import DatabaseDeleteException
from contextlib import closing
import sqlite3

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
	def __init__(self, first_name, last_name, email, password=None, phone_number=None, qr_identification=None, has_membership=False, rewards_points=0):
		super().__init__(Customer.DB_TABLE)
		self.customer_id = None
		self.first_name = first_name
		self.last_name = last_name
		self.email = email
		self.password = password
		self.phone_number = phone_number
		self.qr_identification = qr_identification
		self.has_membership = has_membership
		self.rewards_points = rewards_points

	def to_dict(self) -> dict:
		return {
			"customer_id": self.customer_id,
			"first_name": self.first_name,
			"last_name": self.last_name,
			"email": self.email,
			"password": self.password,
   			"phone_number": self.phone_number,
			"qr_identification": self.qr_identification,
			"has_membership": self.has_membership,
			"rewards_points": self.rewards_points
		}


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
		sql = """INSERT INTO Customers(first_name, last_name, email, password, phone_number, qr_identification, has_membership ,rewards_points)
			VALUES (:first_name, :last_name, :email, :password, :phone_number, :qr_identification, :has_membership, :rewards_points);
		"""
		sql_values = {
			"first_name": customer.first_name,
			"last_name": customer.last_name,
			"email": customer.email,
   			"password": customer.password,
			"phone_number": customer.phone_number,
			"qr_identification": customer.qr_identification,
			"has_membership": customer.has_membership,
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


	@classmethod
	def fetch_all_customers(cls) -> list[Customer]:
		sql = f"""
		SELECT * FROM {cls.DB_TABLE};
		"""
		with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
			try:
				# Set the return mode
				cursor.row_factory = sqlite3.Row

				# Execute the quer
				cursor.execute(sql)

				# Fetch data
				rows = cursor.fetchall()
			except Exception as e:
				raise DatabaseReadException(f"An unexpected error occured while fetching all customers: {e}")
		
		# Map rows to customer objects
		customers = []
		for row in rows:
			customer = Customer(
				row["first_name"],
				row["last_name"],
				row["email"],
				row["password"],
				row["phone_number"],
				row["qr_identification"],
				row["has_membership"],
				row["rewards_points"]
			)
			customer.customer_id = int(row["customer_id"])
			customers.append(customer)

		return customers


	@classmethod
	def delete_customer(cls, customer_id: int) -> None:
		sql = f"""
		DELETE FROM {cls.DB_TABLE} WHERE customer_id = :customer_id;
		"""

		sql_values = {"customer_id": customer_id}

		with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
			try:
				cursor.execute(sql, sql_values)
			except Exception as e:
				raise DatabaseDeleteException(f"An unexpected error occured while deleting customer with ID {customer_id}: {e}")