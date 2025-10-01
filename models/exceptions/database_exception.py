class DatabaseException(Exception):
    """Custom base error for all database related exceptions."""

    def __init__(self, *args):
        super().__init__(*args)