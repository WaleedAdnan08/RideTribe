import re

def normalize_phone(phone: str) -> str:
    """
    Normalize phone number by removing all non-digit characters.
    """
    return re.sub(r'\D', '', phone)