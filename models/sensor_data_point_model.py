from __future__ import annotations

from models.utils.datetime_utils import DateTimeUtils
from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from contextlib import closing
import sqlite3

class SensorDataPoint(BaseModel):
    
    DB_TABLE = "SensorDataPoints"

    def __init__(self, sensor_id: int, data_type: str, value: str):
        super().__init__(SensorDataPoint.DB_TABLE)
        self.sensor_data_point_id = None
        self.sensor_id = sensor_id
        self.data_type = data_type
        self.value = value
        self.created_at = None
    

    @classmethod
    def insert_sensor_data_point(cls, sensor_data_point: SensorDataPoint) -> None:
        sql = f"""
        INSERT INTO {cls.DB_TABLE} (`sensor_id`, `data_type`, `value`)
        VALUES (:sensor_id, :data_type, :value);
        """

        sql_values = {
            "sensor_id": sensor_data_point.sensor_id,
            "data_type": sensor_data_point.data_type,
            "value": sensor_data_point.value
        }

        # Insert
        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Execute the sql
                cursor.execute(sql, sql_values)

                # Set the point id
                sensor_data_point.sensor_data_point_id = cursor.lastrowid

                # Commit transaction
                connection.commit()
            except Exception as e:
                raise DatabaseInsertException(f"An unexpected error occurred while inserting the sensor data point: {e}")
    

    @classmethod
    def fetch_latest_sensor_data(cls, sensor_id: int, data_type: str) -> SensorDataPoint | None:
        sql = f"""
        SELECT * FROM {cls.DB_TABLE}
        WHERE sensor_id = :sensor_id
        AND data_type = :data_type
        ORDER BY created_at DESC
        LIMIT 1;
        """

        sql_values = {
            "sensor_id": sensor_id,
            "data_type": data_type
        }

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            # Set the row factory
            cursor.row_factory = sqlite3.Row

            # Execute the sql
            cursor.execute(sql, sql_values)
            
            # Fetch the row
            row = cursor.fetchone()
            
            # Return no result if none exist
            if row == None:
                return None
            
            # Convert to SensorDataPoint object
            sensor_data_point = SensorDataPoint(row["sensor_id"], row["data_type"], row["value"])
            sensor_data_point.sensor_data_point_id = row["sensor_data_point_id"]
            sensor_data_point.created_at = DateTimeUtils.local_to_utc(row["created_at"])

            return sensor_data_point
    

    def __str__(self) -> str:
        return (
            f"SensorDataPoint("
            f"id={self.sensor_data_point_id!r}, "
            f"sensor_id={self.sensor_id!r}, "
            f"data_type={self.data_type!r}, "
            f"value={self.value!r}, "
            f"created_at={self.created_at!r}"
            f")"
        )