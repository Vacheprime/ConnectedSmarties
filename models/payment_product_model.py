from __future__ import annotations

from models.exceptions.database_read_exception import DatabaseReadException
from models.product_model import Product
from .base_model import BaseModel
from .customer_model import Customer
from .exceptions.database_insert_exception import DatabaseInsertException
from .product_model import Product
from contextlib import closing
import sqlite3

class PaymentProduct(BaseModel):

    DB_TABLE = "PaymentProducts"

    def __init__(self, payment_id: int, product_id: int, product_amount: int):
        super().__init__(PaymentProduct.DB_TABLE)
        self.payment_id: int = payment_id
        self.product_id: int = product_id
        self.product_amount: int = product_amount
        self.product_name: str = None
        self.product_price: float = None
        self.product_category: str = None
        self.product_points_worth: int = None
    

    def to_dict(self) -> dict:
        return {
            "payment_id": self.payment_id,
            "product_id": self.product_id,
            "product_amount": self.product_amount,
            "product_name": self.product_name,
            "product_price": self.product_price,
            "product_category": self.product_category,
            "product_points_worth": self.product_points_worth
        }
    

    @classmethod
    def fetch_payment_products_by_payment_id(cls, payment_id: int) -> list[PaymentProduct]:
        sql = f"""
        SELECT * FROM {cls.DB_TABLE}
        WHERE payment_id = :payment_id;
        """

        sql_params = {
            "payment_id": payment_id
        }

        payment_products: list[PaymentProduct] = []

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(sql, sql_params)
                rows = cursor.fetchall()
            except sqlite3.DatabaseError as e:
                raise DatabaseReadException(f"Failed to fetch PaymentProduct records: {e}") from e

        for row in rows:
            payment_product = PaymentProduct(
                payment_id=int(row["payment_id"]),
                product_id=int(row["product_id"]),
                product_amount=int(row["product_amount"])
            )
            payment_product.product_name = row["product_name"]
            payment_product.product_price = float(row["product_price"])
            payment_product.product_category = row["product_category"]
            payment_product.product_points_worth = int(row["product_points_worth"])
            payment_products.append(payment_product)
        
        return payment_products

    
    @classmethod
    def insert_payment_product(cls, payment_product: PaymentProduct) -> None:
        # Fetch the product
        product = Product.fetch_product_by_id(payment_product.product_id)
        if product is None:
            raise ValueError(f"Product with ID {payment_product.product_id} does not exist.")
        
        # Create a snapshot of values
        payment_product.product_name = product.name
        payment_product.product_price = product.price
        payment_product.product_category = product.category
        payment_product.product_points_worth = product.points_worth


        insert_sql = f"""
        INSERT INTO {cls.DB_TABLE} (payment_id, product_id, product_amount, product_name, product_price, product_category, product_points_worth)
        VALUES (:payment_id, :product_id, :product_amount, :product_name, :product_price, :product_category, :product_points_worth);
        """

        sql_params = payment_product.to_dict()

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.execute(insert_sql, sql_params)
                connection.commit()
            except sqlite3.DatabaseError as e:
                raise DatabaseInsertException(f"Failed to insert PaymentProduct record: {e}") from e