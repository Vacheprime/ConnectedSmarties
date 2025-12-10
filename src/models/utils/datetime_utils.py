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

    @staticmethod
    def local_to_utc(local_datetime: str, timezone='America/New_York') -> str:
        try:
            local_tz = pytz.timezone(timezone)
            local = local_tz.localize(datetime.fromisoformat(local_datetime))
            utc = local.astimezone(pytz.utc)
            return utc.strftime('%Y-%m-%d %H:%M:%S')
        except Exception as e:
            # Fallback to original string
            return local_datetime