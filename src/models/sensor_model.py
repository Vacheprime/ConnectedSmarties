from __future__ import annotations
from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from contextlib import closing
import sqlite3

class Sensor(BaseModel):
    
    DB_TABLE = "Sensors"

    def __init__(self, sensor_type: str, location: str):
        super().__init__(Sensor.DB_TABLE)
        self.sensor_id = None
        self.sensor_type = sensor_type
        self.location = location

    def __str__(self) -> str:
        """To string method."""
        sid = self.sensor_id if self.sensor_id is not None else "None"
        return f"Sensor(sensor_id={sid}, sensor_type='{self.sensor_type}', location='{self.location}')"

    @classmethod
    def fetch_sensor_by_id(cls, sensor_id: int) -> Sensor | None:
        sql = f"""
        SELECT * FROM {cls.DB_TABLE}
        WHERE sensor_id = :sensor_id;
        """

        sql_values = {
            "sensor_id": sensor_id
        }

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            # Set fetch result mode
            cursor.row_factory = sqlite3.Row

            # Execute sql
            cursor.execute(sql, sql_values)

            # Fetch row
            row = cursor.fetchone()
            
            # Check if exists
            if row == None:
                return None

            # Convert to sensor object
            sensor = Sensor(row["sensor_type"], row["location"])
            sensor.sensor_id = int(row["sensor_id"])

            # Return sensor
            return sensor