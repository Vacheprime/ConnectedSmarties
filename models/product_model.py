from __future__ import annotations
from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from .exceptions.database_read_exception import DatabaseReadException
from contextlib import closing
import sqlite3

class Product(BaseModel):

    DB_TABLE = "Products"
    INVENTORY_TABLE = "ProductInventory"
    INVENTORY_BATCH_TABLE = "InventoryBatches"

    def __init__(self, name: str, price: float, epc: str, upc: int, category: str, points_worth: int = 0, producer_company: str = ""):
        super().__init__(Product.DB_TABLE)
        self.product_id = None
        self.name = name
        self.price = price
        self.epc = epc
        self.upc = upc
        self.category = category
        self.points_worth = points_worth
        self.producer_company = producer_company

    
    def to_dict(self) -> dict:
        return {
            "product_id": self.product_id,
            "name": self.name,
            "price": self.price,
            "epc": self.epc,
            "upc": self.upc,
            "category": self.category,
            "available_stock": self.get_inventory(self.product_id),
            "points_worth": self.points_worth,
            "producer_company": self.producer_company
        }
    

    # specify the date that the inventory batch was added
    @classmethod
    def add_inventory_batch(cls, product_id: int, quantity: int) -> None:
        # Check if product exists
        product = cls.fetch_product_by_id(product_id)
        if product is None:
            raise ValueError(f"Product with ID {product_id} does not exist.")
        
        if quantity <= 0:
            raise ValueError("Quantity to increase must be a positive integer.")
        
        # Insert a new inventory batch and update total stock in ProductInventory inside one transaction
        sql_insert_batch = f"""
        INSERT INTO {cls.INVENTORY_BATCH_TABLE} (product_id, quantity)
        VALUES (:product_id, :quantity);
        """

        sql_upsert_inventory = f"""
        INSERT INTO {cls.INVENTORY_TABLE} (product_id, total_stock)
        VALUES (:product_id, :quantity)
        ON CONFLICT(product_id) DO UPDATE SET total_stock = total_stock + :quantity;
        """

        sql_values = {
            "product_id": product_id,
            "quantity": quantity
        }

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Insert batch record
                cursor.execute(sql_insert_batch, sql_values)
                # Upsert inventory total_stock
                cursor.execute(sql_upsert_inventory, sql_values)
            except Exception as e:
                # Any failure should be reported as an insert error (transaction will roll back)
                raise DatabaseInsertException(f"An unexpected error occurred while adding inventory batch: {e}")
    
    @classmethod
    def _decrease_inventory(cls, product_id: int, quantity: int, cursor: sqlite3.Cursor) -> None:
        # Check if product exists
        product = cls.fetch_product_by_id(product_id)
        if product is None:
            raise ValueError(f"Product with ID {product_id} does not exist.")
        
        if quantity <= 0:
            raise ValueError("Quantity to decrease must be a positive integer.")
        
        # Get current stock
        current_stock = cls.get_inventory(product_id)

        if current_stock < quantity:
            quantity = current_stock  # Set to remove all available stock
        
        sql = f"""
        UPDATE {cls.INVENTORY_TABLE}
        SET total_stock = total_stock - :total_stock
        WHERE product_id = :product_id AND total_stock >= :total_stock;
        """

        sql_values = {
            "product_id": product_id,
            "total_stock": quantity
        }

        # Execute
        cursor.execute(sql, sql_values)
    

    @classmethod
    def get_inventory(cls, product_id: int) -> int:
        product = cls.fetch_product_by_id(product_id)
        if product is None:
            raise ValueError(f"Product with ID {product_id} does not exist.")

        sql = f"""
        SELECT total_stock FROM {cls.INVENTORY_TABLE} WHERE product_id = :product_id;
        """

        sql_values = {"product_id": product_id}

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Set fetch mode
                cursor.row_factory = sqlite3.Row
                
                # Execute
                cursor.execute(sql, sql_values)

                # Fetch one
                row = cursor.fetchone()
                if row is None:
                    return 0  # No inventory record found
            except Exception as e:
                raise DatabaseReadException(f"An unexpected error occurred while fetching product inventory: {e}")
        
        return int(row["total_stock"])
    

    @classmethod
    def insert_product(cls, product: Product) -> None:
        sql = f"""
        INSERT INTO {cls.DB_TABLE} (name, price, epc, upc, category, points_worth, producer_company)
        VALUES
        (:name, :price, :epc, :upc, :category, :points_worth, :producer_company);
        """

        sql_values = {
            "name": product.name,
            "price": product.price,
            "epc": product.epc,
            "upc": product.upc,
            "category": product.category,
            "points_worth": product.points_worth,
            "producer_company": product.producer_company
        }

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Execute
                cursor.execute(sql, sql_values)
            except Exception as e:
                raise DatabaseInsertException(f"An unexpected error occurred while inserting a product: {e}")
    

    @classmethod
    def fetch_all_products(cls) -> list[Product]:
        sql = f"""
        SELECT * FROM {cls.DB_TABLE} WHERE product_id != 0;
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
                row["points_worth"],
                row["producer_company"]
            )
            # Set ID
            product.product_id = int(row["product_id"])
            # Add the product
            products.append(product)
        
        return products


    @classmethod
    def fetch_product_by_id(cls, product_id: int) -> Product | None:
        sql = f"""
        SELECT * FROM {cls.DB_TABLE} WHERE product_id = :product_id;
        """

        sql_values = {"product_id": product_id}

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Set fetch mode
                cursor.row_factory = sqlite3.Row
                
                # Execute
                cursor.execute(sql, sql_values)

                # Fetch one
                row = cursor.fetchone()
            except Exception as e:
                raise DatabaseReadException(f"An unexpected error occurred while fetching the product with ID {product_id}: {e}")
    
        # Return if no results
        if row is None:
            return None
        
        # Map row to Product
        product = Product(
            row["name"],
            float(row["price"]),
            row["epc"],
            int(row["upc"]),
            row["category"],
            row["points_worth"],
            row["producer_company"]
        )
        # Set ID
        product.product_id = int(row["product_id"])

        return product
    

    @classmethod
    def update_product(cls, product: Product) -> None:
        sql = f"""
        UPDATE {cls.DB_TABLE}
        SET name = :name,
            price = :price,
            epc = :epc,
            upc = :upc,
            category = :category,
            points_worth = :points_worth,
            producer_company = :producer_company
        WHERE product_id = :product_id;
        """

        sql_values = {
            "product_id": product.product_id,
            "name": product.name,
            "price": product.price,
            "epc": product.epc,
            "upc": product.upc,
            "category": product.category,
            "points_worth": product.points_worth,
            "producer_company": product.producer_company
        }

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Execute
                cursor.execute(sql, sql_values)
            except Exception as e:
                raise DatabaseInsertException(f"An unexpected error occurred while updating the product with ID {product.product_id}: {e}")
    
    @classmethod
    def delete_product(cls, product_id: int) -> None:
        sql = f"""
        DELETE FROM {cls.DB_TABLE} WHERE product_id = :product_id;
        """

        sql_values = {"product_id": product_id}

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Execute
                cursor.execute("PRAGMA foreign_keys = ON;")  # Ensure foreign key constraints are enforced
                cursor.execute(sql, sql_values)
            except Exception as e:
                raise DatabaseInsertException(f"An unexpected error occurred while deleting the product with ID {product_id}: {e}")
