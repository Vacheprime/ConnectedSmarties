from __future__ import annotations
from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from .exceptions.database_read_exception import DatabaseReadException
from .exceptions.database_delete_exception import DatabaseDeleteException
from contextlib import closing
import sqlite3
import string
import secrets

class Admin(BaseModel):

    DB_TABLE = "Admins"
	
    def __init__(self):
        super().__init__(Admin.DB_TABLE)
		
        
    @classmethod
    def fetch_all_admin_emails(cls) -> list[str]:
        """Fetch all admin emails from the database."""
        query = f"SELECT email FROM {cls.DB_TABLE}"

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(query)
                rows = cursor.fetchall()
                return [row["email"] for row in rows]
            except sqlite3.Error as e:
                raise DatabaseReadException(f"Failed to fetch admin emails: {e}")