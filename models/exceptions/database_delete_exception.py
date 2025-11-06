from .database_exception import DatabaseException

class DatabaseDeleteException(DatabaseException):
    """Custom exception for errors that happen while deleting data from the database."""

    def __init__(self, errorMessage):
        super().__init__(errorMessage)