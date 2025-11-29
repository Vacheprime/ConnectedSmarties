from datetime import datetime
import pytz

class DateTimeUtils:
    @staticmethod
    def utc_to_local(utc_datetime: str, timezone='America/New_York') -> str:
        try:
            utc = datetime.fromisoformat(utc_datetime).replace(tzinfo=pytz.utc)
            local_timezone = pytz.timezone(timezone)
            local_datetime = utc.astimezone(local_timezone)
            return local_datetime.strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e:
            # Fallback to original string
            return utc_datetime