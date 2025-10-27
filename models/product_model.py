from __future__ import annotations
from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from .exceptions.database_read_exception import DatabaseReadException
from .exceptions.database_delete_exception import DatabaseDeleteException
from contextlib import closing
import sqlite3

class Product(BaseModel):

    DB_TABLE = "Products"

    def __init__(self, name: str, price: float, epc: str, upc: int, category: str, available_stock: int = 0, points_worth: int = 0):
        super().__init__(Product.DB_TABLE)
        self.product_id = None
        self.name = name
        self.price = price
        self.epc = epc
        self.upc = upc
        self.available_stock = available_stock
        self.category = category
        self.points_worth = points_worth

    
    def to_dict(self) -> dict:
        return {
            "product_id": self.product_id,
            "name": self.name,
            "price": self.price,
            "epc": self.epc,
            "upc": self.upc,
            "available_stock": self.available_stock,
            "category": self.category,
            "points_worth": self.points_worth
        }
    

    @classmethod
    def fetch_all_products(cls) -> list[Product]:
        sql = f"""
        SELECT * FROM {cls.DB_TABLE};
        """

        # Fetch DB data
        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Set fetch mode
                cursor.row_factory = sqlite3.Row
                
                # Execute
                cursor.execute(sql)

                # Get rows
                rows = cursor.fetchall()
            except Exception as e:
                raise DatabaseReadException(f"An unexpected error occured while fetching products: {e}")
        
        # Convert data to products
        products = []
        for row in rows:
            # Create product
            product = Product(
                row["name"],
                float(row["price"]),
                row["epc"],
                int(row["upc"]),
                row["category"],
                row["available_stock"],
                row["points_worth"]
            )
            # Set ID
            product.product_id = int(row["product_id"])
            # Add the product
            products.append(product)
        
        return products
        