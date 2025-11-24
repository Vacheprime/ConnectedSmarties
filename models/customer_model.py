from __future__ import annotations
from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from .exceptions.database_read_exception import DatabaseReadException
from .exceptions.database_delete_exception import DatabaseDeleteException
from contextlib import closing
import sqlite3
import string
import secrets

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
	
	def __init__(self, first_name, last_name, email, password, phone_number=None, qr_identification=None, rewards_points=0):
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
		self.password = password
		self.phone_number = phone_number
		self.qr_identification = qr_identification
		self.rewards_points = rewards_points
		self.join_date = None
		self.qr_identification = qr_identification if qr_identification is not None else Customer.rand_alnum(10)


	def to_dict(self) -> dict:
		return {
			"customer_id": self.customer_id,
			"first_name": self.first_name,
			"last_name": self.last_name,
			"email": self.email,
			"password": self.password,
   			"phone_number": self.phone_number,
			"join_date": self.join_date,
			"qr_identification": self.qr_identification,
			"rewards_points": self.rewards_points
		}
	

	@classmethod
	def get_new_customer_count(cls, start_date: str, end_date: str = None) -> int:
		"""
		Calculates the number of new customers within a specified date range.

		Args:
			start_date (str): The start date in 'YYYY-MM-DD' format.
			end_date (str, optional): The end date in 'YYYY-MM-DD' format. Defaults to start_date.

		Returns:
			int: The number of returning customers within the date range.
		"""
		if start_date is None:
			raise ValueError("start_date must be provided")
		
		if end_date is None:
			end_date = start_date

		# Normalize the start and end dates
		start_date = f"{start_date} 00:00:00" if len(start_date) == 10 else start_date
		end_date = f"{end_date} 23:59:59" if len(end_date) == 10 else end_date

		sql = f"""
		SELECT COUNT(DISTINCT pa.customer_id) AS new_customer_count
		FROM Payments pa
		JOIN {cls.DB_TABLE} cu ON pa.customer_id = cu.customer_id
		WHERE pa.date BETWEEN :start_date AND :end_date
		AND cu.join_date > :start_date;
		"""

		sql_values = {
			"start_date": start_date,
			"end_date": end_date
		}

		with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
			try:
				cursor.row_factory = sqlite3.Row
				# Execute the query
				cursor.execute(sql, sql_values)

				# Fetch data
				rows = cursor.fetchone()

				return int(rows["new_customer_count"]) if rows["new_customer_count"] is not None else 0

			except Exception as e:
				raise DatabaseReadException(f"An unexpected error occurred while calculating new customers: {e}")

	

	@classmethod
	def get_returning_customer_count(cls, start_date: str, end_date: str = None) -> int:
		"""
		Calculates the number of returning customers within a specified date range.

		Args:
			start_date (str): The start date in 'YYYY-MM-DD' format.
			end_date (str, optional): The end date in 'YYYY-MM-DD' format. Defaults to start_date.

		Returns:
			int: The number of returning customers within the date range.
		"""
		if start_date is None:
			raise ValueError("start_date must be provided")
		
		if end_date is None:
			end_date = start_date

		# Normalize the start and end dates
		start_date = f"{start_date} 00:00:00" if len(start_date) == 10 else start_date
		end_date = f"{end_date} 23:59:59" if len(end_date) == 10 else end_date

		sql = f"""
		SELECT COUNT(DISTINCT pa.customer_id) AS returning_customer_count
		FROM Payments pa
		JOIN {cls.DB_TABLE} cu ON pa.customer_id = cu.customer_id
		WHERE pa.date BETWEEN :start_date AND :end_date
		AND cu.join_date < :start_date;
		"""

		sql_values = {
			"start_date": start_date,
			"end_date": end_date
		}

		with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
			try:
				cursor.row_factory = sqlite3.Row
				# Execute the query
				cursor.execute(sql, sql_values)

				# Fetch data
				rows = cursor.fetchone()

				return int(rows["returning_customer_count"]) if rows["returning_customer_count"] is not None else 0

			except Exception as e:
				raise DatabaseReadException(f"An unexpected error occurred while calculating returning customers: {e}")


	@classmethod
	def _increase_customer_points(cls, customer_id: int, points: int, cursor: sqlite3.Cursor) -> None:
		"""
		Increases the reward points of a customer by a specified amount.

		Args:
			customer_id (int): The ID of the customer whose points are to be increased.
			points (int): The number of points to add to the customer's balance.
			cursor (sqlite3.Cursor): The database cursor to use for the operation.

		Raises:
			DatabaseInsertException: If an error occurs during database update.
		"""

		sql = f"""
		UPDATE {cls.DB_TABLE}
		SET rewards_points = rewards_points + :points
		WHERE customer_id = :customer_id;
		"""

		sql_values = {
			"customer_id": customer_id,
			"points": points
		}

		# Execute
		cursor.execute(sql, sql_values)


	@staticmethod
	def rand_alnum(n=10):
		"""
		Generate a random alphanumeric string of length n.
		"""
		alphabet = string.ascii_letters + string.digits
		return ''.join(secrets.choice(alphabet) for _ in range(n))


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
		sql = """INSERT INTO Customers(first_name, last_name, email, password, phone_number, qr_identification, rewards_points)
			VALUES (:first_name, :last_name, :email, :password, :phone_number, :qr_identification, :rewards_points);
		"""
		sql_values = {
			"first_name": customer.first_name,
			"last_name": customer.last_name,
			"email": customer.email,
   			"password": customer.password,
			"phone_number": customer.phone_number,
			"qr_identification": customer.qr_identification,
			"rewards_points": customer.rewards_points,
			"qr_identification": customer.qr_identification
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
				raise DatabaseInsertException(f"An unexpected error occurred while inserting the customer: {e}")


	@classmethod
	def fetch_customer_by_id(cls, customer_id: int) -> Customer | None:
		"""
		Fetches a customer from the database by their ID.

		Args:
			customer_id (int): The ID of the customer to fetch.
		Returns:
			Customer | None: The Customer object if found, otherwise None.
		"""
		sql = f"""
		SELECT * FROM {cls.DB_TABLE} WHERE customer_id = :customer_id;
		"""

		sql_values = {"customer_id": customer_id}

		with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
			try:
				# Set the return mode
				cursor.row_factory = sqlite3.Row

				# Execute the query
				cursor.execute(sql, sql_values)

				# Fetch data
				row = cursor.fetchone()

				if row is None:
					return None

				# Map row to customer object
				customer = Customer(
					row["first_name"],
					row["last_name"],
					row["email"],
					row["password"],
					row["phone_number"],
					row["qr_identification"],
					int(row["rewards_points"])
				)
				customer.join_date = row["join_date"]

				customer.customer_id = int(row["customer_id"])

				return customer

			except Exception as e:
				raise DatabaseReadException(f"An unexpected error occured while fetching customer with ID {customer_id}: {e}")


	@classmethod
	def fetch_customer_by_membership(cls, membership_number: str) -> Customer | None:
		sql = f"""
		SELECT * FROM {cls.DB_TABLE} WHERE qr_identification = :membership_number;
		"""

		sql_values = {"membership_number": membership_number}

		with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
			try:
				# Set the return mode
				cursor.row_factory = sqlite3.Row

				# Execute the query
				cursor.execute(sql, sql_values)

				# Fetch data
				row = cursor.fetchone()

				if row is None:
					return None

				# Map row to customer object
				customer = Customer(
					row["first_name"],
					row["last_name"],
					row["email"],
					row["password"],
					row["phone_number"],
					row["qr_identification"],
					int(row["rewards_points"])
				)
				customer.join_date = row["join_date"]
				customer.customer_id = int(row["customer_id"])

				return customer

			except Exception as e:
				raise DatabaseReadException(f"An unexpected error occured while fetching customer with membership number {membership_number}: {e}")


	@classmethod
	def fetch_all_customers(cls) -> list[Customer]:
		sql = f"""
		SELECT * FROM {cls.DB_TABLE} WHERE customer_id != 0;
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
				row["rewards_points"]
			)
			customer.customer_id = int(row["customer_id"])
			customer.join_date = row["join_date"]
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
				cursor.execute("PRAGMA foreign_keys = ON;") # Ensure foreign key constraints are enforced
				cursor.execute(sql, sql_values)
			except Exception as e:
				raise DatabaseDeleteException(f"An unexpected error occured while deleting customer with ID {customer_id}: {e}")