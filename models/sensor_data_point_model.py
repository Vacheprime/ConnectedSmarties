from __future__ import annotations

from models.utils.datetime_utils import DateTimeUtils
from .base_model import BaseModel
from .exceptions.database_insert_exception import DatabaseInsertException
from .exceptions.database_read_exception import DatabaseReadException
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
    def fetch_sensor_data_over_time(cls, data_type: str, start_date: str, end_date: str = None) -> list[SensorDataPoint]:
        sql = f"""
        WITH ordered AS (
            SELECT
                sensor_data_point_id,
                sensor_id,
                data_type,
                value,
                created_at,
                date(created_at) AS day,
                ROW_NUMBER() OVER (
                    PARTITION BY date(created_at)
                    ORDER BY created_at
                ) AS rn,
                COUNT(*) OVER (
                    PARTITION BY date(created_at)
                ) AS cnt
            FROM SensorDataPoints
            WHERE created_at BETWEEN :start_date AND :end_date
            AND data_type = :data_type
        ),
        selected AS (
            SELECT
                *,
                CASE
                    WHEN cnt <= 5 THEN rn 
                    ELSE CAST((rn - 1) * 5.0 / cnt AS INT) + 1
                END AS bucket
            FROM ordered
        ),
        chosen AS (
            SELECT
                day,
                bucket,
                MIN(sensor_data_point_id) AS chosen_id
            FROM selected
            WHERE bucket BETWEEN 1 AND 5
            GROUP BY day, bucket
        )
        SELECT s.*
        FROM SensorDataPoints s
        JOIN chosen c
        ON s.sensor_data_point_id = c.chosen_id
        ORDER BY s.created_at;
        """

        # Normalize start and end dates
        if start_date is None:
            raise ValueError("start_date must be provided")
        
        if end_date is None:
            end_date = start_date

        start_date = f"{start_date} 00:00:00" if len(start_date) == 10 else start_date
        end_date = f"{end_date} 23:59:59" if len(end_date) == 10 else end_date

        # Convert to utc time
        start_date_utc = DateTimeUtils.local_to_utc(start_date)
        end_date_utc = DateTimeUtils.local_to_utc(end_date)

        sql_values = {
            "data_type": data_type,
            "start_date": start_date_utc,
            "end_date": end_date_utc
        }

        with BaseModel._connectToDB() as connection, closing(connection.cursor()) as cursor:
            try:
                # Set the row factory
                cursor.row_factory = sqlite3.Row

                # Execute the sql
                cursor.execute(sql, sql_values)
                
                # Fetch all rows
                rows = cursor.fetchall()
                
                # Convert to SensorDataPoint objects
                sensor_data_points = []
                for row in rows:
                    sensor_data_point = SensorDataPoint(int(row["sensor_id"]), row["data_type"], row["value"])
                    sensor_data_point.sensor_data_point_id = int(row["sensor_data_point_id"])
                    sensor_data_point.created_at = DateTimeUtils.utc_to_local(row["created_at"])
                    sensor_data_points.append(sensor_data_point)

                return sensor_data_points
            except Exception as e:
                raise DatabaseReadException(f"An unexpected error occurred while fetching sensor data points: {e}")

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