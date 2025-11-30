from __future__ import annotations

from models.exceptions.database_read_exception import DatabaseReadException
from models.product_model import Product
from models.payment_product_model import PaymentProduct
from .base_model import BaseModel
from .customer_model import Customer
from .exceptions.database_insert_exception import DatabaseInsertException
from .utils.datetime_utils import DateTimeUtils
from contextlib import closing
import sqlite3

class Payment(BaseModel):

    DB_TABLE = "Payments"

    def __init__(self, customer_id: int):
        super().__init__(Payment.DB_TABLE)
        self.payment_id = None
        self.customer_id = customer_id
        self.date = None
        self.products: list[PaymentProduct] = []  # List of product associated with this payment
    
    @property
    def total_paid(self) -> float:
        return self.get_total()

    def to_dict(self) -> dict:
        return {
            "customer_id": self.customer_id,
            "total_paid": self.get_total(),
            "reward_points_won": self.get_reward_points_won(),
        }
    

    def _assign_payment_id_to_products(self, payment_id: int) -> None:
        for payment_product in self.products:
            payment_product.payment_id = payment_id


    def add_product(self, product: Product, product_amount: int) -> None:
        self.products.append(PaymentProduct.from_product(payment_id=None, product=product, product_amount=product_amount))
    

    def add_all_products(self, payment_products: list[PaymentProduct]) -> None:
        self.products.extend(payment_products)


    def get_reward_points_won(self) -> int:
        return sum(payment_product.product_points_worth * payment_product.product_amount for payment_product in self.products)
    
    
    def get_total(self) -> float:
        return round(sum(payment_product.product_price * payment_product.product_amount for payment_product in self.products), 2)

    @classmethod
    def _build_payment_with_products(cls, row: sqlite3.row) -> Payment:
        # Create the payment
        payment = Payment(customer_id=row["customer_id"])
        payment.date = DateTimeUtils.utc_to_local(row["date"])
        payment.payment_id = int(row["payment_id"])
        
        # Fetch the associated products
        payment.products = PaymentProduct.fetch_payment_products_by_payment_id(payment.payment_id)

        return payment


    @classmethod
    def get_total_sales_amount(cls, start_date: str, end_date: str = None) -> float:
        """
        Calculates the total sales amount within a specified date range.

        Args:
            start_date (str): The start date in 'YYYY-MM-DD' format.
            end_date (str, optional): The end date in 'YYYY-MM-DD' format. Defaults to start_date.

        Returns:
            float: The total sales amount within the date range.
        """
        if start_date is None:
            raise ValueError("start_date must be provided")
        
        if end_date is None:
            end_date = start_date
        
        # Normalize dates
        start_date = f"{start_date} 00:00:00" if len(start_date) == 10 else start_date
        end_date = f"{end_date} 23:59:59" if len(end_date) == 10 else end_date

        # Convert to UTC for comparison
        start_date = DateTimeUtils.local_to_utc(start_date)
        end_date = DateTimeUtils.local_to_utc(end_date)

        sql = f"""
        SELECT SUM(total_paid) as total_sales FROM {cls.DB_TABLE}
        WHERE date BETWEEN :start_date AND :end_date;
        """

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(sql, {"start_date": start_date, "end_date": end_date})
                row = cursor.fetchone()
                total_sales = row["total_sales"] if row["total_sales"] is not None else 0.0
                return round(total_sales, 2)

            except Exception as e:
                raise DatabaseReadException(f"An unexpected error occurred while calculating total sales: {e}")


    @classmethod
    def fetch_payment_of_customer_by_product_id(cls, customer_id: int, product_id: int) -> list[Payment]:
        """
        Fetches all payments that include a specific product.

        Args:
            product_id (int): The ID of the product.

        Returns:
            list[Payment]: A list of Payment objects that include the specified product.
        """
        sql = f"""
        SELECT p.* FROM {cls.DB_TABLE} p
        INNER JOIN PaymentProducts pp ON p.payment_id = pp.payment_id
        WHERE pp.product_id = :product_id
        AND p.customer_id = :customer_id;
        """


        payments = []

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(sql, {"customer_id": customer_id, "product_id": product_id})
                rows = cursor.fetchall()

                for row in rows:
                    # Create the payment
                    payment = Payment._build_payment_with_products(row)
                    # Append payment to the list
                    payments.append(payment)

            except Exception as e:
                raise DatabaseReadException(f"An unexpected error occurred while fetching payments: {e}")

        return payments

    @classmethod
    def fetch_payments_of_customer_by_date(cls, customer_id: int, start_date: str, end_date: str = None) -> list[Payment]:
        """
        Fetches payments made by a specific customer within a date range.

        Args:
            customer_id (int): The ID of the customer.
            start_date (str): The start date in 'YYYY-MM-DD' format.
            end_date (str): The end date in 'YYYY-MM-DD' format.

        Returns:
            list[Payment]: A list of Payment objects associated with the customer in the date range.
        """
        if start_date is None:
            raise ValueError("start_date must be provided")
        
        if end_date is None:
            end_date = start_date

        # Normalize dates
        start_date = f"{start_date} 00:00:00" if len(start_date) == 10 else start_date
        end_date = f"{end_date} 23:59:59" if len(end_date) == 10 else end_date

        # Convert to UTC for comparison
        start_date = DateTimeUtils.local_to_utc(start_date)
        end_date = DateTimeUtils.local_to_utc(end_date)

        sql = f"""
        SELECT * FROM {cls.DB_TABLE}
        WHERE customer_id = :customer_id
        AND date BETWEEN :start_date AND :end_date
        ORDER BY date DESC;
        """

        payments = []

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(sql, {"customer_id": customer_id, "start_date": start_date, "end_date": end_date})
                rows = cursor.fetchall()

                for row in rows:
                    # Create the payment
                    payment = Payment._build_payment_with_products(row)
                    # Append payment to the list
                    payments.append(payment)

            except Exception as e:
                raise DatabaseReadException(f"An unexpected error occurred while fetching payments: {e}")

        return payments


    @classmethod
    def get_total_rewards_points_in_date_range(cls, start_date: str, end_date: str = None) -> int:
        """
        Calculates the total reward points won in a specified date range.

        Args:
            start_date (str): The start date in 'YYYY-MM-DD' format.
            end_date (str, optional): The end date in 'YYYY-MM-DD' format. Defaults to start_date.
        Returns:
            int: The total reward points won within the date range.
        """
        if start_date is None:
            raise ValueError("start_date must be provided")
        if end_date is None:
            end_date = start_date
        
        # Normalize dates
        start_date = f"{start_date} 00:00:00" if len(start_date) == 10 else start_date
        end_date = f"{end_date} 23:59:59" if len(end_date) == 10 else end_date

        # Convert to UTC for comparison
        start_date = DateTimeUtils.local_to_utc(start_date)
        end_date = DateTimeUtils.local_to_utc(end_date)

        sql = f"""
        SELECT SUM(reward_points_won) as total_rewards FROM {cls.DB_TABLE}
        WHERE date BETWEEN :start_date AND :end_date
        AND customer_id != 0;
        """

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(sql, {"start_date": start_date, "end_date": end_date})
                row = cursor.fetchone()
                total_rewards = row["total_rewards"] if row["total_rewards"] is not None else 0
                return int(total_rewards)

            except Exception as e:
                raise DatabaseReadException(f"An unexpected error occurred while calculating total reward points: {e}")


    @classmethod
    def fetch_payment_by_customer_id(cls, customer_id: int) -> list[Payment]:
        """
        Fetches all payments made by a specific customer.

        Args:
            customer_id (int): The ID of the customer.

        Returns:
            list[Payment]: A list of Payment objects associated with the customer.
        """
        sql = f"""
        SELECT * FROM {cls.DB_TABLE}
        WHERE customer_id = :customer_id
        ORDER BY date DESC;
        """

        payments = []

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(sql, {"customer_id": customer_id})
                rows = cursor.fetchall()

                for row in rows:
                    # Create the payment
                    payment = Payment._build_payment_with_products(row)
                    # Append payment to the list
                    payments.append(payment)

            except Exception as e:
                raise DatabaseReadException(f"An unexpected error occurred while fetching payments: {e}")

        return payments

    @staticmethod
    def get_payment_from_list(payments, payment_id):
        for p in payments:
            if int(p.payment_id) == int(payment_id):
                return p
        return None

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

        sql_fetch_payment = f"""
        SELECT date FROM {cls.DB_TABLE} WHERE payment_id = :payment_id;
        """

        sql_values = payment.to_dict()

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                # Insert payment and capture the generated payment_id
                cursor.execute(sql_insert_payment, sql_values)
                payment_id = cursor.lastrowid
                payment.payment_id = payment_id

                # Fetch the date from the inserted payment
                cursor.execute(sql_fetch_payment, {"payment_id": payment_id})
                payment_row = cursor.fetchone()
                if payment_row:
                    payment.date = DateTimeUtils.utc_to_local(payment_row["date"])

                # Update the customer's reward points
                Customer._increase_customer_points(payment.customer_id, payment.get_reward_points_won(), cursor)

            except Exception as e:
                raise DatabaseInsertException(f"An unexpected error occurred while inserting payment: {e}")

        # Insert the payment products
        payment._assign_payment_id_to_products(payment.payment_id)
        for payment_product in payment.products:
            PaymentProduct.insert_payment_product(payment_product)
        
        # Decrease inventory for each product
        for payment_product in payment.products:
            Product.decrease_inventory(payment_product.product_id, payment_product.product_amount)


