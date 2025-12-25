import os
import sys
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGODB_URI: str
    GOOGLE_MAPS_API_KEY: str = ""
    JWT_SECRET: str = "supersecretkey"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    FRONTEND_URL: str = "http://localhost:5137"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding='utf-8'
    )

try:
    settings = Settings()
    print(f"DEBUG: Settings loaded. FRONTEND_URL={getattr(settings, 'FRONTEND_URL', 'MISSING')}", file=sys.stderr)
except Exception as e:
    print(f"DEBUG: Error loading settings: {e}", file=sys.stderr)
    # Fallback to prevent crash during import, but validate later
    class MockSettings:
        FRONTEND_URL = "http://localhost:5137"
        MONGODB_URI = ""
        def model_dump(self): return {}
    settings = MockSettings()