from __future__ import annotations

from models.product_model import Product

from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from .exceptions.database_read_exception import DatabaseReadException
from .exceptions.database_delete_exception import DatabaseDeleteException
from contextlib import closing
import sqlite3

class ProductItem(BaseModel):

    DB_TABLE = "ProductItem"

    def __init__(self, epc: str, inventory_batch_id: int):
        super().__init__(ProductItem.DB_TABLE)
        self.product_item_id = None
        self.epc = epc
        self.inventory_batch_id = inventory_batch_id

    
    def to_dict(self) -> dict:
        return {
            "epc": self.epc,
            "inventory_batch_id": self.inventory_batch_id
        }

    
    @property
    def product(self) -> Product | None:
        if self.inventory_batch_id is None:
            return None
        
        return Product.fetch_product_by_inventory_batch_id(self.inventory_batch_id)

    
    @classmethod
    def from_row(cls, row: sqlite3.Row) -> ProductItem:
        product_item = cls(
            epc=row["epc"],
            inventory_batch_id=int(row["inventory_batch_id"])
        )
        product_item.product_item_id = int(row["product_item_id"])
        return product_item
    

    @classmethod
    def fetch_by_product_id(cls, product_id: int) -> list[ProductItem]:
        sql = f"""
        SELECT pi.* FROM {cls.DB_TABLE} pi
        JOIN InventoryBatches ib ON pi.inventory_batch_id = ib.inventory_batch_id
        WHERE ib.product_id = :product_id;
        """

        sql_params = {
            "product_id": product_id
        }

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(sql, sql_params)
                rows = cursor.fetchall()
            except sqlite3.Error as e:
                raise DatabaseReadException(f"Failed to read ProductItems for product_id {product_id} from database: {e}") from e
            
        product_items = [cls.from_row(row) for row in rows]
        return product_items


    @classmethod
    def fetch_by_epc(cls, epc: str) -> ProductItem | None:
        sql = f"""
        SELECT * FROM {cls.DB_TABLE}
        WHERE epc = :epc;
        """

        sql_params = {
            "epc": epc
        }

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(sql, sql_params)
                row = cursor.fetchone()
            except sqlite3.Error as e:
                raise DatabaseReadException(f"Failed to read ProductItem with epc {epc} from database: {e}") from e
            
        # Return None if no record found
        if row is None:
            return None

        # Build product item from row and return
        return cls.from_row(row)
    

    @classmethod
    def insert_bulk_items(cls, epcs: list[str], inventory_batch_id: int) -> None:
        sql = f"""
        INSERT INTO {cls.DB_TABLE} (epc, inventory_batch_id)
        VALUES (:epc, :inventory_batch_id);
        """

        data = [{"epc": epc, "inventory_batch_id": inventory_batch_id} for epc in epcs]

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.executemany(sql, data)
                connection.commit()
            except sqlite3.Error as e:
                raise DatabaseInsertException(f"Failed to insert bulk ProductItems into database: {e}") from e


    @classmethod
    def exists_product_item_with_epc_bulk(cls, epc_list: list[str]) -> str | None:
        if not epc_list:
            return None

        placeholders = ', '.join('?' for _ in epc_list)
        sql = f"""
        SELECT epc FROM {cls.DB_TABLE}
        WHERE epc IN ({placeholders})
        LIMIT 1;
        """

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.row_factory = sqlite3.Row
                cursor.execute(sql, epc_list)
                row = cursor.fetchone()
            except sqlite3.Error as e:
                raise DatabaseReadException(f"Failed to read ProductItems from database: {e}") from e

        if row is None:
            return None
        
        return row["epc"]


    @classmethod
    def delete_items_from_epcs(cls, epc_list: list[str]) -> None:
        if not epc_list:
            return

        placeholders = ', '.join('?' for _ in epc_list)
        sql = f"""
        DELETE FROM {cls.DB_TABLE}
        WHERE epc IN ({placeholders});
        """

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                cursor.execute(sql, epc_list)
                connection.commit()
            except sqlite3.Error as e:
                raise DatabaseDeleteException(f"Failed to delete ProductItems from database: {e}") from e


    @staticmethod
    def generate_bulk_epcs(start: int, end: int, prefix: str = "A") -> list[str]:
        epc_length = 24

        # Validate range
        if start > end:
            raise ValueError("Start value must be less than or equal to end value.")
        
        # Validate that the range can fit within the EPC length
        max_number_length = len(str(end))
        if len(prefix) + max_number_length > epc_length:
            raise ValueError("The provided range and prefix exceed the EPC length.")

        epcs = []
        for i in range(start, end + 1):
            number_str = str(i)
            zero_padding_length = epc_length - len(prefix) - len(number_str)
            zero_padding = '0' * zero_padding_length
            epc = f"{prefix}{zero_padding}{number_str}"
            epcs.append(epc)

        return epcs
    
    @staticmethod
    def epc_range_count(start: int, end: int) -> int:
        if start > end:
            raise ValueError("Start value must be less than or equal to end value.")
        return end - start + 1
