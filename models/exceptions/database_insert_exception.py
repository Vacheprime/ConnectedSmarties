from .database_exception import DatabaseException

class DatabaseInsertException(DatabaseException):
    """Custom exception for errors that happen during the insertion of data into the database."""

    def __init__(self, errorMessage):
        super().__init__(errorMessage)
        