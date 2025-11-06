from .database_exception import DatabaseException

class DatabaseReadException(DatabaseException):
    """Custom exception for errors that happen while fetching data from the database."""

    def __init__(self, errorMessage):
        super().__init__(errorMessage)