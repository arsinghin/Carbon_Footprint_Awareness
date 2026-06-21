import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Carbon Footprint Awareness API"
    ENVIRONMENT: str = "development"
    
    # Database
    USE_MOCK_FIRESTORE: bool = True
    FIRESTORE_PROJECT_ID: str = "mock-carbon-awareness"
    
    # Auth
    USE_MOCK_AUTH: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
