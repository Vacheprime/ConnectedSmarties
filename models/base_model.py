import sqlite3


class BaseModel:
	"""
	BaseModel class represents the base model.
	It contains general methods for connecting to the database.
	
	Parameters:
		DB_NAME (str): Static variable for the DB Name.
		db_table (str): The name of the model's table. 
	"""
	
	DB_NAME = "ConnectedSmarties.db"
		
		
	def __init__(self, db_table):
		self.db_table = db_table
		
	
	@staticmethod
	def _connectToDB():
		# Return the database Connection
		return sqlite3.connect(BaseModel.DB_NAME)
