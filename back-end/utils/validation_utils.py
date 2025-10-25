
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