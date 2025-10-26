import re


class ValidationUtils:
    @staticmethod
    def is_string_numeric(value: str, min_inclusive: float = 0) -> bool:
        try:
            valueAsFloat = float(value)
            return valueAsFloat >= min_inclusive
        except (ValueError, TypeError):
            return False
        
    
    @staticmethod
    def is_boolean(value: str) -> bool:
        value = value.lower()
        return value == "false" or value == "true"
    

    @staticmethod
    def is_numeric_sensor_message_valid(msg: str) -> bool:
        regex = "\d+:-?\d+(.\d+)?"
        return re.fullmatch(regex, msg) != None


    @staticmethod
    def is_boolean_sensor_message_valid(msg: str) -> bool:
        regex = "\d+:(true|false)"
        return re.fullmatch(regex, msg, re.IGNORECASE) != None