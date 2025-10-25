from __future__ import annotations
from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from contextlib import closing

class SensorDataPoint(BaseModel):
    
    DB_TABLE = "SensorDataPoints"

    def __init__(self, sensor_id: int, data_type: str, value: str):
        super().__init__(SensorDataPoint.DB_TABLE)
        self.sensor_data_id = None
        self.sensor_id = sensor_id
        self.data_type = data_type
        self.value = value
    

    @classmethod
    def insert_sensor_data_point(cls, sensor_data_point: SensorDataPoint):
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
                sensor_data_point.sensor_data_id = cursor.lastrowid

                # Commit transaction
                connection.commit()
            except Exception as e:
                raise DatabaseInsertException(f"An unexpected error occurred while inserting the sensor data point: {e}")