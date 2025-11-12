from __future__ import annotations

from models.product_model import Product
from .base_model import BaseModel
from .customer_model import Customer
from .exceptions.database_insert_exception import DatabaseInsertException
from contextlib import closing

class Payment(BaseModel):

    DB_TABLE = "Payments"

    def __init__(self, customer_id: int):
        super().__init__(Payment.DB_TABLE)
        self.payment_id = None
        self.customer_id = customer_id
        self.products = []  # List of product associated with this payment
    

    def to_dict(self) -> dict:
        return {
            "customer_id": self.customer_id,
            "total_paid": self.get_total(),
            "reward_points_won": self.get_reward_points_won(),
        }
    

    def add_product(self, product: Product, quantity: int) -> None:
        self.products.append((product, quantity))
    

    def add_all_products(self, product_quantities: list[tuple[Product, int]]) -> None:
        self.products.extend(product_quantities)


    def get_reward_points_won(self) -> int:
        return sum(product.points_worth * quantity for product, quantity in self.products)
    
    
    def get_total(self) -> float:
        return round(sum(product.price * quantity for product, quantity in self.products), 2)


    @classmethod
    def insert_payment(cls, payment: Payment) -> None:
        """
        Inserts a new payment into the database along with associated products.

        Args:
            payment (Payment): The Payment object to insert.
        """
        sql_insert_payment = f"""
        INSERT INTO {cls.DB_TABLE} (customer_id, total_paid, reward_points_won)
        VALUES (:customer_id, :total_paid, :reward_points_won);
        """

        sql_insert_payment_product = """
        INSERT INTO PaymentProducts (payment_id, product_id, product_amount)
        VALUES (:payment_id, :product_id, :product_amount);
        """

        sql_values = payment.to_dict()

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Insert payment and capture the generated payment_id
                cursor.execute(sql_insert_payment, sql_values)
                payment_id = cursor.lastrowid
                payment.payment_id = payment_id

                # Update the customer's reward points
                Customer._increase_customer_points(payment.customer_id, payment.get_reward_points_won(), cursor)

                # Insert each product and its quantity into PaymentProducts
                for product, quantity in payment.products:
                    Product._decrease_inventory(product.product_id, quantity, cursor)
                    # Insert into PaymentProducts
                    cursor.execute(sql_insert_payment_product, {
                        "payment_id": payment_id,
                        "product_id": product.product_id,
                        "product_amount": quantity
                    })

            except Exception as e:
                raise DatabaseInsertException(f"An unexpected error occurred while inserting payment: {e}")
    

